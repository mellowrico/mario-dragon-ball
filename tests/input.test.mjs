import assert from 'node:assert/strict'
import test from 'node:test'
import { bindControls } from '../game/input.mjs'

class Control extends EventTarget {
  constructor(ownerDocument) {
    super()
    this.ownerDocument = ownerDocument
    this.knob = { style: {} }
    this.captured = new Set()
    this.classList = new Set()
    this.classList.remove = token => this.classList.delete(token)
  }

  querySelector() { return this.knob }
  getBoundingClientRect() { return { left: 20, width: 100 } }
  hasPointerCapture(id) { return this.captured.has(id) }
  setPointerCapture(id) { this.captured.add(id) }
  releasePointerCapture(id) { this.captured.delete(id) }
}

function send(element, type, properties = {}) {
  const event = new Event(type, { cancelable: true })
  for (const [key, value] of Object.entries(properties)) {
    Object.defineProperty(event, key, { value })
  }
  element.dispatchEvent(event)
  return event
}

const idle = { left: false, right: false, jump: false, down: false, fire: false }

function fixture() {
  const document = new EventTarget()
  document.defaultView = new EventTarget()
  const stick = new Control(document)
  const jumpButton = new Control(document)
  const fireButton = new Control(document)
  let playing = true
  const actions = []
  const controls = bindControls({
    stick, jumpButton, fireButton,
    isPlaying: () => playing,
    onPause: () => actions.push('pause'),
    onEnter: () => actions.push('enter')
  })
  return {
    ...controls, stick, jumpButton, fireButton, document, actions,
    setPlaying: value => { playing = value },
    key: (type, key, properties) => send(document.defaultView, type, { key, ...properties })
  }
}

test('maps held keys and keeps aliases active until every corresponding key is released', () => {
  const { key, read } = fixture()
  assert.equal(key('keydown', 'D', { code: 'KeyD' }).defaultPrevented, true)
  key('keydown', 'ArrowRight')
  key('keydown', 's')
  key('keydown', 'W')
  key('keydown', 'Unidentified', { code: 'Space' })
  assert.deepEqual(read(), { ...idle, right: true, jump: true, down: true, fire: true })
  key('keyup', 'd', { code: 'KeyD' })
  assert.equal(read().right, true)
  key('keyup', 'ArrowRight')
  key('keyup', 's')
  key('keyup', 'w')
  key('keyup', ' ', { code: 'Space' })
  assert.deepEqual(read(), idle)
})

test('pause and Enter ignore repeats while Enter preserves the focused button default', () => {
  const { key, setPlaying, actions } = fixture()
  const button = { closest: selector => selector.startsWith('button') }
  assert.equal(key('keydown', 'Enter').defaultPrevented, false)
  key('keydown', 'Escape')
  key('keydown', 'p', { repeat: true })
  setPlaying(false)
  assert.equal(key('keydown', 'Enter', { target: button }).defaultPrevented, false)
  assert.equal(key('keydown', 'ArrowRight').defaultPrevented, false)
  assert.equal(key('keydown', 'Enter').defaultPrevented, true)
  key('keydown', 'Enter', { repeat: true })
  assert.deepEqual(actions, ['pause', 'enter'])
})

test('touch direction and two held action buttons have independent pointer capture', () => {
  const { read, stick, jumpButton, fireButton } = fixture()
  send(stick, 'pointerdown', { pointerId: 1, button: 0, clientX: 104 })
  send(jumpButton, 'pointerdown', { pointerId: 2, button: 0 })
  send(fireButton, 'pointerdown', { pointerId: 3, button: 0 })
  assert.equal(stick.hasPointerCapture(1), true)
  assert.equal(fireButton.classList.has('held'), true)
  assert.deepEqual(read(), { ...idle, right: true, jump: true, fire: true })
  send(stick, 'pointermove', { pointerId: 2, clientX: 25 })
  assert.equal(read().right, true)
  send(stick, 'pointermove', { pointerId: 1, clientX: 25 })
  send(jumpButton, 'pointerup', { pointerId: 2 })
  assert.deepEqual(read(), { ...idle, left: true, fire: true })
  assert.equal(jumpButton.classList.has('held'), false)
  send(stick, 'pointercancel', { pointerId: 1 })
  send(fireButton, 'lostpointercapture', { pointerId: 3 })
  assert.deepEqual(read(), idle)
  assert.equal(stick.knob.style.left, '')
  assert.equal(fireButton.classList.has('held'), false)
})

test('dragging the center knob moves in either direction and returns to neutral', () => {
  const { read, stick } = fixture()
  send(stick, 'pointerdown', { target: stick.knob, pointerId: 1, button: 0, clientX: 77 })
  assert.deepEqual(read(), idle)
  send(stick, 'pointermove', { pointerId: 1, clientX: 102 })
  assert.equal(read().right, true)
  assert.ok(parseFloat(stick.knob.style.left) > 50)
  send(stick, 'pointermove', { pointerId: 1, clientX: 52 })
  assert.equal(read().left, true)
  assert.ok(parseFloat(stick.knob.style.left) < 50)
  send(stick, 'pointermove', { pointerId: 1, clientX: 77 })
  assert.deepEqual(read(), idle)
})

test('quick taps survive one read and cancellation or loss of visibility clears input', () => {
  const { read, document, key, stick, jumpButton, fireButton } = fixture()
  send(jumpButton, 'pointerdown', { pointerId: 7, button: 0 })
  send(jumpButton, 'pointerup', { pointerId: 7 })
  key('keydown', ' ', { code: 'Space' })
  key('keyup', ' ', { code: 'Space' })
  assert.deepEqual(read(), { ...idle, jump: true, fire: true })
  assert.deepEqual(read(), idle)
  send(fireButton, 'pointerdown', { pointerId: 3, button: 0 })
  send(fireButton, 'pointercancel', { pointerId: 3 })
  assert.deepEqual(read(), idle)
  send(fireButton, 'click', { detail: 0 })
  assert.equal(read().fire, true)
  send(stick, 'pointerdown', { pointerId: 1, button: 0, clientX: 40 })
  send(jumpButton, 'pointerdown', { pointerId: 2, button: 0 })
  key('keydown', 'ArrowDown')
  document.hidden = true
  send(document, 'visibilitychange')
  assert.deepEqual(read(), idle)
  assert.equal(stick.hasPointerCapture(1), false)
  assert.equal(jumpButton.hasPointerCapture(2), false)
  assert.equal(jumpButton.classList.has('held'), false)
})
