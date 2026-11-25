const movementKeys = new Map([
  ['a', 'left'], ['arrowleft', 'left'], ['d', 'right'], ['arrowright', 'right'],
  ['w', 'jump'], ['arrowup', 'jump'], ['s', 'down'], ['arrowdown', 'down'],
  [' ', 'fire']
])
const nativeControls = 'button, a[href], input, select, textarea, summary, [role="button"]'
const editableControls = 'input, select, textarea, [contenteditable]:not([contenteditable="false"])'

export function bindControls({ stick, jumpButton, fireButton, isPlaying, onPause, onEnter }) {
  const document = stick.ownerDocument
  const window = document.defaultView
  const knob = stick.querySelector('i')
  const keys = new Map()
  const pending = new Set()
  let joystick = null
  let horizontal = 0

  function setHorizontal(offset) {
    const position = Math.max(-1, Math.min(1, offset))
    horizontal = Math.abs(position) > 0.2 ? Math.sign(position) : 0
    knob.style.left = position ? `${50 + position * 32}%` : ''
  }

  function releaseStick(pointerId) {
    if (joystick?.pointerId !== pointerId) return
    joystick = null
    setHorizontal(0)
    if (stick.hasPointerCapture(pointerId)) stick.releasePointerCapture(pointerId)
  }

  stick.addEventListener('pointerdown', event => {
    if (!isPlaying() || joystick || event.button !== 0) return
    event.preventDefault()
    const { left, width } = stick.getBoundingClientRect()
    const onKnob = event.target === knob
    joystick = { pointerId: event.pointerId, origin: onKnob ? event.clientX : left + width / 2, travel: width * 0.32 }
    setHorizontal((event.clientX - joystick.origin) / joystick.travel)
    stick.setPointerCapture(event.pointerId)
  })
  stick.addEventListener('pointermove', event => {
    if (joystick?.pointerId !== event.pointerId) return
    setHorizontal((event.clientX - joystick.origin) / joystick.travel)
  })
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    stick.addEventListener(type, event => releaseStick(event.pointerId))
  }

  function bindAction(button, action) {
    const pointers = new Set()
    button.addEventListener('pointerdown', event => {
      if (!isPlaying() || event.button !== 0) return
      event.preventDefault()
      pointers.add(event.pointerId)
      pending.add(action)
      button.classList.add('held')
      button.setPointerCapture(event.pointerId)
    })
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, event => {
        if (!pointers.delete(event.pointerId)) return
        if (type !== 'pointerup' && !pointers.size) pending.delete(action)
        if (!pointers.size) button.classList.remove('held')
        if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId)
      })
    }
    button.addEventListener('click', event => {
      if (isPlaying() && event.detail === 0) pending.add(action)
    })
    return {
      held: () => pointers.size > 0,
      clear() {
        const captured = [...pointers]
        pointers.clear()
        button.classList.remove('held')
        for (const pointerId of captured) {
          if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId)
        }
      }
    }
  }

  const jump = bindAction(jumpButton, 'jump')
  const fire = bindAction(fireButton, 'fire')

  function clear() {
    keys.clear()
    pending.clear()
    if (joystick) releaseStick(joystick.pointerId)
    jump.clear()
    fire.clear()
  }

  function keyName(event) {
    return event.code === 'Space' ? ' ' : event.key.toLowerCase()
  }

  window.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || event.target?.closest?.(editableControls)) return
    const key = keyName(event)
    if (key === 'escape' || key === 'p') {
      event.preventDefault()
      if (!event.repeat) onPause()
      return
    }
    if (key === 'enter' && !isPlaying() && !event.target?.closest?.(nativeControls)) {
      event.preventDefault()
      if (!event.repeat) onEnter()
      return
    }
    const action = movementKeys.get(key)
    if (!action || !isPlaying()) return
    event.preventDefault()
    if (event.repeat) return
    keys.set(event.code || key, action)
    if (action === 'jump' || action === 'fire') pending.add(action)
  })
  window.addEventListener('keyup', event => keys.delete(event.code || keyName(event)))
  window.addEventListener('blur', clear)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clear()
  })

  return {
    clear,
    read() {
      const active = new Set(keys.values())
      const input = {
        left: active.has('left') || horizontal < 0,
        right: active.has('right') || horizontal > 0,
        jump: active.has('jump') || jump.held() || pending.has('jump'),
        down: active.has('down'),
        fire: active.has('fire') || fire.held() || pending.has('fire')
      }
      pending.clear()
      return input
    }
  }
}
