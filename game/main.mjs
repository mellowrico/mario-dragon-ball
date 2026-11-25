import { createGame, step } from './engine.mjs'
import { render } from './render.mjs'
import { bindControls } from './input.mjs'

const byId = id => document.getElementById(id)
const world = byId('world')
let game = createGame()
let mode = 'ready'
let audio
let muted = false
try { muted = localStorage.getItem('ki-arcade-muted') === '1' } catch {}
let toastUntil = 0
let previous = 0
let clock = 0

function wakeAudio() {
  const Audio = window.AudioContext || window.webkitAudioContext
  if (!Audio || muted) return
  try {
    audio ??= new Audio()
    if (audio.state === 'suspended') audio.resume().catch(() => {})
  } catch {}
}

const melodies = {
  jump: [210,520], bump: [112,78], coin: [872,1240], ball: [440,554,659,880],
  ki: [620,155], stomp: [185,82], hit: [248,128,75], checkpoint: [523,659,784],
  won: [392,523,659,784,1046], lost: [294,220,165,110], start: [330,440,660]
}
function playSound(name) {
  if (muted || !audio || audio.state !== 'running' || !melodies[name]) return
  const notes = melodies[name]
  const start = audio.currentTime
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.type = name === 'ki' ? 'sawtooth' : 'square'
  oscillator.connect(gain).connect(audio.destination)
  const duration = notes.length > 2 ? 0.083 : 0.052
  notes.forEach((hz, i) => oscillator.frequency.setValueAtTime(hz, start + i * duration))
  gain.gain.setValueAtTime(0.001, start)
  gain.gain.exponentialRampToValueAtTime(0.043, start + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.001, start + notes.length * duration)
  oscillator.start(start)
  oscillator.stop(start + notes.length * duration + .01)
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
}

function updateSound() {
  const button = byId('sound')
  button.setAttribute('aria-pressed', String(!muted))
  button.setAttribute('aria-label', muted ? 'Włącz dźwięk' : 'Wyłącz dźwięk')
  button.querySelector('use').setAttribute('href', muted ? '#i-mute' : '#i-sound')
}
byId('sound').onclick = () => {
  muted = !muted
  try { localStorage.setItem('ki-arcade-muted', muted ? '1' : '0') } catch {}
  updateSound()
  wakeAudio()
  if (!muted) playSound('coin')
}
updateSound()

const full = byId('fullscreen')
if (!document.fullscreenEnabled) full.hidden = true
full.onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  } catch { announce('Pełny ekran niedostępny') }
}
document.addEventListener('fullscreenchange', () => {
  const label = document.fullscreenElement ? 'Zamknij pełny ekran' : 'Pełny ekran'
  full.querySelector('span').textContent = label
  full.setAttribute('aria-label', label)
})

const labels = {ready:'GOTOWY',play:'W GRZE',pause:'PAUZA',won:'META',lost:'KONIEC GRY'}
function setMode(next) {
  mode = next
  byId('mode').textContent = labels[next]
  byId('overlay').hidden = next === 'play'
  byId('overlay').classList.toggle('modal', next !== 'ready' && next !== 'play')
  byId('welcome').hidden = next !== 'ready'
  byId('dialog').hidden = next === 'ready' || next === 'play'
  byId('pause').disabled = next !== 'play' && next !== 'pause'
  byId('pause').setAttribute('aria-label', next === 'pause' ? 'Wznów grę' : 'Pauza')
  byId('pause').querySelector('use').setAttribute('href', next === 'pause' ? '#i-play' : '#i-pause')
  controls.clear()
  if (next === 'play') {
    world.focus({preventScroll:true})
    return
  }
  byId('announcement').textContent = ''
  if (next === 'ready') return
  const paused = next === 'pause'
  byId('dialog-title').textContent = paused ? 'Pauza' : next === 'won' ? 'Plansza ukończona!' : 'Koniec gry'
  byId('dialog-text').textContent = paused ? 'Smocze Wyspy poczekają.' : 'Wynik ' + game.score + ' · Smocze Kule ' + game.balls + '/7'
  byId('primary').textContent = paused ? 'WZNÓW GRĘ' : 'ZAGRAJ PONOWNIE'
  byId('restart').hidden = !paused
  byId('primary').focus({preventScroll:true})
}

function announce(message) {
  byId('announcement').textContent = message
  toastUntil = performance.now() + 1900
}
function start() {
  game = createGame()
  wakeAudio()
  playSound('start')
  setMode('play')
  refreshHud()
  followPlayer()
}
function enter() {
  if (mode === 'pause') setMode('play')
  else if (mode !== 'play') start()
}
function togglePause() {
  if (mode === 'play') setMode('pause')
  else if (mode === 'pause') setMode('play')
}
const controls = bindControls({
  stick:byId('stick'), jumpButton:byId('touch-jump'), fireButton:byId('touch-fire'),
  isPlaying:() => mode === 'play', onPause:togglePause, onEnter:enter
})
world.tabIndex = -1
byId('pause').onclick = togglePause
byId('start').onclick = start
byId('restart').onclick = start
byId('primary').onclick = enter
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') setMode('pause') })
window.addEventListener('blur', () => { if (mode === 'play') setMode('pause') })

// On a tall phone the same scene fills the screen with a tighter camera.
let cropWidth = 0
new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect
  cropWidth = Math.max(0, 960 - 420 * width / height)
}).observe(world)
function followPlayer() {
  if (cropWidth < 1) return
  const viewWidth = 960 - cropWidth
  const offset = Math.max(0, Math.min(cropWidth, game.player.x - game.cameraX - viewWidth / 3))
  world.style.setProperty('--camera', (offset / cropWidth * 100) + '%')
}

let hudValues = ''
function refreshHud() {
  const progress = game.status === 'won' ? 100 : Math.max(0, Math.min(100, Math.floor((game.player.x - 120) / (game.finishX - 120) * 100)))
  const key = [game.lives, game.coins, game.balls, game.score, progress].join('/')
  if (hudValues === key) return
  hudValues = key
  byId('lives').replaceChildren(...[0,1,2].map(i => {
    const heart = document.createElement('i')
    heart.className = 'heart' + (i < game.lives ? '' : ' empty')
    return heart
  }))
  byId('lives').setAttribute('aria-label', 'Pozostałe życia: ' + game.lives)
  byId('coins').textContent = String(game.coins).padStart(2,'0')
  byId('balls').textContent = game.balls
  byId('score').textContent = String(game.score).padStart(6,'0')
  byId('progress').style.width = progress + '%'
  byId('progress').parentElement.setAttribute('aria-valuenow', String(progress))
  byId('percent').textContent = progress + '%'
}

function frame(now) {
  const dt = Math.min((now - (previous || now)) / 1000, 0.06)
  previous = now
  if (mode === 'play') {
    step(game, controls.read(), dt)
    for (const event of game.events) {
      playSound(event)
      if (event === 'ball') announce(game.balls === 1 ? 'MOC KI ODBLOKOWANA!' : 'SMOCZA KULA ' + game.balls + '/7')
      else if (event === 'checkpoint') announce('PUNKT KONTROLNY')
      else if (event === 'respawn') announce('SPRÓBUJ JESZCZE RAZ')
    }
    if (game.status !== 'playing') setMode(game.status)
    refreshHud()
    followPlayer()
  }
  if (now > toastUntil && byId('announcement').textContent) byId('announcement').textContent = ''
  if (mode === 'ready' || mode === 'play') clock += dt
  render(world, game, clock)
  requestAnimationFrame(frame)
}
refreshHud()
requestAnimationFrame(frame)
