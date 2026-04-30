export type PlatformMeta = {
  isMac: boolean
  cmd: string
  alt: string
  shift: string
  enter: string
  esc: string
  backspace: string
}

export function getPlatform(): PlatformMeta {
  if (typeof navigator === 'undefined') {
    return {
      isMac: false,
      cmd: 'Ctrl',
      alt: 'Alt',
      shift: 'Shift',
      enter: 'Enter',
      esc: 'Esc',
      backspace: 'Backspace',
    }
  }

  const ua = navigator.userAgent.toLowerCase()
  const isMac = /mac|iphone|ipad/.test(ua)

  return {
    isMac,
    cmd: isMac ? '⌘' : 'Ctrl',
    alt: isMac ? '⌥' : 'Alt',
    shift: isMac ? '⇧' : 'Shift',
    enter: 'Enter',
    esc: 'Esc',
    backspace: isMac ? '⌫' : 'Backspace',
  }
}
