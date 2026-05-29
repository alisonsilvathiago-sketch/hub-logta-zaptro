import React, { useMemo, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import LogtaModal from '../../components/Modal';
import { notifyZaptro } from '../../components/Zaptro/ZaptroNotificationSystem';
import { createWaGroup, type CreateWaGroupParticipant } from '../../services/evolution.service';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import type { WaLinkContactRoleIndex } from './waLinkContactRoles';

type Props = {
  open: boolean;
  companyId: string;
  instanceName: string;
  roleIndex: WaLinkContactRoleIndex;
  onClose: () => void;
  onCreated: () => void;
};

const WaLinkCreateWaGroupModal: React.FC<Props> = ({
  open,
  companyId,
  instanceName,
  roleIndex,
  onClose,
  onCreated,
}) => {
  const [subject, setSubject] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);

  const teamOptions = useMemo(() => {
    const items: CreateWaGroupParticipant[] = [];
    for (const entry of roleIndex.byPhone.values()) {
      if (entry.role === 'driver' || entry.role === 'helper' || entry.role === 'collaborator') {
        items.push({
          key: entry.entityId,
          name: entry.name,
          phone: entry.phone,
          role: entry.role,
        });
      }
    }
    return items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [roleIndex]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCreate = async () => {
    const name = subject.trim();
    if (!name) {
      notifyZaptro('error', 'Grupo', 'Informe o nome do grupo.');
      return;
    }
    const participants = teamOptions.filter((p) => selected.has(p.key)).map((p) => p.phone);
    if (participants.length < 1) {
      notifyZaptro('error', 'Grupo', 'Selecione pelo menos um membro da equipa.');
      return;
    }
    setBusy(true);
    try {
      const result = await createWaGroup({
        subject: name,
        participants,
        instance: instanceName,
      });
      const groupJid = typeof result.groupJid === 'string' ? result.groupJid : '';

      if (groupJid && companyId) {
        await supabaseZaptro.from('whatsapp_conversations').upsert(
          {
            company_id: companyId,
            sender_number: groupJid,
            sender_name: name,
            status: 'open',
            crm_type: null,
            metadata: { is_group: true, group_subject: name, created_from: 'zaptro_inbox' },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'company_id,sender_number' },
        );
      }

      notifyZaptro('success', 'Grupo WhatsApp', 'Grupo criado e ligado à inbox.');
      setSubject('');
      setSelected(new Set());
      onCreated();
      onClose();
    } catch (err) {
      notifyZaptro('error', 'Grupo', err instanceof Error ? err.message : 'Não foi possível criar o grupo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <LogtaModal
      isOpen={open}
      onClose={() => !busy && onClose()}
      title="Criar grupo da equipa"
      width="560px"
      variant="center"
      headerStyle={{ padding: '14px 20px' }}
      contentStyle={{ padding: '16px 20px 20px' }}
    >
      <p className="wa-group-modal__hint">
        Cria um grupo real no WhatsApp (Evolution GO) com motoristas, ajudantes e colaboradores seleccionados.
      </p>
      <label className="wa-group-modal__field">
        Nome do grupo
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex.: Equipe Operações"
          disabled={busy}
        />
      </label>
      <div className="wa-group-modal__members">
        <strong>
          <Users size={16} /> Membros ({selected.size})
        </strong>
        {teamOptions.length === 0 ? (
          <p className="wa-group-modal__empty">Cadastre motoristas ou ajudantes com telefone para adicionar ao grupo.</p>
        ) : (
          <ul>
            {teamOptions.map((p) => {
              const on = selected.has(p.key);
              return (
                <li key={p.key}>
                  <button type="button" className={`wa-group-modal__member${on ? ' is-on' : ''}`} onClick={() => toggle(p.key)}>
                    <span>{p.name}</span>
                    <em>{p.role === 'driver' ? 'Motorista' : p.role === 'helper' ? 'Ajudante' : 'Colaborador'}</em>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="wa-group-modal__foot">
        <button type="button" className="hub-premium-pill secondary" disabled={busy} onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="hub-premium-pill dark" disabled={busy} onClick={() => void handleCreate()}>
          {busy ? (
            <>
              <Loader2 size={16} className="wa-newchat-spin" /> A criar…
            </>
          ) : (
            'Criar grupo no WhatsApp'
          )}
        </button>
      </div>
    </LogtaModal>
  );
};

export default WaLinkCreateWaGroupModal;
