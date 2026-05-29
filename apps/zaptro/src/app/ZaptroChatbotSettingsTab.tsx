import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Info, RotateCcw } from 'lucide-react';
import { useZaptroTheme } from '../context/ZaptroThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { ZAPTRO_FIELD_BG, ZAPTRO_SECTION_BORDER } from '../constants/zaptroUi';
import {
  ZAPTRO_PROMPT_MESTRE_INTEGRATIONS_NOTE,
  getDefaultZaptroPromptMestreBody,
  type ZaptroPromptMestreScope,
  type ZaptroPromptMestreTone,
} from '../constants/zaptroPromptMestre';
import {
  DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS,
  readZaptroPromptMestreFromCompanySettings,
  readZaptroPromptMestreFromStorage,
  saveZaptroPromptMestrePrefs,
  writeZaptroPromptMestreToStorage,
  type ZaptroPromptMestrePrefs,
} from '../lib/zaptroPromptMestre';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import {
  ZAPTRO_OLLAMA_DEFAULT_MODEL,
  ZAPTRO_OLLAMA_DEV_PROXY_PATH,
  ZAPTRO_OLLAMA_VPS_BASE_URL,
  ZAPTRO_OLLAMA_VPS_LABEL,
  ZAPTRO_OLLAMA_VPS_MODEL_TAG,
} from '../constants/zaptroOllamaConfig';
import { ollamaModelPrimary, pingOllamaDetailed } from '../lib/ollamaCopilot';

