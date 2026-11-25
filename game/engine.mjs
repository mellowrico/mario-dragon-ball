// Positions and velocities use logical pixels and seconds. Entity coordinates
// always describe the top-left corner, including while the hero transforms.
const TICK = 1 / 120
const GRAVITY = 1720
const RUN = 252
const FLOOR = 352
const WORLD = 3936
const SMALL = { w: 34, h: 46 }
const SUPER = { w: 42, h: 60 }
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
const across = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x
const platform = (x, y, w, h, type) => ({ x, y, w, h, type, used: false, bump: 0 })

function buildPlatforms() {
  const platforms = [
    [0, 1032], [1112, 636], [1824, 658], [2572, 660], [3312, WORLD - 3312]
  ].map(([x, w]) => platform(x, FLOOR, w, 90, 'ground'))
  for (const [x, y, w] of [[758, 279, 120], [1200, 276, 110], [1546, 267, 122], [2174, 275, 140], [2760, 269, 132], [3050, 235, 108], [3444, 272, 118]]) {
    platforms.push(platform(x, y, w, 22, 'ledge'))
  }
  for (const [index, x] of [368, 932, 1398, 2020, 2374, 2926, 3612].entries()) {
    const box = platform(x, 232, 40, 40, 'mystery')
    box.stars = index + 1
    platforms.push(box)
  }
  for (const x of [328, 408, 892, 1438, 2060, 2886, 3652]) {
    platforms.push(platform(x, 232, 40, 40, 'brick'))
  }
  return platforms
}

function hero(x) {
  return { x, y: FLOOR - SMALL.h, ...SMALL, vx: 0, vy: 0, facing: 1, grounded: true, powered: false, invincible: 0, coyote: 0.09, cooldown: 0 }
}

function enemy(x, left, right, type, speed) {
  return { x, y: FLOOR - 34, w: 34, h: 34, left, right, type, speed, facing: -1, alive: true }
}

export function createGame() {
  const pickups = []
  for (const [x, y, count] of [[217, 280, 3], [770, 234, 3], [1042, 243, 2], [1210, 234, 2], [1564, 220, 3], [1758, 241, 2], [2190, 230, 3], [2492, 240, 2], [2770, 222, 3], [3058, 190, 2], [3242, 240, 2], [3456, 224, 3]]) {
    for (let i = 0; i < count; i++) {
      pickups.push({ x: x + i * 37, y: y - Math.sin(Math.PI * i / Math.max(1, count - 1)) * 12, w: 17, h: 22, type: 'coin', stars: 0 })
    }
  }
  return {
    status: 'playing', time: 0, lives: 3, coins: 0, totalCoins: pickups.length, balls: 0, score: 0,
    cameraX: 0, worldWidth: WORLD, checkpointX: 1910, checkpointActive: false, finishX: 3780,
    player: hero(120), platforms: buildPlatforms(), pickups,
    enemies: [
      enemy(605, 548, 705, 'sprout', 41), enemy(870, 820, 942, 'imp', 30),
      enemy(1290, 1234, 1348, 'slug', 32), enemy(1638, 1560, 1695, 'sprout', 43),
      enemy(2160, 2110, 2242, 'imp', 41), enemy(2685, 2640, 2768, 'slug', 35),
      enemy(3100, 3020, 3150, 'sprout', 47), enemy(3538, 3470, 3590, 'imp', 39)
    ],
    shots: [], effects: [], events: [], remainder: 0, jumpHeld: false, jumpBuffer: 0
  }
}

function emit(s, type, x, y, life = 0.38) {
  s.events.push(type)
  s.effects.push({ type, x, y, life, maxLife: life })
}

function bump(s, box) {
  if (box.type !== 'brick' && box.type !== 'mystery') return
  box.bump = 0.2
  emit(s, 'bump', box.x + box.w / 2, box.y + box.h, 0.16)
  if (box.type !== 'mystery' || box.used) return
  box.used = true
  s.pickups.push({ x: box.x + 8, y: box.y - 24, w: 24, h: 24, vx: -61, vy: -175, stars: box.stars, type: 'ball', homeX: box.x })
}

