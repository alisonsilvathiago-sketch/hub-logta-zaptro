import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Lock,
  MessageSquare,
  Package,
  Send,
  Shield,
  XCircle,
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { secureSharing, type LsShareLink } from '@/lib/secureSharing';
import './sharedPublicPage.css';

const RESOURCE_LABEL: Record<LsShareLink['resourceType'], string> = {
  product: 'Produto',
  inventory: 'Inventário',
  movements: 'Movimentações',
  general_table: 'Relatório',
};

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SharedPublicPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<LsShareLink | null>(null);
  const [errorState, setErrorState] = useState<
    'expired' | 'revoked' | 'not_found' | 'no_snapshot' | 'max_visits' | null
  >(null);

  const [visitorName, setVisitorName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<LsShareLink['comments']>([]);
  const [approval, setApproval] = useState<LsShareLink['approvalStatus']>('pending');
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!token) return;

    const timer = window.setTimeout(() => {
      const { share: data, error } = secureSharing.getShareLinkByToken(token);

      if (error) {
        setErrorState(error);
        setShare(data);
      } else if (data) {
        setShare(data);
        setComments(data.comments);
        setApproval(data.approvalStatus ?? 'pending');
        secureSharing.incrementVisits(token);
      }
      setLoading(false);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [token]);

  useEffect(() => {
    if (!share || errorState) return;

    const interval = window.setInterval(() => {
      const diff = new Date(share.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setErrorState('expired');
        window.clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 24) {
        setTimeRemaining(`Expira em ${Math.ceil(hours / 24)} dias`);
      } else {
        setTimeRemaining(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        );
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [share, errorState]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newComment.trim()) return;

    const author = visitorName.trim() || 'Visitante';
    const updated = secureSharing.addCommentToShare(token, author, newComment.trim());
    if (updated) {
      setComments(updated.comments);
      setNewComment('');
      toast.success('Comentário enviado');
    }
  };

  const handleApproval = (status: 'approved' | 'rejected') => {
    if (!token) return;
    const updated = secureSharing.updateShareApproval(token, status);
    if (updated) {
      setApproval(status);
      toast.success(status === 'approved' ? 'Estoque aprovado' : 'Contagem rejeitada');
    }
  };

  if (loading) {
    return (
      <div className="ls-share-public--loading">
        <Toaster position="top-center" />
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-[3px] border-orange-500 border-t-transparent" />
          <p className="text-sm font-semibold text-[#525252]">Abrindo compartilhamento…</p>
        </div>
      </div>
    );
  }

  if (errorState || !share) {
    const errorTitle =
      errorState === 'expired'
        ? 'Link expirado'
        : errorState === 'revoked'
          ? 'Acesso revogado'
          : errorState === 'max_visits'
            ? 'Limite de acessos'
            : errorState === 'no_snapshot'
              ? 'Conteúdo indisponível'
              : 'Link inválido';

    const errorText =
      errorState === 'expired'
        ? 'Este link não está mais ativo. Peça um novo compartilhamento ao responsável do estoque.'
        : errorState === 'revoked'
          ? 'O emissor cancelou este acesso.'
          : errorState === 'max_visits'
            ? 'Este link atingiu o número máximo de visualizações.'
            : errorState === 'no_snapshot'
              ? 'Por segurança, só exibimos links com snapshot congelado.'
              : 'Verifique se o endereço está correto.';

    return (
      <div className="ls-share-public--error">
        <div className="ls-share-public__error-card">
          <div className="ls-share-public__error-icon">
            <AlertTriangle size={24} />
          </div>
          <h1 className="ls-share-public__error-title">{errorTitle}</h1>
          <p className="ls-share-public__error-text">{errorText}</p>
          {share ? (
            <p className="ls-share-public__error-text mt-4 text-xs">{share.name}</p>
          ) : null}
        </div>
      </div>
    );
  }

  const snap = share.snapshotData;
  const isViewOnly = share.permissions === 'view_only';
  const listRows = snap?.rows ?? [];
  const isListShare = listRows.length > 0;
  const isInventoryList = share.resourceType === 'inventory';
  const showQuantities =
    !isViewOnly &&
    (isListShare
      ? listRows.some(
          (row) =>
            row.stockTotal != null ||
            row.system_quantity != null ||
            row.counted_quantity != null,
        )
      : snap?.stockTotal != null ||
        snap?.stockAvailable != null ||
        snap?.stockReserved != null);
  const allowComments = share.permissions === 'view_comment';
  const allowApproval = share.permissions === 'view_approve';
  const allowReprove = share.permissions === 'view_reprove';
  const productTitle = snap?.title ?? snap?.name ?? share.name;

  return (
    <div className="ls-share-public">
      <Toaster position="top-center" />

      <header className="ls-share-public__header">
        <div className="ls-share-public__brand">
          <div className="ls-share-public__brand-mark" aria-hidden>
            L
          </div>
          <div className="min-w-0">
            <p className="ls-share-public__brand-title">LogStoka</p>
            <p className="ls-share-public__brand-sub">Visualização externa</p>
          </div>
        </div>
        {timeRemaining ? (
          <div className="ls-share-public__timer">
            <Clock size={13} aria-hidden />
            {timeRemaining}
          </div>
        ) : null}
      </header>

      <main className="ls-share-public__main">
        <div className="ls-share-public__banner">
          <Shield size={16} aria-hidden />
          <span>
            Snapshot congelado em {formatExpiry(share.createdAt)} — leitura segura, sem acesso ao WMS
            ao vivo.
          </span>
        </div>

        <section className="ls-share-public__hero">
          <div className="ls-share-public__hero-top">
            {snap?.main_image_url ? (
              <img src={snap.main_image_url} alt="" className="ls-share-public__image" />
            ) : (
              <div className="ls-share-public__image ls-share-public__image--empty">
                <Package size={28} strokeWidth={1.5} aria-hidden />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="ls-share-public__eyebrow">{RESOURCE_LABEL[share.resourceType]}</p>
              <h1 className="ls-share-public__title">{productTitle}</h1>
              <div className="ls-share-public__chips">
                {isListShare ? (
                  <span className="ls-share-public__chip">
                    Itens<strong>{listRows.length}</strong>
                  </span>
                ) : null}
                {snap?.sku ? (
                  <span className="ls-share-public__chip">
                    SKU<strong>{snap.sku}</strong>
                  </span>
                ) : null}
                {snap?.unit ? (
                  <span className="ls-share-public__chip">
                    Un.<strong>{snap.unit}</strong>
                  </span>
                ) : null}
                {snap?.brand ? (
                  <span className="ls-share-public__chip">
                    Marca<strong>{snap.brand}</strong>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="ls-share-public__meta">
            <span>
              Enviado por <strong>{share.creatorName}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye size={13} aria-hidden />
              {share.visits} {share.visits === 1 ? 'visualização' : 'visualizações'}
            </span>
          </div>

          {share.note ? (
            <div className="ls-share-public__note">
              <p className="ls-share-public__note-label">Instruções do emissor</p>
              <p className="ls-share-public__note-text">{share.note}</p>
            </div>
          ) : null}
        </section>

        {isListShare && showQuantities && snap?.stockTotal != null ? (
          <div className="ls-share-public__kpis ls-share-public__kpis--compact">
            <div className="ls-share-public__kpi">
              <p className="ls-share-public__kpi-label">Produtos</p>
              <p className="ls-share-public__kpi-value">{listRows.length}</p>
            </div>
            <div className="ls-share-public__kpi">
              <p className="ls-share-public__kpi-label">Unidades (soma)</p>
              <p className="ls-share-public__kpi-value ls-share-public__kpi-value--accent">
                {snap.stockTotal.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        ) : null}

        {isListShare ? (
          <section className="ls-share-public__card ls-share-public__card--flush">
            <div className="ls-share-public__table-head">
              <h2 className="ls-share-public__card-title">
                {isInventoryList ? 'Itens do inventário' : 'Produtos compartilhados'}
              </h2>
              <span className="ls-share-public__table-count">
                {listRows.length} {listRows.length === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <div className="ls-share-public__table-wrap">
              <table className="ls-share-public__table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>SKU</th>
                    {isInventoryList && showQuantities ? (
                      <>
                        <th className="ls-share-public__table-num">Sistema</th>
                        <th className="ls-share-public__table-num">Contado</th>
                        <th className="ls-share-public__table-num">Dif.</th>
                      </>
                    ) : showQuantities ? (
                      <>
                        <th>Categoria</th>
                        <th className="ls-share-public__table-num">Estoque</th>
                      </>
                    ) : (
                      <th>Categoria</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {listRows.map((row, index) => (
                    <tr key={`${row.sku ?? row.name}-${index}`}>
                      <td>
                        <div className="ls-share-public__table-product">
                          {row.main_image_url ? (
                            <img src={row.main_image_url} alt="" className="ls-share-public__table-thumb" />
                          ) : (
                            <span className="ls-share-public__table-thumb ls-share-public__table-thumb--empty">
                              <Package size={14} aria-hidden />
                            </span>
                          )}
                          <span className="ls-share-public__table-name">{row.name}</span>
                        </div>
                      </td>
                      <td className="ls-share-public__table-mono">{row.sku ?? '—'}</td>
                      {isInventoryList && showQuantities ? (
                        <>
                          <td className="ls-share-public__table-num">
                            {row.system_quantity?.toLocaleString('pt-BR') ?? '—'}
                          </td>
                          <td className="ls-share-public__table-num">
                            {row.counted_quantity?.toLocaleString('pt-BR') ?? '—'}
                          </td>
                          <td
                            className={`ls-share-public__table-num ${
                              row.difference != null && row.difference !== 0
                                ? 'ls-share-public__table-num--warn'
                                : ''
                            }`}
                          >
                            {row.difference?.toLocaleString('pt-BR') ?? '—'}
                          </td>
                        </>
                      ) : showQuantities ? (
                        <>
                          <td>{row.category ?? '—'}</td>
                          <td className="ls-share-public__table-num ls-share-public__table-num--accent">
                            {row.stockTotal?.toLocaleString('pt-BR') ?? '—'}
                            {row.unit ? ` ${row.unit}` : ''}
                          </td>
                        </>
                      ) : (
                        <td>{row.category ?? row.unit ?? '—'}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!isListShare && showQuantities ? (
          <>
            <div className="ls-share-public__kpis">
              <div className="ls-share-public__kpi">
                <p className="ls-share-public__kpi-label">Em estoque</p>
                <p className="ls-share-public__kpi-value ls-share-public__kpi-value--accent">
                  {snap?.stockTotal?.toLocaleString('pt-BR') ?? '—'}
                </p>
              </div>
              <div className="ls-share-public__kpi">
                <p className="ls-share-public__kpi-label">Disponível</p>
                <p className="ls-share-public__kpi-value">
                  {snap?.stockAvailable?.toLocaleString('pt-BR') ?? '—'}
                </p>
              </div>
              <div className="ls-share-public__kpi">
                <p className="ls-share-public__kpi-label">Reservado</p>
                <p className="ls-share-public__kpi-value">
                  {snap?.stockReserved?.toLocaleString('pt-BR') ?? '—'}
                </p>
              </div>
            </div>

            {snap?.divergencesFound ? (
              <p className="ls-share-public__alert ls-share-public__alert--warn">
                Há divergências pendentes de conciliação neste snapshot.
              </p>
            ) : (
              <p className="ls-share-public__alert ls-share-public__alert--ok">
                Quantidades conferidas e consistentes no momento do compartilhamento.
              </p>
            )}
          </>
        ) : !isListShare ? (
          <p className="ls-share-public__alert ls-share-public__alert--warn">
            Este link mostra apenas cadastro — quantidades de estoque estão ocultas.
          </p>
        ) : isListShare && !showQuantities ? (
          <p className="ls-share-public__alert ls-share-public__alert--warn">
            Lista de produtos — quantidades ocultas neste link (somente leitura de cadastro).
          </p>
        ) : null}

        {allowApproval || allowReprove ? (
          <section className="ls-share-public__card">
            <h2 className="ls-share-public__card-title">
              <CheckCircle size={15} aria-hidden />
              Sua decisão
            </h2>
            <p className="ls-share-public__card-text">
              Confirme se as quantidades deste snapshot estão corretas. O responsável do estoque será
              notificado.
            </p>

            {approval === 'pending' ? (
              <div className="ls-share-public__actions">
                <button
                  type="button"
                  className="ls-share-public__btn ls-share-public__btn--approve"
                  onClick={() => handleApproval('approved')}
                >
                  <CheckCircle size={16} />
                  Aprovar estoque
                  {snap?.stockTotal != null ? ` · ${snap.stockTotal.toLocaleString('pt-BR')} un.` : ''}
                </button>
                {allowReprove ? (
                  <button
                    type="button"
                    className="ls-share-public__btn ls-share-public__btn--reject"
                    onClick={() => handleApproval('rejected')}
                  >
                    <XCircle size={16} />
                    Rejeitar e pedir recontagem
                  </button>
                ) : null}
              </div>
            ) : (
              <div
                className={`ls-share-public__result ${
                  approval === 'approved' ? 'ls-share-public__result--ok' : 'ls-share-public__result--err'
                }`}
              >
                {approval === 'approved' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                <span>
                  {approval === 'approved'
                    ? 'Estoque aprovado. Obrigado pela confirmação.'
                    : 'Contagem rejeitada. O estoque será reavaliado.'}
                </span>
              </div>
            )}
          </section>
        ) : null}

        {allowComments ? (
          <section className="ls-share-public__card">
            <h2 className="ls-share-public__card-title">
              <MessageSquare size={15} aria-hidden />
              Comentários
            </h2>

            <div className="ls-share-public__comments">
              {comments.length === 0 ? (
                <p className="ls-share-public__empty">Nenhum comentário ainda.</p>
              ) : (
                comments.map((c) => (
                  <article key={c.id} className="ls-share-public__comment">
                    <div className="ls-share-public__comment-head">
                      <span>{c.author}</span>
                      <span className="ls-share-public__comment-time">
                        {new Date(c.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="ls-share-public__comment-text">{c.text}</p>
                  </article>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="ls-share-public__form">
              <div>
                <label className="ls-share-public__label" htmlFor="share-visitor-name">
                  Seu nome
                </label>
                <input
                  id="share-visitor-name"
                  type="text"
                  className="ls-share-public__input"
                  placeholder="Ex.: Maria — Conferência"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                />
              </div>
              <div>
                <label className="ls-share-public__label" htmlFor="share-comment">
                  Mensagem
                </label>
                <div className="ls-share-public__submit-row">
                  <input
                    id="share-comment"
                    type="text"
                    className="ls-share-public__input"
                    placeholder="Escreva uma observação…"
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="ls-share-public__send" aria-label="Enviar comentário">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </form>
          </section>
        ) : null}

        {isViewOnly ? (
          <section className="ls-share-public__card">
            <p className="ls-share-public__card-text flex items-center justify-center gap-2 m-0">
              <Lock size={14} aria-hidden />
              Somente leitura — comentários e aprovação desativados neste link.
            </p>
          </section>
        ) : null}
      </main>

      <footer className="ls-share-public__footer">
        LogStoka · compartilhamento seguro · {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default SharedPublicPage;
