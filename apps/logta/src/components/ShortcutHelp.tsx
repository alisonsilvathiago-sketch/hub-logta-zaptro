import { useEffect, useMemo, useState } from 'react'
import { getAllShortcuts } from '@/lib/keyboardEngine'
import { getPlatform } from '@/lib/platform'
import { Kbd } from '@/components/ui/Kbd'

function ShortcutCombo({
  ctrl,
  meta,
  shift,
  alt,
  keyLabel,
}: {
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  keyLabel: string
}) {
  const p = getPlatform()
  const labels = useMemo(() => {
    const list: string[] = []
    if (meta) list.push('⌘')
    if (ctrl) list.push('Ctrl')
    if (alt) list.push(p.alt)
    if (shift) list.push(p.shift)
    list.push(keyLabel.length === 1 ? keyLabel.toUpperCase() : keyLabel)
    return list
  }, [alt, ctrl, keyLabel, meta, p.alt, p.shift, shift])

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {labels.map((label, index) => (
        <Kbd key={`${label}-${index}`}>{label}</Kbd>
      ))}
    </div>
  )
}

export default function ShortcutHelp() {
  const [open, setOpen] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const shortcuts = useMemo(() => getAllShortcuts(), [refreshTick])

  useEffect(() => {
    const onToggle = () => setOpen((old) => !old)
    const onClose = () => setOpen(false)
    window.addEventListener('toggle-shortcut-help', onToggle)
    window.addEventListener('close-overlays', onClose)
    setRefreshTick((old) => old + 1)
    return () => {
      window.removeEventListener('toggle-shortcut-help', onToggle)
      window.removeEventListener('close-overlays', onClose)
    }
  }, [])

  if (!open) return null

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2,6,23,0.5)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 95vw)',
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(2, 6, 23, 0.28)',
          padding: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Atalhos do sistema</h3>
        <p style={{ marginTop: 8, marginBottom: 14, color: '#64748b', fontSize: 13 }}>
          Dica: use os atalhos fora de campos de texto.
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          {shortcuts.map((item, index) => (
            <div
              key={`${item.key}-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <span style={{ color: '#1e293b', fontWeight: 600, fontSize: 13 }}>
                {item.description || 'Ação rápida'}
              </span>
              <ShortcutCombo
                ctrl={item.ctrl}
                meta={item.meta}
                shift={item.shift}
                alt={item.alt}
                keyLabel={item.key}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