function movePlayer(s, input) {
  const p = s.player
  const direction = Number(Boolean(input.right)) - Number(Boolean(input.left))
  const target = direction * RUN
  const accel = direction ? (p.grounded ? 1750 : 1200) : (p.grounded ? 2100 : 850)
  p.vx += clamp(target - p.vx, -accel * TICK, accel * TICK)
  if (direction) p.facing = direction
  if (s.jumpBuffer > 0 && (p.grounded || p.coyote > 0)) {
    p.vy = -705
    p.grounded = false
    p.coyote = 0
    s.jumpBuffer = 0
    s.events.push('jump')
  }
  s.jumpBuffer = Math.max(0, s.jumpBuffer - TICK)
  if (!input.jump && p.vy < -310) p.vy = -310
  const previousX = p.x
  p.x = clamp(p.x + p.vx * TICK, 0, WORLD - p.w)
  for (const b of s.platforms) {
    if (b.type === 'ledge' || !overlaps(p, b)) continue
    if (p.vx > 0 && previousX + p.w <= b.x + 0.01) p.x = b.x - p.w
    else if (p.vx < 0 && previousX >= b.x + b.w - 0.01) p.x = b.x + b.w
    else continue
    p.vx = 0
  }
  if (input.down && !p.grounded) p.vy = Math.max(440, p.vy)
  const oldTop = p.y
  const oldBottom = p.y + p.h
  p.vy = Math.min(p.vy + GRAVITY * TICK, 910)
  p.y += p.vy * TICK
  p.grounded = false
  const ceilings = []
  for (const b of s.platforms) {
    if (!across(p, b)) continue
    if (p.vy >= 0 && oldBottom <= b.y + 0.01 && p.y + p.h >= b.y) {
      p.y = b.y - p.h
      p.vy = 0
      p.grounded = true
    } else if (b.type !== 'ledge' && p.vy < 0 && oldTop >= b.y + b.h - 0.01 && p.y <= b.y + b.h) {
      ceilings.push(b)
    }
  }
  if (ceilings.length) {
    const center = p.x + p.w / 2
    ceilings.sort((a, b) => Math.abs(a.x + a.w / 2 - center) - Math.abs(b.x + b.w / 2 - center))
    p.y = ceilings[0].y + ceilings[0].h
    p.vy = 0
    bump(s, ceilings[0])
  }
  p.coyote = p.grounded ? 0.09 : Math.max(0, p.coyote - TICK)
  return oldBottom
}

function moveBall(s, ball) {
  const bottom = ball.y + ball.h
  ball.x += ball.vx * TICK
  ball.vy = Math.min(750, ball.vy + GRAVITY * TICK)
  ball.y += ball.vy * TICK
  for (const b of s.platforms) {
    if (!across(ball, b) || bottom > b.y + 0.01 || ball.y + ball.h < b.y || ball.vy < 0) continue
    ball.y = b.y - ball.h
    ball.vy = 0
    if (b.type === 'ground') ball.vx = 0
  }
  if (ball.y > 440) {
    ball.x = ball.homeX + 8
    ball.y = 206
    ball.vx = 0
    ball.vy = 0
  }
}

function resizePlayer(p, size) {
  p.x = clamp(p.x + (p.w - size.w) / 2, 0, WORLD - size.w)
  p.y += p.h - size.h
  Object.assign(p, size)
}

function collect(s) {
  const p = s.player
  for (let i = s.pickups.length - 1; i >= 0; i--) {
    const item = s.pickups[i]
    if (item.type === 'ball') moveBall(s, item)
    if (!overlaps(p, item)) continue
    s.pickups.splice(i, 1)
    if (item.type === 'ball') {
      if (!p.powered) {
        resizePlayer(p, SUPER)
        p.powered = true
      }
      p.invincible = Math.max(p.invincible, 1)
      s.balls++
      s.score += 500
    } else {
      s.coins++
      s.score += 100
    }
    emit(s, item.type, item.x + item.w / 2, item.y + item.h / 2)
  }
}

