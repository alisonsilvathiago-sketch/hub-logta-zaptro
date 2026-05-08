import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, RefreshCw, Save, Coins, ArrowRight } from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import { useAuth } from '@core/context/AuthContext';

const SETTINGS_KEY = 'IA_CLIENT_CREDITS_BALANCE';

type CreditPayload = {
  balances: Record<string, number>;
  updated_at?: string;
};

const parsePayload = (raw: unknown): CreditPayload => {
  if (!raw || typeof raw !== 'object') return { balances: {} };
  const o = raw as Record<string, unknown>;
  const balances = o.balances;
  if (balances && typeof balances === 'object' && !Array.isArray(balances)) {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(balances as Record<string, unknown>)) {
      const n = Number(v);
      if (!Number.isNaN(n)) out[k] = Math.max(0, Math.floor(n));
    }
    return { balances: out, updated_at: typeof o.updated_at === 'string' ? o.updated_at : undefined };
  }
  return { balances: {} };
};

/**
 * Gestão de créditos de IA por cliente — saldo persistido em master_settings (IA_CLIENT_CREDITS_BALANCE).
 * Integrado ao Financeiro: mesma área de governança de receita e consumo.
 */
const ClientIaCredits: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [draftDelta, setDraftDelta] = useState<Record<string, string>>({});
  const [lastSync, setLastSync] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: clientRows, error: e1 }, { data: row, error: e2 }] = await Promise.all([
        supabase.from('clients').select('id, name, email, status, companies(name)').order('name', { ascending: true }),
        supabase.from('master_settings').select('value').eq('key', SETTINGS_KEY).maybeSingle(),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      setClients(clientRows || []);
      const p = parsePayload(row?.value);
      setBalances(p.balances);
      setLastSync(p.updated_at || null);
      setDraftDelta({});
    } catch (e: any) {
      toastError(e?.message || 'Falha ao carregar créditos IA.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = async (next: Record<string, number>) => {
    const tid = toastLoading('Salvando saldos no cofre master...');
    setSaving(true);
    try {
      const payload: CreditPayload = {
        balances: next,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('master_settings').upsert(
        { key: SETTINGS_KEY, value: payload as any },
        { onConflict: 'key' }
      );
      if (error) throw error;
      if (profile?.id) {
        await supabase.from('master_audit_logs').insert({
          actor_id: profile.id,
          target_type: 'IA_CREDITS',
          action: 'UPDATE_BALANCES',
          details: 'Atualização de créditos IA por cliente',
          metadata: { keys_touched: Object.keys(next).length },
        });
      }
      setBalances(next);
      setLastSync(payload.updated_at!);
      setDraftDelta({});
      toastSuccess('Créditos IA sincronizados com o financeiro.');
    } catch (e: any) {
      toastError(e?.message || 'Erro ao persistir créditos.');
    } finally {
      toastDismiss(tid);
      setSaving(false);
    }
  };

  const applyDelta = (clientId: string) => {
    const raw = (draftDelta[clientId] || '').trim();
    if (raw === '') return;
    const delta = parseInt(raw, 10);
    if (Number.isNaN(delta)) {
      toastError('Use um número inteiro (ex.: 500 ou -100).');
      return;
    }
    const cur = balances[clientId] ?? 0;
    const nextVal = Math.max(0, cur + delta);
    const next = { ...balances, [clientId]: nextVal };
    persist(next);
  };

  const setExactBalance = (clientId: string, valueStr: string) => {
    const n = parseInt(valueStr, 10);
    if (Number.isNaN(n) || n < 0) {
      toastError('Saldo inválido.');
      return;
    }
    persist({ ...balances, [clientId]: n });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: embedded ? 16 : 24 }} className="animate-fade-in">
      {embedded ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          {lastSync ? (
            <span style={{ marginRight: 'auto', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
              Última atualização: {new Date(lastSync).toLocaleString('pt-BR')}
            </span>
          ) : (
            <span style={{ marginRight: 'auto' }} />
          )}
          <button
            type="button"
            disabled={loading}
            onClick={() => load()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={16} /> Recarregar
          </button>
          <Link
            to="/master/ia-gateway"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 12,
              border: 'none',
              background: '#0061FF',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            <Cpu size={16} /> Gateway IA <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
      <div
        style={{
          padding: '20px 24px',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: '#0061FF',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Coins size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#64748B', textTransform: 'uppercase' }}>
              Financeiro · consumo IA
            </p>
            <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Créditos IA por cliente
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#475569', maxWidth: 560, lineHeight: 1.5 }}>
              Saldo usado pelos clientes para tokens, agentes e gateway. Compre ou ajuste manualmente; os apps podem consultar a mesma chave{' '}
              <code style={{ fontSize: 12, background: '#F1F5F9', padding: '2px 6px', borderRadius: 6 }}>{SETTINGS_KEY}</code>.
            </p>
            {lastSync && (
              <p style={{ margin: '10px 0 0', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                Última atualização: {new Date(lastSync).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => load()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={16} /> Recarregar
          </button>
          <Link
            to="/master/ia-gateway"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 12,
              border: 'none',
              background: '#0061FF',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            <Cpu size={16} /> Gateway IA <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      )}

      <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 56, textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>Carregando clientes e saldos…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#F8FAFC' }}>
                  <th style={th}>Cliente</th>
                  <th style={th}>Empresa</th>
                  <th style={th}>Saldo atual</th>
                  <th style={th}>Definir saldo</th>
                  <th style={th}>Ajuste (+/−)</th>
                  <th style={{ ...th, width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                      Nenhum cliente na base.
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => {
                    const id = c.id as string;
                    const bal = balances[id] ?? 0;
                    return (
                      <tr key={id} style={{ borderTop: '1px solid #F1F5F9' }}>
                        <td style={td}>
                          <strong style={{ color: '#0F172A', fontSize: 14 }}>{c.name || '—'}</strong>
                          <div style={{ fontSize: 12, color: '#94A3B8' }}>{c.email || '—'}</div>
                        </td>
                        <td style={td}>
                          <span style={{ fontSize: 13, color: '#475569' }}>{c.companies?.name || '—'}</span>
                        </td>
                        <td style={td}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#0061FF', fontVariantNumeric: 'tabular-nums' }}>{bal}</span>
                          <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 6 }}>créd.</span>
                        </td>
                        <td style={td}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="number"
                              min={0}
                              defaultValue={bal}
                              key={`fixed-${id}-${lastSync || 0}-${bal}`}
                              id={`balance-${id}`}
                              style={{ ...inputStyle, maxWidth: 100 }}
                            />
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => {
                                const el = document.getElementById(`balance-${id}`) as HTMLInputElement | null;
                                setExactBalance(id, el?.value ?? '0');
                              }}
                              style={{
                                padding: '8px 10px',
                                borderRadius: 8,
                                border: '1px solid #E2E8F0',
                                background: '#fff',
                                fontWeight: 700,
                                fontSize: 11,
                                cursor: saving ? 'wait' : 'pointer',
                              }}
                            >
                              Gravar
                            </button>
                          </div>
                        </td>
                        <td style={td}>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="ex: +1000 ou -50"
                            value={draftDelta[id] ?? ''}
                            onChange={(e) => setDraftDelta((d) => ({ ...d, [id]: e.target.value }))}
                            style={{ ...inputStyle, maxWidth: 140 }}
                          />
                        </td>
                        <td style={td}>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => applyDelta(id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: 'none',
                              background: '#0F172A',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: saving ? 'wait' : 'pointer',
                            }}
                          >
                            <Save size={14} /> Aplicar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const th: React.CSSProperties = {
  padding: '14px 18px',
  fontSize: 10,
  fontWeight: 800,
  color: '#94A3B8',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
const td: React.CSSProperties = { padding: '14px 18px', verticalAlign: 'middle' };
const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 140,
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  fontSize: 13,
  fontWeight: 600,
};

export default ClientIaCredits;
