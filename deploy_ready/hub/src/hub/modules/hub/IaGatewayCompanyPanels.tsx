import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, AlertTriangle, ExternalLink, GraduationCap } from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import { useAuth } from '@core/context/AuthContext';

const TRAINING_SETTINGS_KEY = 'IA_GATEWAY_TRAINING_V1';

const DEFAULT_AI_QUOTA = 2500;
const DEFAULT_WA_QUOTA = 8000;

function matchPlan(planName: string | null | undefined, plans: Record<string, unknown>[]): Record<string, unknown> | null {
  const raw = (planName ?? '').toString().trim().toLowerCase();
  if (!raw) return null;
  for (const p of plans) {
    const n = ((p.name as string) ?? '').toLowerCase().trim();
    if (!n) continue;
    if (n === raw || raw === n) return p;
    if (n.includes(raw) || raw.includes(n)) return p;
  }
  return null;
}

function pctBarColor(pct: number, remaining: number): string {
  if (remaining <= 0) return '#EF4444';
  if (pct >= 90) return '#EF4444';
  if (pct >= 75) return '#F59E0B';
  return '#0061FF';
}

type UsageRow = {
  c: Record<string, unknown>;
  quotaAi: number;
  quotaWa: number;
  remAi: number;
  remWa: number;
  pctAi: number;
  pctWa: number;
  originLabel: string;
  alertKey: 'critical' | 'warn' | 'ok';
};

