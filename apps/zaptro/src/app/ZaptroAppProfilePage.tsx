import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Building2, Eye, KeyRound, Laptop, Save, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useZaptroCompanyBusinessProfile } from '../hooks/useZaptroCompanyBusinessProfile';
import {
  ZaptroCompanyNotifSettings,
  ZaptroCompanyProfileForm,
  ZaptroCompanyProfilePreview,
} from '../components/Zaptro/ZaptroCompanyProfileSections';
import { useTenant } from '../context/TenantContext';
import './zaptroAppModulePage.css';

type ProfileTab = 'personal' | 'company' | 'preview' | 'notifications' | 'security' | 'sessions';

const TAB_FROM_QUERY: Record<string, ProfileTab> = {
  personal: 'personal',
  company: 'company',
  empresa: 'company',
  preview: 'preview',
  notifications: 'notifications',
  notificacoes: 'notifications',
  security: 'security',
  sessions: 'sessions',
};

const ZaptroAppProfilePage: React.FC = () => {
  const { profile } = useAuth();
  const { company } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = TAB_FROM_QUERY[searchParams.get('tab') || ''] || 'personal';
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const companySyncActive = tab === 'company' || tab === 'preview' || tab === 'notifications';
  const companyApi = useZaptroCompanyBusinessProfile({ syncActive: companySyncActive });

  useEffect(() => {
    const q = searchParams.get('tab');
    if (q && TAB_FROM_QUERY[q]) setTab(TAB_FROM_QUERY[q]);
  }, [searchParams]);

  const selectTab = (next: ProfileTab) => {
    setTab(next);
    if (next === 'personal') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', next);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const initials =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ||
    profile?.email?.trim()?.[0]?.toUpperCase() ||
    'U';

  const avatarUrl = profile?.avatar_url?.trim() || null;

  const roleLabel = useMemo(() => {
    const r = String(profile?.role || '').trim();
    return r ? r.replace(/_/g, ' ') : '—';
  }, [profile?.role]);

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: (profile as { phone?: string })?.phone || '',
    job_title: (profile as { job_title?: string })?.job_title || '',
  });

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: (profile as { phone?: string })?.phone || '',
      job_title: (profile as { job_title?: string })?.job_title || '',
    });
  }, [profile?.full_name, profile?.email, (profile as { phone?: string })?.phone, (profile as { job_title?: string })?.job_title]);

  const savePersonal = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await new Promise((r) => setTimeout(r, 450));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const showFootSave = tab === 'personal';

  return (
    <div className="zaptro-app-module-page zaptro-app-module-page--profile">
      <style>{`
        .zaptro-app-module-page--profile{
          padding: 20px 0 40px;
          box-sizing: border-box;
        }
        .zaptro-profile-page{
          padding: 8px 0 0;
        }
        .zaptro-profile-head{
          margin: 0 0 18px;
        }
        .zaptro-profile-head h1{
          margin: 0;
          font-size: 30px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }
        .zaptro-profile-head p{
          margin: 6px 0 0;
          font-size: 12px;
          font-weight: 650;
          color: rgba(100,116,139,1);
          max-width: 720px;
          line-height: 1.45;
        }
        .zaptro-profile-layout{
          display:grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }
        .zaptro-profile-side{
          border-radius: 22px;
          border: 1px solid rgba(15,23,42,0.06);
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(15,23,42,0.04);
          padding-top: 18px;
          padding-bottom: 10px;
          padding-left: 30px;
          padding-right: 30px;
          height: 370px;
          min-height: 370px;
          box-sizing: border-box;
        }
        .zaptro-profile-side__item{
          width: 100%;
          border: none;
          background: transparent;
          cursor: pointer;
          padding-top: 14px;
          padding-bottom: 14px;
          padding-left: 12px;
          padding-right: 12px;
          margin-top: 5px;
          margin-bottom: 5px;
          border-radius: 14px;
          display:flex;
          align-items:center;
          gap: 10px;
          font-family: inherit;
          color: #64748B;
          font-weight: 600;
          font-size: 13px;
          text-align: left;
          box-shadow: none;
          transform: none;
        }
        .zaptro-profile-side__item svg{
          color: #64748B;
          flex-shrink: 0;
        }
        .zaptro-profile-side__item:hover{
          transform: none;
        }
        .zaptro-profile-side__item.is-active{
          background: linear-gradient(180deg, rgba(10,10,10,1) 0%, rgba(0,0,0,1) 100%);
          color: #d9ff00;
          font-weight: 600;
          box-shadow: 0 10px 26px rgba(0,0,0,0.18);
        }
        .zaptro-profile-side__item.is-active svg{
          color: #d9ff00;
        }
        .zaptro-profile-panel{
          border-radius: 28px;
          border: 1px solid rgba(15,23,42,0.06);
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(15,23,42,0.04);
          overflow: hidden;
          min-height: 520px;
          display:flex;
          flex-direction: column;
        }
        .zaptro-profile-panel__inner{
          padding-top: 30px;
          padding-right: 40px;
          padding-bottom: 40px;
          padding-left: 40px;
          flex: 1 1 auto;
          min-height: 0;
          box-sizing: border-box;
        }
        .zaptro-profile-hero{
          display:flex;
          gap: 16px;
          align-items: center;
          padding: 0;
          margin-top: 40px;
          margin-bottom: 40px;
        }
        .zaptro-profile-avatar{
          width: 92px;
          height: 92px;
          border-radius: 22px;
          border: 1px solid rgba(15,23,42,0.08);
          background: #ffffff;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          flex: 0 0 auto;
          box-shadow: 0 12px 30px rgba(15,23,42,0.10);
        }
        .zaptro-profile-avatar img{
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .zaptro-profile-hero h2{
          margin: 0;
          font-size: 22px;
          font-weight: 950;
          letter-spacing: -0.02em;
        }
        .zaptro-profile-hero .meta{
          margin-top: 6px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: rgba(37,99,235,1);
        }
        .zaptro-profile-hero .line{
          margin-top: 6px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(100,116,139,1);
        }
        .zaptro-profile-grid{
          display:grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--zaptro-form-stack-gap, 26px) 20px;
        }
        .zaptro-profile-panel__foot{
          padding: 16px 22px;
          border-top: 1px solid rgba(15,23,42,0.08);
          display:flex;
          justify-content: flex-end;
        }
        .zaptro-profile-save{
          border: none;
          cursor: pointer;
          height: 44px;
          padding: 0 18px;
          border-radius: 16px;
          font-family: inherit;
          font-weight: 950;
          font-size: 13px;
          background: #0f172a;
          color: #d9ff00;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 26px rgba(0,0,0,0.18);
        }
        .zaptro-profile-save:disabled{
          opacity: .6;
          cursor: default;
        }
        .zaptro-profile-pane-title{
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -0.02em;
        }
        .zaptro-profile-pane-sub{
          margin: 0 0 18px;
          font-size: 12px;
          font-weight: 650;
          color: rgba(100,116,139,1);
          line-height: 1.4;
        }
        .zaptro-profile-placeholder{
          border-radius: 22px;
          border: 1px solid rgba(15,23,42,0.08);
          background: rgba(15,23,42,0.02);
          padding: 14px;
          color: rgba(100,116,139,1);
          font-weight: 700;
          font-size: 12px;
          line-height: 1.45;
        }
        .zaptro-profile-sync-hint{
          margin: 0 0 16px;
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(217,255,0,0.12);
          border: 1px solid rgba(15,23,42,0.08);
          font-size: 12px;
          font-weight: 650;
          color: #6B6B6B;
          line-height: 1.45;
        }
        @media (max-width: 980px){
          .zaptro-app-module-page--profile{ padding-left: 20px; padding-right: 20px; }
          .zaptro-profile-layout{ grid-template-columns: minmax(0, 1fr); }
          .zaptro-profile-grid{ grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>

      <div className="zaptro-profile-page">
        <div className="zaptro-profile-head">
          <h1>Meu Perfil</h1>
          <p>
            Dados do administrador da conta que contratou o Zaptro, perfil comercial da empresa (WhatsApp), prévia
            pública e notificações — sincronizado com o painel «Perfil da empresa».
          </p>
        </div>

        <div className="zaptro-profile-layout">
          <aside className="zaptro-profile-side" aria-label="Menu do perfil">
            <button
              type="button"
              className={`zaptro-profile-side__item${tab === 'personal' ? ' is-active' : ''}`}
              onClick={() => selectTab('personal')}
            >
              <User size={18} /> Dados Pessoais
            </button>
            <button
              type="button"
              className={`zaptro-profile-side__item${tab === 'company' ? ' is-active' : ''}`}
              onClick={() => selectTab('company')}
            >
              <Building2 size={18} /> Perfil da empresa
            </button>
            <button
              type="button"
              className={`zaptro-profile-side__item${tab === 'preview' ? ' is-active' : ''}`}
              onClick={() => selectTab('preview')}
            >
              <Eye size={18} /> Como clientes veem
            </button>
            <button
              type="button"
              className={`zaptro-profile-side__item${tab === 'notifications' ? ' is-active' : ''}`}
              onClick={() => selectTab('notifications')}
            >
              <Bell size={18} /> Notificações
            </button>
            <button
              type="button"
              className={`zaptro-profile-side__item${tab === 'security' ? ' is-active' : ''}`}
              onClick={() => selectTab('security')}
            >
              <KeyRound size={18} /> Segurança & Senha
            </button>
            <button
              type="button"
              className={`zaptro-profile-side__item${tab === 'sessions' ? ' is-active' : ''}`}
              onClick={() => selectTab('sessions')}
            >
              <Laptop size={18} /> Sessões Ativas
            </button>
          </aside>

          <section className="zaptro-profile-panel" aria-label="Conteúdo do perfil">
            <div className="zaptro-profile-panel__inner">
              {tab === 'company' || tab === 'preview' || tab === 'notifications' ? (
                <p className="zaptro-profile-sync-hint">
                  Alterações aqui reflectem-se no drawer «Perfil da empresa» (ícone no topo) e vice-versa — mesma base
                  de dados e sincronização WhatsApp.
                </p>
              ) : null}

              {tab === 'personal' ? (
                <>
                  <p className="zaptro-profile-sync-hint" style={{ marginTop: 0 }}>
                    Estes campos são do utilizador administrador que contratou o plano — não confundir com os dados dos
                    seus clientes finais (transportes / cargas).
                  </p>
                  <div className="zaptro-profile-hero">
                    <div className="zaptro-profile-avatar" aria-hidden>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" />
                      ) : (
                        <span style={{ fontWeight: 1000, fontSize: 18 }}>{initials}</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h2>{profile?.full_name?.trim() || 'Utilizador'}</h2>
                      <div className="meta">{roleLabel}</div>
                      <div className="line">
                        Responsável pela conta · {company?.name?.trim() || 'Empresa'} · administrador que comprou o
                        serviço
                      </div>
                    </div>
                  </div>

                  <div className="zaptro-profile-grid">
                    <div className="zaptro-profile-field">
                      <label className="zaptro-form-label" htmlFor="zaptro-profile-full-name">
                        Nome completo
                      </label>
                      <input
                        id="zaptro-profile-full-name"
                        className="zaptro-form-control"
                        value={form.full_name}
                        onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                        placeholder="Seu nome"
                      />
                    </div>
                    <div className="zaptro-profile-field">
                      <label className="zaptro-form-label" htmlFor="zaptro-profile-email">
                        E-mail profissional
                      </label>
                      <input
                        id="zaptro-profile-email"
                        className="zaptro-form-control"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div className="zaptro-profile-field">
                      <label className="zaptro-form-label" htmlFor="zaptro-profile-phone">
                        Telefone / WhatsApp
                      </label>
                      <input
                        id="zaptro-profile-phone"
                        className="zaptro-form-control"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="zaptro-profile-field">
                      <label className="zaptro-form-label" htmlFor="zaptro-profile-job-title">
                        Cargo
                      </label>
                      <input
                        id="zaptro-profile-job-title"
                        className="zaptro-form-control"
                        value={form.job_title}
                        onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
                        placeholder="Ex.: CEO / Diretor"
                      />
                    </div>
                  </div>
                </>
              ) : null}

              {tab === 'company' ? (
                <ZaptroCompanyProfileForm
                  api={companyApi}
                  onOpenPreview={() => selectTab('preview')}
                  showCompanyLink
                />
              ) : null}

              {tab === 'preview' ? (
                <ZaptroCompanyProfilePreview api={companyApi} onEdit={() => selectTab('company')} />
              ) : null}

              {tab === 'notifications' ? <ZaptroCompanyNotifSettings api={companyApi} /> : null}

              {tab === 'security' ? (
                <>
                  <h2 className="zaptro-profile-pane-title">Segurança & Senha</h2>
                  <p className="zaptro-profile-pane-sub">Mantenha sua conta protegida com uma senha forte.</p>
                  <div className="zaptro-profile-placeholder">
                    Tela pronta no layout. A parte de “Alterar senha” e “2FA” pode ser conectada ao Supabase Auth quando você pedir.
                  </div>
                </>
              ) : null}

              {tab === 'sessions' ? (
                <>
                  <h2 className="zaptro-profile-pane-title">Sessões Ativas</h2>
                  <p className="zaptro-profile-pane-sub">Dispositivos que estão conectados na sua conta neste momento.</p>
                  <div className="zaptro-profile-placeholder">
                    Mostraremos aqui as sessões do Supabase (browser/app). Por enquanto, layout pronto no padrão do print.
                  </div>
                </>
              ) : null}
            </div>

            {showFootSave ? (
              <div className="zaptro-profile-panel__foot">
                <button className="zaptro-profile-save" type="button" onClick={savePersonal} disabled={saving}>
                  <Save size={18} /> {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar dados pessoais'}
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ZaptroAppProfilePage;
