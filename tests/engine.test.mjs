import assert from 'node:assert/strict'
import test from 'node:test'
import { createGame, step } from '../game/engine.mjs'

const frames = (s, input, count) => {
  for (let i = 0; i < count; i++) step(s, input)
}

function until(s, input, condition, max = 600) {
  for (let i = 0; i < max && !condition(); i++) step(s, input)
  assert.ok(condition(), 'Reached the target using controller input')
}

test('frame rates produce the same walk, camera, jumps and enemy patrols', () => {
  const a = createGame()
  const b = createGame()
  for (const input of [{ right: true }, { jump: true, right: true }, {}]) {
    for (let i = 0; i < 30; i++) step(a, input, 1 / 60)
    for (let i = 0; i < 15; i++) step(b, input, 1 / 30)
  }
  assert.deepEqual(a.player, b.player)
  assert.deepEqual(a.enemies, b.enemies)
  assert.equal(a.cameraX, b.cameraX)
  assert.equal(a.time, b.time)
})

test('a jump can be shortened, held across a landing, or interrupted by fast descent', () => {
  const full = createGame()
  const short = createGame()
  step(short, { jump: true })
  frames(short, {}, 14)
  frames(full, { jump: true }, 15)
  assert.ok(full.player.y < short.player.y - 25)
  step(full, { jump: true, down: true })
  assert.ok(full.player.vy > 400)
  frames(full, { jump: true }, 90)
  assert.equal(full.player.grounded, true)
  assert.equal(full.player.y + full.player.h, 352)
})

test('jumping onto a live enemy defeats it and bounces the hero', () => {
  const s = createGame()
  const e = s.enemies[0]
  Object.assign(s.player, { x: e.x, y: e.y - s.player.h - 2, vy: 220, grounded: false })
  step(s)
  assert.equal(e.alive, false)
  assert.equal(s.lives, 3)
  assert.ok(s.player.vy < 0)
  assert.ok(s.events.includes('stomp'))
})

test('collecting a dragon ball grows the hero and unlocks ranged ki damage', () => {
  const s = createGame()
  step(s, { fire: true })
  assert.equal(s.shots.length, 0)
  assert.equal(s.events.includes('ki'), false)
  const p = s.player
  const smallHeight = p.h
  const smallWidth = p.w
  s.pickups.push({ type: 'ball', stars: 1, x: p.x, y: 328, w: 24, h: 24, vx: 0, vy: 0 })
  step(s)
  assert.ok(p.h > smallHeight && p.w > smallWidth && p.powered)
  assert.equal(s.balls, 1)
  const enemy = s.enemies[0]
  p.x = enemy.x - 130
  step(s, { fire: true })
  assert.equal(s.shots.length, 1)
  assert.ok(s.events.includes('ki'))
  until(s, {}, () => !enemy.alive)
  assert.equal(s.shots.length, 0)
  assert.equal(s.lives, 3)
})

test('a powered hero shrinks on a side hit and gets temporary protection', () => {
  const s = createGame()
  const e = s.enemies[0]
  Object.assign(s.player, { w: 42, h: 60, powered: true, x: e.x - 5, y: 292 })
  step(s)
  assert.equal(s.player.powered, false)
  assert.equal(s.player.h, 46)
  assert.equal(s.player.y + s.player.h, 352)
  assert.ok(s.player.invincible > 0)
  frames(s, {}, 5)
  assert.equal(s.lives, 3)
})

test('pits cost lives, restore at the active checkpoint and eventually end the run', () => {
  const s = createGame()
  s.player.x = s.checkpointX
  step(s)
  assert.equal(s.checkpointActive, true)
  for (let life = 2; life >= 0; life--) {
    s.player.y = 490
    step(s)
    assert.equal(s.lives, life)
    if (life) assert.equal(s.player.x, s.checkpointX)
  }
  assert.equal(s.status, 'lost')
  const time = s.time
  frames(s, { right: true, jump: true }, 30)
  assert.equal(s.time, time)
})

test('all seven boxes can be opened and collected in a winning run using only controller input', () => {
  const s = createGame()
  const floor = s.platforms.filter(b => b.type === 'ground')
  function travelTo(x) {
    let jumpFrames = 0
    for (let frame = 0; s.player.x < x && frame < 600; frame++) {
      const p = s.player
      const center = p.x + p.w / 2
      const segment = floor.find(b => b.x <= center && b.x + b.w >= center)
      if (p.grounded && segment && segment.x + segment.w < s.worldWidth && segment.x + segment.w - center < 19) jumpFrames = 32
      step(s, { right: true, jump: jumpFrames > 0, fire: true })
      jumpFrames--
      if (s.status === 'won') break
    }
    assert.ok(s.player.x >= x || s.status === 'won', 'Arrived at the next destination')
  }
  const boxes = s.platforms.filter(b => b.type === 'mystery')
  for (const [index, box] of boxes.entries()) {
    travelTo(box.x + box.w / 2 - s.player.w / 2 - 15)
    until(s, { fire: true }, () => s.player.vx === 0 && s.player.grounded)
    until(s, { jump: true, fire: true }, () => box.used, 60)
    until(s, { fire: true }, () => s.balls > index || s.pickups.some(item => item.type === 'ball' && item.vx === 0))
    until(s, { left: true, fire: true }, () => s.balls === index + 1)
    assert.ok(s.player.powered)
  }
  travelTo(s.finishX)
  assert.equal(s.status, 'won')
  assert.equal(s.lives, 3)
  assert.equal(s.balls, 7)
  assert.equal(s.checkpointActive, true)
  assert.ok(s.enemies.some(e => !e.alive))
  assert.ok(s.coins > 0 && s.coins <= s.totalCoins)
  assert.equal(s.cameraX, s.worldWidth - 960)
})
