import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type PaletteCommand = {
  id: string
  label: string
  hint?: string
  path: string
}

const commands: PaletteCommand[] = [
  { id: 'dashboard', label: 'Ir para Dashboard', path: '/dashboard' },
  { id: 'logistica', label: 'Ir para Logística', path: '/logistica/dashboard' },
  { id: 'financeiro', label: 'Ir para Financeiro', path: '/financeiro/inteligencia' },
  { id: 'crm', label: 'Ir para CRM', path: '/crm/inteligencia' },
  { id: 'clientes', label: 'Ir para Clientes', path: '/clientes' },
  { id: 'relatorios', label: 'Ir para Relatórios', path: '/relatorios' },
]

export default function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return commands
    return commands.filter(
      (item) =>
        item.label.toLowerCase().includes(term) ||
        item.path.toLowerCase().includes(term) ||
        (item.hint || '').toLowerCase().includes(term),
    )
  }, [query])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    const onClose = () => setOpen(false)
    window.addEventListener('open-command', onOpen)
    window.addEventListener('close-overlays', onClose)
    return () => {
      window.removeEventListener('open-command', onOpen)
      window.removeEventListener('close-overlays', onClose)
    }
  }, [])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.46)',
        backdropFilter: 'blur(4px)',
        zIndex: 99998,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 92vw)',
          borderRadius: 16,
          background: '#fff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 22px 44px rgba(2, 6, 23, 0.24)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 12, borderBottom: '1px solid #e2e8f0' }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Digite um comando... Ex.: "logística"'
            style={{
              width: '100%',
              height: 44,
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '0 12px',
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                navigate(item.path)
                setOpen(false)
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                border: 'none',
                borderBottom: '1px solid #f1f5f9',
                background: '#fff',
                padding: '12px 14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.label}</div>
              <div style={{ marginTop: 2, fontSize: 12, color: '#64748b' }}>{item.path}</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 16, fontSize: 13, color: '#64748b' }}>Nenhum comando encontrado.</div>
          )}
        </div>
      </div>
    </div>
  )
}