function hurt(s, falling = false) {
  const p = s.player
  if (!falling && p.invincible > 0) return
  emit(s, 'hit', p.x + p.w / 2, p.y + p.h / 2)
  if (!falling && p.powered) {
    resizePlayer(p, SMALL)
    p.powered = false
    p.invincible = 1.8
    return
  }
  s.lives--
  if (s.lives === 0) {
    s.status = 'lost'
    s.events.push('lost')
    return
  }
  s.player = hero(s.checkpointActive ? s.checkpointX : 120)
  s.player.invincible = 1.6
  s.shots.length = 0
  s.jumpBuffer = 0
  s.events.push('respawn')
}

function moveEnemies(s, oldBottom) {
  const p = s.player
  for (const e of s.enemies) {
    if (!e.alive) continue
    e.x += e.facing * e.speed * TICK
    if (e.x <= e.left || e.x >= e.right) {
      e.x = clamp(e.x, e.left, e.right)
      e.facing *= -1
    }
    if (!overlaps(p, e)) continue
    if (p.vy >= 0 && oldBottom <= e.y + 7) {
      e.alive = false
      p.y = e.y - p.h
      p.vy = -455
      p.grounded = false
      s.score += 200
      emit(s, 'stomp', e.x + e.w / 2, e.y + 6)
    } else {
      hurt(s)
      return
    }
  }
}

function fire(s, input) {
  const p = s.player
  p.cooldown = Math.max(0, p.cooldown - TICK)
  if (input.fire && p.powered && p.cooldown <= 0) {
    const shot = { x: p.x + (p.facing > 0 ? p.w : -16), y: p.y + p.h * 0.48, w: 16, h: 11, vx: p.facing * 490, life: 0.9 }
    s.shots.push(shot)
    p.cooldown = 0.3
    emit(s, 'ki', shot.x, shot.y, 0.17)
  }
  for (let i = s.shots.length - 1; i >= 0; i--) {
    const shot = s.shots[i]
    shot.x += shot.vx * TICK
    shot.life -= TICK
    const foe = s.enemies.find(e => e.alive && overlaps(shot, e))
    if (foe) {
      foe.alive = false
      s.score += 200
      emit(s, 'stomp', foe.x + foe.w / 2, foe.y + 6)
    }
    if (foe || shot.life <= 0 || s.platforms.some(b => b.type !== 'ledge' && overlaps(shot, b))) s.shots.splice(i, 1)
  }
}

function tick(s, input) {
  s.time += TICK
  s.player.invincible = Math.max(0, s.player.invincible - TICK)
  for (const b of s.platforms) b.bump = Math.max(0, b.bump - TICK)
  for (const e of s.effects) e.life -= TICK
  s.effects = s.effects.filter(e => e.life > 0)
  const oldBottom = movePlayer(s, input)
  collect(s)
  fire(s, input)
  moveEnemies(s, oldBottom)
  if (s.player.y > 465 && s.status === 'playing') hurt(s, true)
  const p = s.player
  s.cameraX = clamp(p.x - 322, 0, WORLD - 960)
  if (s.status !== 'playing') return
  if (!s.checkpointActive && p.x + p.w / 2 >= s.checkpointX) {
    s.checkpointActive = true
    emit(s, 'checkpoint', s.checkpointX, FLOOR - 70)
  }
  if (p.x + p.w / 2 >= s.finishX && p.y + p.h < FLOOR + 1) {
    s.status = 'won'
    s.score += 1000
    s.events.push('won')
  }
}

export function step(state, input = {}, dt = 1 / 60) {
  state.events.length = 0
  if (state.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return state
  if (input.jump && !state.jumpHeld) state.jumpBuffer = 0.12
  state.jumpHeld = Boolean(input.jump)
  state.remainder += Math.min(dt, 0.25)
  while (state.remainder + 1e-10 >= TICK && state.status === 'playing') {
    state.remainder = Math.max(0, state.remainder - TICK)
    tick(state, input)
  }
  return state
}