/** Painel: uso de créditos IA/WA por empresa (contratante), com estimativa vs pacote em `plans`. */
export function IaGatewayUsageTab() {
  const [companies, setCompanies] = useState<Record<string, unknown>[]>([]);
  const [plans, setPlans] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [originFilter, setOriginFilter] = useState<'all' | 'zaptro' | 'logta' | 'logdock'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: co, error: e1 }, { data: pl, error: e2 }] = await Promise.all([
        supabase
          .from('companies')
          .select('id, name, email, plan, origin, status, ai_credits, wa_credits, api_credits')
          .order('name', { ascending: true }),
        supabase.from('plans').select('id, name, ai_credits, wa_credits').order('created_at', { ascending: false }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      setCompanies(co || []);
      setPlans(pl || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao carregar empresas.';
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const mapped: UsageRow[] = companies.map((c) => {
      const p = matchPlan(c.plan as string, plans);
      const quotaAiRaw = Number(p?.ai_credits);
      const quotaWaRaw = Number(p?.wa_credits);
      const quotaAi = Number.isFinite(quotaAiRaw) && quotaAiRaw > 0 ? quotaAiRaw : DEFAULT_AI_QUOTA;
      const quotaWa = Number.isFinite(quotaWaRaw) && quotaWaRaw > 0 ? quotaWaRaw : DEFAULT_WA_QUOTA;
      const remAi = Math.max(0, Number(c.ai_credits) || 0);
      const remWa = Math.max(0, Number(c.wa_credits) || 0);
      const usedAi = Math.max(0, quotaAi - remAi);
      const usedWa = Math.max(0, quotaWa - remWa);
      const pctAi = quotaAi > 0 ? Math.min(100, (usedAi / quotaAi) * 100) : 0;
      const pctWa = quotaWa > 0 ? Math.min(100, (usedWa / quotaWa) * 100) : 0;
      const o = String(c.origin ?? '').toLowerCase();
      const originLabel = o.includes('zaptro') ? 'Zaptro' : o.includes('logdock') ? 'LogDock' : o.includes('logta') ? 'Logta' : '—';

      let alertKey: UsageRow['alertKey'] = 'ok';
      if (remAi <= 0 || remWa <= 0 || pctAi >= 92 || pctWa >= 92) alertKey = 'critical';
      else if (pctAi >= 72 || pctWa >= 72) alertKey = 'warn';

      return { c, quotaAi, quotaWa, remAi, remWa, pctAi, pctWa, originLabel, alertKey };
    });

    let list = mapped;
    if (originFilter !== 'all') {
      list = list.filter((r) => {
        const o = String(r.c.origin ?? '').toLowerCase();
        if (originFilter === 'zaptro') return o.includes('zaptro');
        if (originFilter === 'logta') return o.includes('logta') && !o.includes('zaptro');
        if (originFilter === 'logdock') return o.includes('logdock');
        return true;
      });
    }
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter(
        (r) =>
          String(r.c.name ?? '')
            .toLowerCase()
            .includes(qq) ||
          String(r.c.email ?? '')
            .toLowerCase()
            .includes(qq)
      );
    }
    return list.sort((a, b) => {
      const rank = (x: UsageRow) => (x.alertKey === 'critical' ? 0 : x.alertKey === 'warn' ? 1 : 2);
      const d = rank(a) - rank(b);
      if (d !== 0) return d;
      return String(a.c.name ?? '').localeCompare(String(b.c.name ?? ''), 'pt-BR');
    });
  }, [companies, plans, q, originFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          padding: '18px 20px',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          background: '#F8FAFC',
          fontSize: '13px',
          color: '#475569',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: '#0F172A' }}>Como ler esta grade:</strong> comparamos o <strong>saldo atual</strong> de créditos na empresa (
        <code>ai_credits</code> / <code>wa_credits</code>) com o <strong>pacote</strong> cadastrado na tabela <code>plans</code> (nome próximo ao
        campo <code>plan</code> da empresa). O percentual é uma <strong>estimativa de consumo do ciclo</strong> — se precisar de contagem real por
        tokens, integre métricas no backend e amplie esta visão.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar empresa ou e-mail…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            flex: '1 1 220px',
            minWidth: 200,
            padding: '10px 14px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <select
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value as typeof originFilter)}
          style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', fontWeight: 600, fontSize: '13px' }}
        >
          <option value="all">Todos os produtos</option>
          <option value="zaptro">Só Zaptro</option>
          <option value="logta">Só Logta</option>
          <option value="logdock">Só LogDock</option>
        </select>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            background: '#FFF',
            fontWeight: 700,
            fontSize: '13px',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
        <Link
          to="/master/billing?tab=creditos-ia"
          style={{
            marginLeft: 'auto',
            fontSize: '13px',
            fontWeight: 700,
            color: '#0061FF',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Ajustar pacotes no Financeiro <ExternalLink size={14} />
        </Link>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#FFF' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Empresa</th>
              <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Produto</th>
              <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Plano</th>
              <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>IA — uso est.</th>
              <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>WA — uso est.</th>
              <th style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>
                  Carregando carteiras…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={String(r.c.id)} style={{ borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{String(r.c.name ?? '—')}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: 4 }}>{String(r.c.email ?? '—')}</div>
                    {r.alertKey !== 'ok' && (
                      <div
                        style={{
                          marginTop: 8,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '11px',
                          fontWeight: 700,
                          color: r.alertKey === 'critical' ? '#B91C1C' : '#B45309',
                        }}
                      >
                        <AlertTriangle size={14} />
                        {r.alertKey === 'critical' ? 'Ação sugerida: créditos no limite ou esgotados.' : 'Próximo do limite — acompanhar ou antecipar recarga.'}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>{r.originLabel}</td>
                  <td style={{ padding: '14px 16px', color: '#334155' }}>{String(r.c.plan ?? '—')}</td>
                  <td style={{ padding: '14px 16px', minWidth: 160 }}>
                    <div style={{ height: 6, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                      <div
                        style={{
                          width: `${Math.min(100, r.pctAi)}%`,
                          height: '100%',
                          background: pctBarColor(r.pctAi, r.remAi),
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Saldo: <strong style={{ color: '#0F172A' }}>{r.remAi}</strong> · Pacote ref.: {r.quotaAi} · ~{r.pctAi.toFixed(0)}% consumido
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', minWidth: 160 }}>
                    <div style={{ height: 6, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                      <div
                        style={{
                          width: `${Math.min(100, r.pctWa)}%`,
                          height: '100%',
                          background: pctBarColor(r.pctWa, r.remWa),
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Saldo: <strong style={{ color: '#0F172A' }}>{r.remWa}</strong> · Pacote ref.: {r.quotaWa} · ~{r.pctWa.toFixed(0)}% consumido
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <Link
                      to={`/master/companies/${r.c.id}`}
                      style={{
                        fontWeight: 700,
                        fontSize: '12px',
                        color: '#0061FF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      Resolver <ExternalLink size={14} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TRAINING_SYSTEMS: { id: string; label: string; hint: string }[] = [
  { id: 'zaptro', label: 'Zaptro', hint: 'Respostas voltadas ao CRM, WhatsApp e jornada comercial.' },
  { id: 'logta', label: 'Logta SaaS', hint: 'ERP, logística, financeiro e operações do tenant.' },
  { id: 'logdock', label: 'LogDock', hint: 'Rastreamento, documentos e fluxos logísticos.' },
  { id: 'hub', label: 'Hub Master', hint: 'Painel master, governança e ferramentas internas.' },
];

type TrainingPayload = {
  systems: Record<string, string>;
  updated_at?: string;
};

function parseTraining(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const v = (raw as TrainingPayload).systems;
  if (!v || typeof v !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'string') out[k] = val;
  }
  return out;
}

/** Treino / políticas por sistema — persistido em master_settings (IA_GATEWAY_TRAINING_V1). */
export function IaGatewayTrainingTab() {
  const { profile } = useAuth();
  const [system, setSystem] = useState('zaptro');
  const [blocks, setBlocks] = useState<Record<string, string>>(() =>
    Object.fromEntries(TRAINING_SYSTEMS.map((s) => [s.id, '']))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('master_settings').select('value').eq('key', TRAINING_SETTINGS_KEY).maybeSingle();
        if (error) throw error;
        const parsed = parseTraining(data?.value);
        setBlocks((prev) => ({ ...prev, ...parsed }));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Falha ao carregar treinos.';
        toastError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentText = blocks[system] ?? '';

  const save = async () => {
    const tid = toastLoading('Salvando políticas de treino…');
    setSaving(true);
    try {
      const payload: TrainingPayload = {
        systems: { ...blocks },
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('master_settings').upsert(
        { key: TRAINING_SETTINGS_KEY, value: payload as unknown as Record<string, unknown> },
        { onConflict: 'key' }
      );
      if (error) throw error;
      if (profile?.id) {
        const { error: auditErr } = await supabase.from('master_audit_logs').insert({
          actor_id: profile.id,
          target_type: 'IA_GATEWAY',
          action: 'UPDATE_TRAINING_POLICY',
          details: 'Políticas de treino IA por sistema atualizadas.',
          metadata: { systems: Object.keys(blocks).filter((k) => (blocks[k] || '').trim().length > 0) },
        });
        if (auditErr) {
          /* auditoria opcional — salvamento principal já concluiu */
        }
      }
      toastSuccess('Treino salvo. Consuma este payload no gateway / agentes conforme sua pipeline.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar.';
      toastError(msg);
    } finally {
      toastDismiss(tid);
      setSaving(false);
    }
  };

  const meta = TRAINING_SYSTEMS.find((s) => s.id === system);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <GraduationCap size={22} color="#0061FF" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Treino da IA por sistema</h2>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#64748B', lineHeight: 1.5, maxWidth: 720 }}>
            Defina instruções permanentes, tom de voz, limites e exemplos por produto. O runtime deve ler{' '}
            <code style={{ fontSize: '12px' }}>{TRAINING_SETTINGS_KEY}</code> em <code style={{ fontSize: '12px' }}>master_settings</code> e mesclar ao
            prompt do agente do sistema escolhido.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {TRAINING_SYSTEMS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSystem(s.id)}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: system === s.id ? '2px solid #0061FF' : '1px solid #E2E8F0',
              background: system === s.id ? '#EFF6FF' : '#FFF',
              color: system === s.id ? '#0061FF' : '#475569',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {meta && (
        <p style={{ margin: 0, fontSize: '13px', color: '#64748B', fontStyle: 'italic' }}>
          {meta.hint}
        </p>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>Carregando cofre de treino…</div>
      ) : (
        <textarea
          value={currentText}
          onChange={(e) => setBlocks((prev) => ({ ...prev, [system]: e.target.value }))}
          placeholder={`Instruções e exemplos para ${meta?.label ?? 'este sistema'}…`}
          rows={16}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            fontSize: '14px',
            lineHeight: 1.55,
            fontFamily: 'inherit',
            resize: 'vertical',
            minHeight: 280,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => save()}
          disabled={saving || loading}
          style={{
            padding: '12px 24px',
            borderRadius: '14px',
            border: 'none',
            background: '#0061FF',
            color: '#FFF',
            fontWeight: 700,
            fontSize: '14px',
            cursor: saving ? 'wait' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {saving ? 'Salvando…' : 'Salvar treino deste sistema'}
        </button>
        <span style={{ fontSize: '12px', color: '#94A3B8' }}>
          Chave: <code>{TRAINING_SETTINGS_KEY}</code>
        </span>
      </div>
    </div>
  );
}
