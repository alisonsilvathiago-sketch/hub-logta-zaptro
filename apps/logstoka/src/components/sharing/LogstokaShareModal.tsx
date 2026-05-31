import React, { useState, useEffect } from 'react';
import { Share2, Calendar, Lock, Copy, Check, Trash2, Clock, Eye, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { secureSharing, type LsShareLink } from '@/lib/secureSharing';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';

interface Props {
  open: boolean;
  onClose: () => void;
  resourceType: LsShareLink['resourceType'];
  resourceId: string;
  resourceName: string;
  snapshotData?: any; // Dados para congelar caso "Snapshot" esteja ativo
}

export const LogstokaShareModal: React.FC<Props> = ({
  open,
  onClose,
  resourceType,
  resourceId,
  resourceName,
  snapshotData
}) => {
  const { companyId } = useLogstokaTenant();
  const [shareName, setShareName] = useState('');
  const [note, setNote] = useState('');
  const [expiryPreset, setExpiryPreset] = useState<string>('24'); // Default 24 horas
  const [customExpiryDate, setCustomExpiryDate] = useState<string>('2026-06-01');
  const [customExpiryTime, setCustomExpiryTime] = useState<string>('12:00');
  const [permission, setPermission] = useState<LsShareLink['permissions']>('view_comment');
  const [useSnapshot, setUseSnapshot] = useState(true); // Snapshot ativo por padrão
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // Lista de links anteriores gerados para este recurso
  const [activeShares, setActiveShares] = useState<LsShareLink[]>([]);

  useEffect(() => {
    if (open) {
      setShareName(`Compartilhamento - ${resourceName}`);
      setGeneratedLink(null);
      loadActiveShares();
    }
  }, [open, resourceId, resourceName]);

  const loadActiveShares = () => {
    if (companyId) {
      const list = secureSharing.listSharesForResource(companyId, resourceType, resourceId);
      setActiveShares(list);
    }
  };

  const handleGenerate = () => {
    if (!companyId) {
      toast.error('Empresa não selecionada');
      return;
    }

    let durationHours: number | 'custom' = 24;
    let customDateObj: Date | undefined = undefined;

    if (expiryPreset === 'custom') {
      durationHours = 'custom';
      customDateObj = new Date(`${customExpiryDate}T${customExpiryTime}`);
      if (isNaN(customDateObj.getTime())) {
        toast.error('Data ou hora de expiração personalizada inválida');
        return;
      }
      if (customDateObj.getTime() <= Date.now()) {
        toast.error('A data de expiração deve ser no futuro');
        return;
      }
    } else {
      durationHours = Number(expiryPreset);
    }

    const share = secureSharing.createShareLink({
      companyId,
      creatorName: 'Thiago Mestre (Supervisor WMS)', // Nome simulado do usuário logado
      resourceType,
      resourceId,
      name: shareName.trim() || `Link Seguro: ${resourceName}`,
      note: note.trim() || undefined,
      durationHours,
      customExpiryDate: customDateObj,
      permissions: permission,
      snapshotData: useSnapshot ? snapshotData : undefined
    });

    const fullUrl = `${window.location.origin}/shared/${share.token}`;
    setGeneratedLink(fullUrl);
    toast.success('Link de compartilhamento seguro gerado com sucesso!');
    loadActiveShares();
  };

  const handleCopy = (url: string, token: string) => {
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      toast.success('Link copiado para a área de transferência!');
      window.setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const handleRevoke = (token: string) => {
    if (companyId) {
      const success = secureSharing.revokeShareLink(token, companyId);
      if (success) {
        toast.success('Compartilhamento revogado. O link foi desativado imediatamente.');
        loadActiveShares();
        if (generatedLink && generatedLink.endsWith(token)) {
          setGeneratedLink(null);
        }
      }
    }
  };

  const footer = (
    <div className="flex justify-end gap-2 w-full">
      <button type="button" className="ls-btn-secondary" onClick={onClose}>
        Fechar
      </button>
      {!generatedLink ? (
        <button type="button" className="ls-btn-primary" onClick={handleGenerate}>
          <Share2 size={16} />
          Gerar Link Seguro
        </button>
      ) : null}
    </div>
  );

  return (
    <Modal
      open={open}
      title="Compartilhamento Seguro"
      subtitle={`Configure o acesso externo para: ${resourceName}`}
      icon={<Lock size={20} className="text-orange-600 animate-pulse" />}
      onClose={onClose}
      footer={footer}
      size="wide"
    >
      <div className="space-y-6">
        {!generatedLink ? (
          /* Formulário de Configuração */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <style>{`
              .ls-premium-select {
                appearance: none !important;
                -webkit-appearance: none !important;
                -moz-appearance: none !important;
                background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ea580c' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
                background-repeat: no-repeat !important;
                background-position: right 16px center !important;
                background-size: 16px !important;
                padding-right: 46px !important;
                cursor: pointer !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
              }
            `}</style>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Nome do Compartilhamento
                </label>
                <input
                  type="text"
                  className="ls-input"
                  placeholder="Ex: Auditoria de Estoque - Lote Principal"
                  value={shareName}
                  onChange={(e) => setShareName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Observações / Instruções para o visitante
                </label>
                <textarea
                  className="ls-input min-h-[72px]"
                  placeholder="Escreva uma instrução adicional..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Permissões do Visitante
                </label>
                <select
                  className="ls-input ls-premium-select"
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as LsShareLink['permissions'])}
                >
                  <option value="view_only">Apenas visualização do conteúdo</option>
                  <option value="view_comment">Visualização + permitir comentários</option>
                  <option value="view_approve">Visualização + aprovação do estoque</option>
                  <option value="view_reprove">Visualização + aprovação ou reprovação</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Tempo de Expiração do Link
                  </label>
                  <select
                    className="ls-input ls-premium-select"
                    value={expiryPreset}
                    onChange={(e) => setExpiryPreset(e.target.value)}
                  >
                    <option value="1">1 hora</option>
                    <option value="2">2 horas</option>
                    <option value="6">6 horas</option>
                    <option value="12">12 horas</option>
                    <option value="24">24 horas (1 dia)</option>
                    <option value="168">7 dias</option>
                    <option value="720">30 dias</option>
                    <option value="custom">Personalizado (Data & Hora)</option>
                  </select>
                </div>

                {expiryPreset === 'custom' ? (
                  <div className="grid grid-cols-2 gap-3 animate-fade-in-down">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1">Data</label>
                      <input
                        type="date"
                        className="ls-input text-xs"
                        style={{ height: '42px', minHeight: '42px', paddingTop: '0', paddingBottom: '0' }}
                        value={customExpiryDate}
                        onChange={(e) => setCustomExpiryDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1">Hora</label>
                      <input
                        type="time"
                        className="ls-input text-xs"
                        style={{ height: '42px', minHeight: '42px', paddingTop: '0', paddingBottom: '0' }}
                        value={customExpiryTime}
                        onChange={(e) => setCustomExpiryTime(e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                {/* Toggle de Snapshot */}
                <div className="flex items-start gap-3 border-t border-slate-200/50 pt-4">
                  <input
                    type="checkbox"
                    id="snapshot-toggle"
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    checked={useSnapshot}
                    onChange={(e) => setUseSnapshot(e.target.checked)}
                  />
                  <div>
                    <label htmlFor="snapshot-toggle" className="text-xs font-extrabold text-slate-700 cursor-pointer block select-none">
                      Compartilhar Snapshot (Cópia Congelada)
                    </label>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 leading-normal">
                      Excelente para auditorias. Salva uma foto estática das informações de estoque neste exato instante. Visitantes não verão alterações feitas após a criação deste link.
                    </p>
                  </div>
                </div>

                {/* Caixa informativa de segurança para balancear perfeitamente a altura */}
                <div className="bg-white border border-slate-200/40 rounded-xl p-3 flex flex-col gap-2 mt-2 shadow-[0_2px_8px_rgba(15,23,42,0.01)]">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <ShieldCheck size={12} className="text-orange-600 animate-pulse" />
                    <span>Auditoria e Rastreabilidade</span>
                  </div>
                  <ul className="text-[10px] text-slate-500 space-y-1.5 font-semibold list-none pl-0">
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-500 font-extrabold">✓</span> Token seguro com bloqueio de menus WMS
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-500 font-extrabold">✓</span> Registro de IP e contador de visitas público
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-500 font-extrabold">✓</span> Revogação imediata a qualquer momento
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Link Gerado */
          <div className="bg-orange-50/50 border border-orange-100/60 p-6 rounded-2xl space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
              <Check className="h-5 w-5 bg-orange-500 text-white rounded-full p-0.5" />
              Link Gerado com Sucesso!
            </div>
            
            <p className="text-xs text-slate-500">
              Copie o link abaixo para enviar ao auditor, cliente ou parceiro. Este link é público e não requer login, mas está protegido contra acessos a menus ou configurações da empresa.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                className="flex-1 ls-input bg-white font-mono text-xs select-all"
                value={generatedLink}
              />
              <button
                type="button"
                className="ls-btn-primary shrink-0 px-4"
                onClick={() => handleCopy(generatedLink, 'just-generated')}
              >
                {copiedToken === 'just-generated' ? <Check size={16} /> : <Copy size={16} />}
                Copiar
              </button>
              
              <button
                type="button"
                className="ls-btn-secondary shrink-0 px-4 border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 transition"
                onClick={() => {
                  const expiresText = expiryPreset === 'custom' 
                    ? `${customExpiryDate} às ${customExpiryTime}` 
                    : `${expiryPreset} horas`;
                  const message = `Olá, segue a lista de conferência do LogStoka: "${resourceName}".\nEste link expira em: ${expiresText}.\nAcesse com segurança aqui: ${generatedLink}`;
                  void navigator.clipboard.writeText(message).then(() => {
                    toast.success('Mensagem do WhatsApp copiada!');
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
                  });
                }}
              >
                💬 WhatsApp
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-orange-600">
              <Clock size={12} />
              Expira em: {expiryPreset === 'custom' ? `${customExpiryDate} às ${customExpiryTime}` : `${expiryPreset} horas`}
              {useSnapshot ? ' · Snapshot Estático Habilitado 🔒' : ' · Dados Dinâmicos'}
            </div>
          </div>
        )}

        {/* Auditoria / Links Ativos */}
        <div className="border-t border-slate-100 pt-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center justify-between">
            <span>Links de Compartilhamento Gerados</span>
            <button
              type="button"
              className="text-[10px] text-slate-400 hover:text-orange-600 flex items-center gap-1 font-bold lowercase"
              onClick={loadActiveShares}
            >
              <RefreshCw size={10} /> atualizar
            </button>
          </h4>

          {activeShares.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-xl">
              Nenhum link ativo gerado anteriormente para este recurso.
            </p>
          ) : (
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
              {activeShares.map((share) => {
                const isExpired = new Date(share.expiresAt).getTime() < Date.now();
                const shareUrl = `${window.location.origin}/shared/${share.token}`;
                return (
                  <div
                    key={share.token}
                    className={`flex items-center justify-between gap-4 p-3 border rounded-xl transition ${
                      share.revoked || isExpired
                        ? 'bg-slate-50 border-slate-100 text-slate-400'
                        : 'bg-white border-slate-200 hover:border-orange-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs truncate max-w-[200px] text-slate-700">
                          {share.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            share.revoked
                              ? 'bg-red-50 text-red-500'
                              : isExpired
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {share.revoked ? 'Revogado' : isExpired ? 'Expirado' : 'Ativo'}
                        </span>
                        {share.snapshotData ? (
                          <span className="text-[9px] font-black uppercase text-orange-600 bg-orange-50 px-1 border border-orange-100 rounded">
                            Snapshot
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {share.visits} acessos
                        </span>
                        <span>·</span>
                        <span>Expira: {new Date(share.expiresAt).toLocaleString('pt-BR')}</span>
                        {share.approvalStatus && share.approvalStatus !== 'pending' && (
                          <>
                            <span>·</span>
                            <span className="font-extrabold text-orange-600">
                              {share.approvalStatus === 'approved' ? '✓ Aprovado' : '✗ Rejeitado'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="ls-btn-secondary p-2 rounded-xl text-slate-500 hover:text-orange-600"
                        title="Copiar Link"
                        disabled={share.revoked || isExpired}
                        onClick={() => handleCopy(shareUrl, share.token)}
                      >
                        {copiedToken === share.token ? <Check size={14} /> : <Copy size={14} />}
                      </button>

                      <button
                        type="button"
                        className="ls-btn-secondary p-2 rounded-xl border-red-100 hover:border-red-200 text-red-400 hover:bg-red-50"
                        title="Revogar Acesso Imediatamente"
                        disabled={share.revoked}
                        onClick={() => handleRevoke(share.token)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
export default LogstokaShareModal;
