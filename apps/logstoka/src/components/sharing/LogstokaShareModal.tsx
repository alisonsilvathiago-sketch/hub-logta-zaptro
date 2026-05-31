import React, { useEffect, useState } from 'react';
import { Share2, Lock, Copy, Check, Trash2, Clock, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { IntegrationBrandLogo } from '@/components/integrations/IntegrationBrandLogo';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useLogstokaPermissions } from '@/hooks/useLogstokaPermissions';
import { ensureDemoShareLinks, secureSharing, type LsShareLink } from '@/lib/secureSharing';
import './logstokaShareModal.css';

interface Props {
  open: boolean;
  onClose: () => void;
  resourceType: LsShareLink['resourceType'];
  resourceId: string;
  resourceName: string;
  snapshotData?: unknown;
}

export const LogstokaShareModal: React.FC<Props> = ({
  open,
  onClose,
  resourceType,
  resourceId,
  resourceName,
  snapshotData,
}) => {
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const { canCreateShareLink } = useLogstokaPermissions();
  const [shareName, setShareName] = useState('');
  const [note, setNote] = useState('');
  const [expiryPreset, setExpiryPreset] = useState<string>('24');
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('2026-06-01');
  const [customExpiryTime, setCustomExpiryTime] = useState<string>('12:00');
  const [permission, setPermission] = useState<LsShareLink['permissions']>('view_comment');
  const [useSnapshot, setUseSnapshot] = useState(true);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [activeShares, setActiveShares] = useState<LsShareLink[]>([]);

  useEffect(() => {
    if (open) {
      if (companyId) ensureDemoShareLinks(companyId);
      setShareName(`Compartilhamento - ${resourceName}`);
      setGeneratedLink(null);
      loadActiveShares();
    }
  }, [open, resourceId, resourceName, companyId]);

  const loadActiveShares = () => {
    if (companyId) {
      setActiveShares(secureSharing.listSharesForResource(companyId, resourceType, resourceId));
    }
  };

  const handleGenerate = () => {
    if (!companyId) {
      toast.error('Empresa não selecionada');
      return;
    }
    if (!canCreateShareLink()) {
      toast.error('Seu perfil não pode criar links públicos');
      return;
    }
    if (!useSnapshot || !snapshotData) {
      toast.error('Ative o snapshot congelado — dados ao vivo não vão para a internet');
      return;
    }

    let durationHours: number | 'custom' = 24;
    let customDateObj: Date | undefined;

    if (expiryPreset === 'custom') {
      durationHours = 'custom';
      customDateObj = new Date(`${customExpiryDate}T${customExpiryTime}`);
      if (isNaN(customDateObj.getTime())) {
        toast.error('Data ou hora de expiração inválida');
        return;
      }
      if (customDateObj.getTime() <= Date.now()) {
        toast.error('A expiração deve ser no futuro');
        return;
      }
    } else {
      durationHours = Number(expiryPreset);
    }

    try {
      const share = secureSharing.createShareLink({
        companyId,
        creatorName: profile?.full_name?.trim() || profile?.email || 'Colaborador LogStoka',
        resourceType,
        resourceId,
        name: shareName.trim() || `Link: ${resourceName}`,
        note: note.trim() || undefined,
        durationHours,
        customExpiryDate: customDateObj,
        permissions: permission,
        snapshotData,
      });

      setGeneratedLink(`${window.location.origin}/shared/${share.token}`);
      toast.success('Link gerado');
      loadActiveShares();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível gerar o link');
    }
  };

  const handleCopy = (url: string, token: string) => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      toast.success('Link copiado');
      window.setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const handleRevoke = (token: string) => {
    if (!companyId) return;
    if (secureSharing.revokeShareLink(token, companyId)) {
      toast.success('Link revogado');
      loadActiveShares();
      if (generatedLink?.endsWith(token)) setGeneratedLink(null);
    }
  };

  const expiryLabel =
    expiryPreset === 'custom'
      ? `${customExpiryDate} ${customExpiryTime}`
      : `${expiryPreset} h`;

  const footer = (
    <div className="ls-share-modal__footer-actions">
      <button type="button" className="ls-btn-secondary" onClick={onClose}>
        Fechar
      </button>
      {!generatedLink && canCreateShareLink() ? (
        <button type="button" className="ls-btn-primary" onClick={handleGenerate}>
          <Share2 size={15} />
          Gerar link
        </button>
      ) : null}
    </div>
  );

  return (
    <Modal
      open={open}
      title="Compartilhar"
      subtitle={resourceName}
      icon={<Lock size={16} className="text-orange-600" />}
      onClose={onClose}
      footer={footer}
      size="landscape"
      panelClassName="ls-share-modal"
    >
      <div className="ls-share-modal__stack">
        {!canCreateShareLink() ? (
          <p className="ls-share-modal__warn">
            Seu perfil não pode publicar links. Apenas gestores e administradores.
          </p>
        ) : null}

        {generatedLink ? (
          <div className="ls-share-modal__generated">
            <p className="ls-share-modal__generated-title">
              <Check size={16} />
              Link pronto para enviar
            </p>
            <div className="ls-share-modal__link-row">
              <input type="text" readOnly className="ls-input" value={generatedLink} />
              <button
                type="button"
                className="ls-btn-primary"
                onClick={() => handleCopy(generatedLink, 'just-generated')}
              >
                {copiedToken === 'just-generated' ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                type="button"
                className="ls-btn-secondary"
                title="WhatsApp"
                onClick={() => {
                  const message = `Lista LogStoka: "${resourceName}". Expira em ${expiryLabel}.\n${generatedLink}`;
                  void navigator.clipboard.writeText(message).then(() => {
                    toast.success('Mensagem copiada');
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
                  });
                }}
              >
                <IntegrationBrandLogo brandKey="whatsapp" size={18} />
              </button>
            </div>
            <p className="ls-share-modal__meta">
              <Clock size={11} />
              Expira em {expiryLabel}
              {useSnapshot ? ' · snapshot congelado' : ''}
            </p>
          </div>
        ) : canCreateShareLink() ? (
          <div className="ls-share-modal__layout">
            <div className="ls-share-modal__col">
              <div className="ls-share-modal__field">
                <label htmlFor="share-name">Nome</label>
                <input
                  id="share-name"
                  type="text"
                  className="ls-input"
                  placeholder="Ex.: Auditoria — lote principal"
                  value={shareName}
                  onChange={(e) => setShareName(e.target.value)}
                />
              </div>

              <div className="ls-share-modal__field">
                <label htmlFor="share-perm">Permissão</label>
                <select
                  id="share-perm"
                  className="ls-input ls-share-modal__select"
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as LsShareLink['permissions'])}
                >
                  <option value="view_only">Só visualizar</option>
                  <option value="view_comment">Visualizar + comentar</option>
                  <option value="view_approve">Visualizar + aprovar</option>
                  <option value="view_reprove">Visualizar + aprovar/reprovar</option>
                </select>
              </div>

              <div className="ls-share-modal__field">
                <label htmlFor="share-note">Instruções (opcional)</label>
                <textarea
                  id="share-note"
                  className="ls-input"
                  rows={2}
                  placeholder="Mensagem para quem vai abrir o link…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <div className="ls-share-modal__col">
              <div className="ls-share-modal__field">
                <label htmlFor="share-expiry">Expira em</label>
                <select
                  id="share-expiry"
                  className="ls-input ls-share-modal__select"
                  value={expiryPreset}
                  onChange={(e) => setExpiryPreset(e.target.value)}
                >
                  <option value="1">1 hora</option>
                  <option value="2">2 horas</option>
                  <option value="6">6 horas</option>
                  <option value="12">12 horas</option>
                  <option value="24">24 horas</option>
                  <option value="168">7 dias</option>
                  <option value="720">30 dias</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              {expiryPreset === 'custom' ? (
                <div className="ls-share-modal__row">
                  <div className="ls-share-modal__field">
                    <label htmlFor="share-date">Data</label>
                    <input
                      id="share-date"
                      type="date"
                      className="ls-input"
                      value={customExpiryDate}
                      onChange={(e) => setCustomExpiryDate(e.target.value)}
                    />
                  </div>
                  <div className="ls-share-modal__field">
                    <label htmlFor="share-time">Hora</label>
                    <input
                      id="share-time"
                      type="time"
                      className="ls-input"
                      value={customExpiryTime}
                      onChange={(e) => setCustomExpiryTime(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              <div className="ls-share-modal__snapshot">
                <input
                  type="checkbox"
                  id="snapshot-toggle"
                  checked={useSnapshot}
                  onChange={(e) => setUseSnapshot(e.target.checked)}
                />
                <div>
                  <label htmlFor="snapshot-toggle" className="ls-share-modal__snapshot-label">
                    Snapshot congelado (recomendado)
                  </label>
                  <p className="ls-share-modal__snapshot-hint">
                    Cópia estática no envio — visitante não vê alterações do WMS.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeShares.length > 0 ? (
          <details className="ls-share-modal__history" open={activeShares.length <= 2}>
            <summary>
              <span>Links deste recurso ({activeShares.length})</span>
              <button
                type="button"
                className="text-[10px] text-slate-400 hover:text-orange-600 font-bold"
                onClick={(e) => {
                  e.preventDefault();
                  loadActiveShares();
                }}
              >
                <RefreshCw size={10} className="inline" /> atualizar
              </button>
            </summary>
            <div className="ls-share-modal__history-list">
              {activeShares.map((share) => {
                const isExpired = new Date(share.expiresAt).getTime() < Date.now();
                const shareUrl = `${window.location.origin}/shared/${share.token}`;
                const muted = share.revoked || isExpired;
                return (
                  <div
                    key={share.token}
                    className={`ls-share-modal__history-item${muted ? ' ls-share-modal__history-item--muted' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="ls-share-modal__history-name">
                        {share.name}
                        <span
                          className={`ls-share-modal__badge ${
                            share.revoked
                              ? 'ls-share-modal__badge--bad'
                              : isExpired
                                ? 'ls-share-modal__badge--muted'
                                : 'ls-share-modal__badge--ok'
                          }`}
                        >
                          {share.revoked ? 'Revogado' : isExpired ? 'Expirado' : 'Ativo'}
                        </span>
                      </p>
                      <p className="ls-share-modal__history-meta">
                        <Eye size={10} className="inline" /> {share.visits} ·{' '}
                        {new Date(share.expiresAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="ls-share-modal__history-actions">
                      <button
                        type="button"
                        className="ls-btn-secondary"
                        disabled={muted}
                        onClick={() => handleCopy(shareUrl, share.token)}
                      >
                        {copiedToken === share.token ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                      <button
                        type="button"
                        className="ls-btn-secondary text-red-500"
                        disabled={share.revoked}
                        onClick={() => handleRevoke(share.token)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        ) : null}
      </div>
    </Modal>
  );
};

export default LogstokaShareModal;
