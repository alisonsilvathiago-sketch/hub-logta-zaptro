import { useEffect } from 'react'
import { emitKeyboardEvent, initKeyboardEngine, registerShortcut } from '@/lib/keyboardEngine'
import { getPlatform } from '@/lib/platform'

export function KeyboardProvider() {
  useEffect(() => {
    const platform = getPlatform()
    const disposeEngine = initKeyboardEngine()

    const unregister = [
      registerShortcut({
        key: 'k',
        ctrl: !platform.isMac,
        meta: platform.isMac,
        action: () => emitKeyboardEvent('open-command'),
        description: 'Abrir busca rápida',
      }),
      registerShortcut({
        key: 's',
        ctrl: !platform.isMac,
        meta: platform.isMac,
        action: () => {
          window.dispatchEvent(new Event('app:request-save'))
        },
        description: 'Salvar',
      }),
      registerShortcut({
        key: 'Escape',
        action: () => emitKeyboardEvent('close-overlays'),
        description: 'Fechar modal/tela aberta',
      }),
      registerShortcut({
        key: '/',
        ctrl: !platform.isMac,
        meta: platform.isMac,
        action: () => emitKeyboardEvent('toggle-shortcut-help'),
        description: 'Abrir ajuda de atalhos',
      }),
    ]

    return () => {
      unregister.forEach((off) => off())
      disposeEngine()
    }
  }, [])

  return null
}