const ZaptroChatbotSettingsTab: React.FC = () => {
  const { palette } = useZaptroTheme();
  const { profile } = useAuth();
  const { company, setCompany } = useTenant();
  const [, setSearchParams] = useSearchParams();

  const [scope, setScope] = useState<ZaptroPromptMestreScope>(DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS.scope);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS.systemPrompt);
  const [tone, setTone] = useState<ZaptroPromptMestreTone>(DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS.tone);
  const [quietHours, setQuietHours] = useState(DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS.quietHours);
  const [autoReplyWhatsapp, setAutoReplyWhatsapp] = useState(
    DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS.autoReplyWhatsapp ?? true,
  );
  const [signOff, setSignOff] = useState(DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS.signOff);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [ollamaModel, setOllamaModel] = useState(ollamaModelPrimary());
  const [ollamaChecking, setOllamaChecking] = useState(false);

  const fieldBorder = palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : ZAPTRO_SECTION_BORDER;
  const fieldBg = palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fafafa';

  const applyPrefs = useCallback((prefs: ZaptroPromptMestrePrefs) => {
    setScope(prefs.scope);
    setSystemPrompt(prefs.systemPrompt);
    setTone(prefs.tone);
    setQuietHours(prefs.quietHours);
    setAutoReplyWhatsapp(prefs.autoReplyWhatsapp !== false);
    setSignOff(prefs.signOff);
  }, []);

  useEffect(() => {
    const fromDb = readZaptroPromptMestreFromCompanySettings(company);
    if (fromDb) {
      applyPrefs(fromDb);
      return;
    }
    applyPrefs(readZaptroPromptMestreFromStorage(profile?.company_id));
  }, [company, profile?.company_id, applyPrefs]);

  const checkOllama = useCallback(async () => {
    setOllamaChecking(true);
    try {
      const r = await pingOllamaDetailed();
      setOllamaOnline(r.online);
      setOllamaModel(r.resolvedModel || ollamaModelPrimary());
    } finally {
      setOllamaChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkOllama();
  }, [checkOllama]);

  const handleScopeChange = (next: ZaptroPromptMestreScope) => {
    setScope(next);
    setSystemPrompt(getDefaultZaptroPromptMestreBody(next));
  };

  const resetToDefault = () => {
    const next = {
      ...DEFAULT_ZAPTRO_PROMPT_MESTRE_PREFS,
      scope,
      systemPrompt: getDefaultZaptroPromptMestreBody(scope),
    };
    applyPrefs(next);
  };

  const currentPrefs = useMemo(
    (): ZaptroPromptMestrePrefs => ({
      scope,
      systemPrompt,
      tone,
      quietHours,
      signOff,
      autoReplyWhatsapp,
    }),
    [scope, systemPrompt, tone, quietHours, signOff, autoReplyWhatsapp],
  );

  const savePrefs = async () => {
    setSaving(true);
    try {
      if (company?.id) {
        const prevSettings =
          company.settings && typeof company.settings === 'object' && !Array.isArray(company.settings)
            ? { ...(company.settings as Record<string, unknown>) }
            : undefined;
        const saved = await saveZaptroPromptMestrePrefs(company.id, currentPrefs, prevSettings);
        if (setCompany) {
          setCompany({
            ...company,
            settings: {
              ...(prevSettings ?? {}),
              zaptro_prompt_mestre: saved,
            },
          } as typeof company);
        }
      } else {
        writeZaptroPromptMestreToStorage(profile?.company_id, {
          ...currentPrefs,
          updatedAt: new Date().toISOString(),
        });
      }
      setSavedAt(new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      notifyZaptro('success', 'Guardado', 'Prompt Mestre e preferências do chatbot actualizados.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível guardar.';
      notifyZaptro('error', 'Erro', msg);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderRadius: 14,
    border: `1px solid ${fieldBorder}`,
    backgroundColor: fieldBg,
    color: palette.text,
    fontWeight: 600,
    fontSize: 14,
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 960, padding: '12px 0 32px', boxSizing: 'border-box', width: '100%' }}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 22 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f4f4f5',
            border: `1px solid ${fieldBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Bot size={26} color={palette.text} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: palette.text }}>
            ZAPTRO AI MASTER · Llama 3.2
          </h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: palette.textMuted, fontWeight: 600 }}>
            Cérebro operacional da plataforma (Ollama). Triagem por menu continua em{' '}
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'automation' }, { replace: true })}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                font: 'inherit',
                fontWeight: 700,
                color: palette.text,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Automação / Fluxos
            </button>
            .
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          marginBottom: 18,
          padding: '14px 16px',
          borderRadius: 16,
          border: `1px solid ${fieldBorder}`,
          backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fafafa',
          color: palette.textMuted,
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.55,
        }}
      >
        <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>{ZAPTRO_PROMPT_MESTRE_INTEGRATIONS_NOTE}</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginBottom: 18,
          padding: '16px 18px',
          borderRadius: 16,
          border: `1px solid ${fieldBorder}`,
          backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 13, fontWeight: 800, color: palette.text }}>Conexão Ollama</strong>
          <button
            type="button"
            onClick={() => void checkOllama()}
            disabled={ollamaChecking}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: `1px solid ${fieldBorder}`,
              background: 'transparent',
              fontWeight: 700,
              fontSize: 12,
              cursor: ollamaChecking ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              color: palette.text,
            }}
          >
            {ollamaChecking ? 'A testar…' : 'Testar ligação'}
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: palette.textMuted, lineHeight: 1.55 }}>
          VPS: <strong style={{ color: palette.text }}>{ZAPTRO_OLLAMA_VPS_LABEL}</strong> ·{' '}
          {ZAPTRO_OLLAMA_VPS_BASE_URL} · modelo {ZAPTRO_OLLAMA_VPS_MODEL_TAG}
        </p>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: palette.textMuted, lineHeight: 1.55 }}>
          Dev local: browser → <code>{ZAPTRO_OLLAMA_DEV_PROXY_PATH}</code> →{' '}
          <code>OLLAMA_PROXY_TARGET={ZAPTRO_OLLAMA_VPS_BASE_URL}</code>
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 800,
            color: ollamaOnline === true ? '#15803d' : ollamaOnline === false ? '#dc2626' : palette.textMuted,
          }}
        >
          {ollamaOnline === true
            ? `Online · modelo activo: ${ollamaModel || ZAPTRO_OLLAMA_DEFAULT_MODEL}`
            : ollamaOnline === false
              ? 'Offline — reinicie npm run dev após alterar .env.local (ver OLLAMA_SETUP.md)'
              : 'A verificar…'}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          padding: 22,
          borderRadius: 20,
          border: `1px solid ${fieldBorder}`,
          backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: palette.textMuted }}>
            MODELO DE PROMPT
          </span>
          <select
            value={scope}
            onChange={(e) => handleScopeChange(e.target.value as ZaptroPromptMestreScope)}
            style={inputStyle}
          >
            <option value="master">ZAPTRO AI MASTER (Llama 3.2) — cérebro operacional</option>
            <option value="transportadora">Transportadora — foco fretes e entregas</option>
            <option value="zaptro">Plataforma Zaptro — SaaS, pagamentos, acesso</option>
          </select>
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: palette.textMuted }}>
            PROMPT MESTRE · LLAMA 3.2
          </span>
          <button
            type="button"
            onClick={resetToDefault}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 12,
              border: `1px solid ${fieldBorder}`,
              background: 'transparent',
              color: palette.text,
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <RotateCcw size={14} />
            Restaurar modelo
          </button>
        </div>

        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={18}
          spellCheck={false}
          style={{
            ...inputStyle,
            minHeight: 320,
            resize: 'vertical',
            lineHeight: 1.45,
            fontWeight: 500,
            fontSize: 12,
          }}
        />

        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: palette.textMuted }}>
            TOM DAS RESPOSTAS
          </span>
          <select value={tone} onChange={(e) => setTone(e.target.value as ZaptroPromptMestreTone)} style={inputStyle}>
            <option value="profissional">Profissional e objetivo</option>
            <option value="amigavel">Amigável e próximo</option>
            <option value="direto">Direto (frases curtas)</option>
            <option value="comercial">Comercial</option>
            <option value="tecnico">Técnico (logística)</option>
            <option value="corporativo">Corporativo</option>
          </select>
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
            color: palette.text,
          }}
        >
          <input
            type="checkbox"
            checked={autoReplyWhatsapp}
            onChange={(e) => setAutoReplyWhatsapp(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#000' }}
          />
          Resposta automática no WhatsApp (webhook → Llama 3.2 → Evolution).
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
            color: palette.text,
          }}
        >
          <input
            type="checkbox"
            checked={quietHours}
            onChange={(e) => setQuietHours(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#000' }}
          />
          Reduzir automatismos fora do horário comercial (9h–18h).
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: palette.textMuted }}>
            ASSINATURA / DESPEDIDA (TEXTO CURTO)
          </span>
          <input
            value={signOff}
            onChange={(e) => setSignOff(e.target.value)}
            placeholder="Ex.: — Equipa Zaptro"
            style={inputStyle}
          />
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => void savePrefs()}
            disabled={saving}
            style={{
              padding: '12px 20px',
              borderRadius: 14,
              border: 'none',
              background: '#000',
              color: palette.lime,
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'A guardar…' : 'Guardar Prompt Mestre'}
          </button>
          {savedAt ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: palette.textMuted }}>Guardado às {savedAt}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ZaptroChatbotSettingsTab;
