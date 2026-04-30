export type Shortcut = {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: () => void
  description?: string
}

const shortcuts = new Map<string, Shortcut>()
let initialized = false
let cleanupHandler: (() => void) | null = null

function normalizeKey(value: string): string {
  return value.toLowerCase()
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  if (!(el instanceof Element)) return false
  if (el.isContentEditable) return true
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.getAttribute('role') === 'textbox') return true
  return false
}

function matches(e: KeyboardEvent, s: Shortcut): boolean {
  return (
    normalizeKey(e.key) === normalizeKey(s.key) &&
    Boolean(s.ctrl) === e.ctrlKey &&
    Boolean(s.shift) === e.shiftKey &&
    Boolean(s.alt) === e.altKey &&
    Boolean(s.meta) === e.metaKey
  )
}

export function initKeyboardEngine(): () => void {
  if (initialized && cleanupHandler) return cleanupHandler

  const onKeyDown = (e: KeyboardEvent) => {
    if (isEditableTarget(e.target)) return

    for (const shortcut of shortcuts.values()) {
      if (!matches(e, shortcut)) continue
      e.preventDefault()
      shortcut.action()
      return
    }
  }

  window.addEventListener('keydown', onKeyDown)
  initialized = true
  cleanupHandler = () => {
    window.removeEventListener('keydown', onKeyDown)
    initialized = false
    cleanupHandler = null
  }

  return cleanupHandler
}

export function registerShortcut(shortcut: Shortcut): () => void {
  const id = crypto.randomUUID()
  shortcuts.set(id, shortcut)
  return () => {
    shortcuts.delete(id)
  }
}

export function getAllShortcuts(): Shortcut[] {
  return Array.from(shortcuts.values())
}

export function emitKeyboardEvent(name: 'open-command' | 'close-overlays' | 'toggle-shortcut-help') {
  window.dispatchEvent(new Event(name))
}
