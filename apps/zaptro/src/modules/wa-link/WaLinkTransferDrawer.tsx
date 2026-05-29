import React, { useEffect, useState } from 'react';
import { Building2, Loader2, X } from 'lucide-react';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import { useAuth } from '../../context/AuthContext';

type DeptRow = { id: string; name: string };

type Props = {
  open: boolean;
  conversationLabel: string;
  onClose: () => void;
  onTransfer: (departmentName: string) => Promise<void>;
};

const WaLinkTransferDrawer: React.FC<Props> = ({
  open,
  conversationLabel,
  onClose,
  onTransfer,
}) => {
  const { profile } = useAuth();
  const [departments, setDepartments] = useState<DeptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !profile?.company_id) return;
    let cancelled = false;
    setLoading(true);
    void supabaseZaptro
      .from('whatsapp_departments')
      .select('id,name')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('[wa-link] departments:', error.message);
          setDepartments([]);
        } else {
          setDepartments(
            (data || [])
              .map((d) => ({ id: String(d.id), name: String(d.name || '').trim() }))
              .filter((d) => d.name),
          );
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, profile?.company_id]);

  if (!open) return null;

  const handlePick = async (name: string) => {
    setTransferring(name);
    try {
      await onTransfer(name);
      onClose();
    } finally {
      setTransferring(null);
    }
  };

  return (
    <div className="wa-transfer-drawer-root" role="presentation">
      <button type="button" className="wa-transfer-drawer-backdrop" aria-label="Fechar" onClick={onClose} />
      <aside className="wa-transfer-drawer" role="dialog" aria-label="Transferir conversa">
        <header className="wa-transfer-drawer-head">
          <button type="button" className="wa-transfer-drawer-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
          <div>
            <h2>Transferir departamento</h2>
            <p>{conversationLabel}</p>
          </div>
        </header>
        <div className="wa-transfer-drawer-body">
          {loading ? (
            <p className="wa-transfer-drawer-hint">
              <Loader2 size={16} className="wa-transfer-spin" /> A carregar setores…
            </p>
          ) : departments.length === 0 ? (
            <p className="wa-transfer-drawer-hint">
              Nenhum setor cadastrado. Crie em Configurações → Departamentos.
            </p>
          ) : (
            <ul className="wa-transfer-drawer-list">
              {departments.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className="wa-transfer-drawer-row"
                    disabled={Boolean(transferring)}
                    onClick={() => void handlePick(d.name)}
                  >
                    <Building2 size={18} />
                    <span>{d.name}</span>
                    {transferring === d.name ? <Loader2 size={16} className="wa-transfer-spin" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};

export default WaLinkTransferDrawer;
