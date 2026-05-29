import React, { useEffect, useRef, useState } from 'react';
import {
  AlignLeft,
  CalendarClock,
  Check,
  Clock,
  Copy,
  Edit2,
  ExternalLink,
  MapPin,
  MoreVertical,
  Printer,
  Share2,
  Tag,
  Trash2,
  User,
  Users,
  Video,
  X,
} from 'lucide-react';
import type { ZaptroActivityEntry } from '../../constants/zaptroActivityLogStore';
import {
  agendaEventDisplayColor,
  parseMentionsFromDetails,
  type AgendaTeamMember,
} from '../../lib/zaptroAgendaCollaborators';

type ParsedDetailRow = {
  kind: string;
  label: string;
  value: string;
  href?: string;
};

function parseAgendaDetails(details: string): ParsedDetailRow[] {
  return details
    .split(' · ')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((part) => !part.startsWith('Menções:'))
    .map((part) => {
      if (part.startsWith('Meet: ')) {
        const url = part.slice(6).trim();
        return { kind: 'meet', label: 'Google Meet', value: url, href: url };
      }
      if (part.startsWith('Local: ')) return { kind: 'location', label: 'Local', value: part.slice(7).trim() };
      if (part.startsWith('Convidados: ')) return { kind: 'guests', label: 'Convidados', value: part.slice(12).trim() };
      if (part.startsWith('Tel: ')) return { kind: 'phone', label: 'Telefone', value: part.slice(5).trim() };
      if (part.startsWith('Obs: ')) return { kind: 'note', label: 'Observação', value: part.slice(5).trim() };
      if (part.startsWith('Início:')) return { kind: 'schedule', label: 'Horário', value: part };
      return { kind: 'text', label: 'Informação', value: part };
    });
}

function formatAgendaDetailDate(iso: string) {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return { date: '—', time: '' };
  }
}

type Props = {
  item: ZaptroActivityEntry;
  anchor: { x: number; y: number } | null;
  teamMembers: AgendaTeamMember[];
  onClose: () => void;
  onEdit: (item: ZaptroActivityEntry) => void;
  onDelete: (item: ZaptroActivityEntry) => void;
  onDuplicate: (item: ZaptroActivityEntry) => void;
  onMarkDone: (item: ZaptroActivityEntry) => void;
};

