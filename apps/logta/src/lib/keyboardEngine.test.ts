import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initKeyboardEngine, registerShortcut } from './keyboardEngine'

describe('keyboardEngine', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('dispara ação quando atalho registrado é pressionado', () => {
    const action = vi.fn()
    const disposeEngine = initKeyboardEngine()
    const unregister = registerShortcut({
      key: 'k',
      ctrl: true,
      action,
      description: 'Abrir busca rápida',
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))

    expect(action).toHaveBeenCalledTimes(1)

    unregister()
    disposeEngine()
  })

  it('não dispara atalho quando foco está em input', () => {
    const action = vi.fn()
    const disposeEngine = initKeyboardEngine()
    const unregister = registerShortcut({
      key: 'k',
      ctrl: true,
      action,
    })

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))

    expect(action).not.toHaveBeenCalled()

    unregister()
    disposeEngine()
  })
})