export const ZaptroAgendaEventPopover: React.FC<Props> = ({
  item,
  anchor,
  teamMembers,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onMarkDone,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [onClose]);

  const when = formatAgendaDetailDate(item.at);
  const detailRows = item.details ? parseAgendaDetails(item.details) : [];
  const mentionNames =
    item.mentionedNames?.length
      ? item.mentionedNames
      : parseMentionsFromDetails(item.details).length
        ? parseMentionsFromDetails(item.details)
        : (item.mentionedUserIds ?? [])
            .map((id) => teamMembers.find((m) => m.id === id)?.name)
            .filter(Boolean) as string[];

  const color = agendaEventDisplayColor(item);
  const isDone = item.status === 'done';

  const style: React.CSSProperties = anchor
    ? {
        position: 'fixed',
        left: Math.min(anchor.x, window.innerWidth - 380),
        top: Math.min(anchor.y, window.innerHeight - 420),
        zIndex: 6000,
      }
    : {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 6000,
      };

  const printEvent = () => {
    const text = [item.clientLabel, item.action, when.date, when.time, item.details].filter(Boolean).join('\n');
    const w = window.open('', '_blank', 'width=480,height=640');
    if (w) {
      w.document.write(`<pre style="font-family:sans-serif;padding:24px">${text}</pre>`);
      w.document.close();
      w.print();
    }
    setMenuOpen(false);
  };

  const shareEvent = async () => {
    const text = `${item.clientLabel} — ${item.action}\n${when.date} ${when.time}\n${item.details || ''}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    setMenuOpen(false);
  };

  return (
    <>
      <div className="zaptro-agenda-popover-backdrop" aria-hidden onClick={onClose} />
      <div ref={cardRef} className="zaptro-agenda-popover" style={style} role="dialog" aria-label="Detalhes do evento">
        <header className="zaptro-agenda-popover__head">
          <div className="zaptro-agenda-popover__color" style={{ backgroundColor: color }} aria-hidden />
          <div className="zaptro-agenda-popover__head-text">
            <h2 className={isDone ? 'is-done' : ''}>{item.clientLabel}</h2>
            <p>
              {when.date}
              {when.time ? ` · ${when.time}` : ''}
            </p>
          </div>
          <div className="zaptro-agenda-popover__actions">
            <button type="button" className="zaptro-agenda-popover__icon-btn" onClick={() => onDelete(item)} aria-label="Excluir">
              <Trash2 size={18} />
            </button>
            <div className="zaptro-agenda-popover__menu-wrap">
              <button
                type="button"
                className="zaptro-agenda-popover__icon-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Mais opções"
                aria-expanded={menuOpen}
              >
                <MoreVertical size={18} />
              </button>
              {menuOpen ? (
                <div className="zaptro-agenda-popover__menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => { onEdit(item); setMenuOpen(false); }}>
                    <Edit2 size={16} /> Editar
                  </button>
                  <button type="button" role="menuitem" onClick={() => { onDuplicate(item); setMenuOpen(false); }}>
                    <Copy size={16} /> Duplicar
                  </button>
                  <button type="button" role="menuitem" onClick={printEvent}>
                    <Printer size={16} /> Imprimir
                  </button>
                  <button type="button" role="menuitem" onClick={() => { onMarkDone(item); setMenuOpen(false); }}>
                    <Check size={16} /> {isDone ? 'Reabrir' : 'Marcar como feito'}
                  </button>
                  <button type="button" role="menuitem" onClick={() => void shareEvent()}>
                    <Share2 size={16} /> Partilhar
                  </button>
                </div>
              ) : null}
            </div>
            <button type="button" className="zaptro-agenda-popover__icon-btn" onClick={onClose} aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="zaptro-agenda-popover__body">
          <div className="zaptro-agenda-popover__row">
            <Tag size={16} />
            <div>
              <span className="lab">Tipo</span>
              <strong>{item.action}</strong>
            </div>
          </div>
          <div className="zaptro-agenda-popover__row">
            <User size={16} />
            <div>
              <span className="lab">Criado por</span>
              <strong>{item.actorName}</strong>
            </div>
          </div>
          {mentionNames.length ? (
            <div className="zaptro-agenda-popover__row">
              <Users size={16} />
              <div>
                <span className="lab">Menções</span>
                <strong>{mentionNames.map((n) => `@${n.replace(/^@/, '')}`).join(', ')}</strong>
              </div>
            </div>
          ) : null}
          {detailRows.map((row, i) => (
            <div key={`${row.kind}-${i}`} className="zaptro-agenda-popover__row">
              {row.kind === 'meet' ? (
                <Video size={16} />
              ) : row.kind === 'location' ? (
                <MapPin size={16} />
              ) : row.kind === 'note' ? (
                <AlignLeft size={16} />
              ) : (
                <CalendarClock size={16} />
              )}
              <div>
                <span className="lab">{row.label}</span>
                {row.href ? (
                  <a className="zaptro-agenda-popover__meet" href={row.href} target="_blank" rel="noopener noreferrer">
                    Entrar no Meet <ExternalLink size={12} />
                  </a>
                ) : (
                  <strong>{row.value}</strong>
                )}
              </div>
            </div>
          ))}
        </div>

        <footer className="zaptro-agenda-popover__foot">
          <button type="button" className="zaptro-agenda-popover__btn-ghost" onClick={() => onEdit(item)}>
            <Edit2 size={16} /> Editar
          </button>
          <button type="button" className="zaptro-agenda-popover__btn-primary" onClick={onClose}>
            Fechar
          </button>
        </footer>
      </div>
    </>
  );
};
