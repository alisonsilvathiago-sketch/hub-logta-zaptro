import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Camera, Save, LogOut, CheckCircle2, AlertCircle, UserCheck, Key, Globe, Bell } from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import { useToast } from '@core/context/ToastContext';
import SyncIndicator from '../../components/SyncIndicator';

const ProfilePage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '',
    bio: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        role: profile.role || 'Administrador Master',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profile?.id === 'dev-user') {
      showToast('Sessão de desenvolvimento detectada. Por favor, faça login com uma conta real para salvar alterações.', 'error');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
          bio: formData.bio
        })
        .eq('id', profile?.id);

      if (error) throw error;
      
      await refreshProfile();
      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao atualizar perfil: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile?.id}/avatar-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile?.id);

      if (updateError) throw updateError;

      await refreshProfile();
      showToast('Foto de perfil atualizada!', 'success');
    } catch (err: any) {
      showToast('Erro no upload: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER SECTION */}
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={styles.pageTitle}>Meu Perfil</h1>
            <SyncIndicator />
          </div>
          <p style={styles.pageSub}>Gerencie suas informações pessoais e segurança da conta</p>
        </div>
        <button 
          style={{ ...styles.saveBtn, opacity: loading ? 0.7 : 1 }} 
          onClick={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
        </button>
      </div>

      <div style={styles.contentGrid}>
        {/* LEFT COLUMN: AVATAR & QUICK INFO */}
        <div style={styles.leftCol}>
          <div style={styles.card}>
            <div style={styles.profileHero}>
              <div style={styles.banner} />
              <div style={styles.avatarSection}>
                <div style={styles.avatarWrapper}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} style={styles.largeAvatar} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>{profile?.full_name?.[0]}</div>
                  )}
                  <label style={styles.uploadLabel}>
                    <Camera size={18} color="white" />
                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div style={styles.heroInfo}>
                  <h2 style={styles.heroName}>{profile?.full_name || 'Usuário'}</h2>
                  <p style={styles.heroRole}>{formData.role}</p>
                </div>
              </div>
            </div>

            <div style={styles.quickStats}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Status da Conta</span>
                <div style={styles.statusBadge}>
                  <CheckCircle2 size={12} /> Ativa
                </div>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Membro desde</span>
                <span style={styles.statValue}>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}</span>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Acesso & Segurança</h3>
            <div style={styles.securityList}>
              <div style={styles.securityItem}>
                <div style={styles.securityIcon}><Key size={18} color="#6366F1" /></div>
                <div style={styles.securityText}>
                  <span style={styles.securityLabel}>Senha</span>
                  <span style={styles.securitySub}>Alterada há 3 meses</span>
                </div>
                <button style={styles.textBtn}>Alterar</button>
              </div>
              <div style={styles.securityItem}>
                <div style={styles.securityIcon}><Shield size={18} color="#10B981" /></div>
                <div style={styles.securityText}>
                  <span style={styles.securityLabel}>Autenticação em Duas Etapas</span>
                  <span style={styles.securitySub}>Proteja sua conta</span>
                </div>
                <button style={styles.textBtn}>Configurar</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED INFO */}
        <div style={styles.rightCol}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Informações Pessoais</h3>
            <form style={styles.form} onSubmit={handleUpdateProfile}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nome Completo</label>
                <div style={styles.inputWrapper}>
                  <User size={18} color="#94A3B8" />
                  <input 
                    style={styles.input} 
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>E-mail</label>
                  <div style={{ ...styles.inputWrapper, backgroundColor: '#F8FAFC' }}>
                    <Mail size={18} color="#94A3B8" />
                    <input 
                      style={styles.input} 
                      value={formData.email}
                      disabled
                      placeholder="seu@email.com"
                    />
                  </div>
                  <p style={styles.inputHint}>O e-mail não pode ser alterado por aqui.</p>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Telefone / WhatsApp</label>
                  <div style={styles.inputWrapper}>
                    <Phone size={18} color="#94A3B8" />
                    <input 
                      style={styles.input} 
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+55 (00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Cargo / Função</label>
                <div style={styles.inputWrapper}>
                  <UserCheck size={18} color="#94A3B8" />
                  <input 
                    style={styles.input} 
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Ex: Diretor Executivo"
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Biografia Curta</label>
                <textarea 
                  style={styles.textarea} 
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você..."
                />
              </div>
            </form>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Preferências do Sistema</h3>
            <div style={styles.prefsList}>
              <div style={styles.prefItem}>
                <div style={styles.prefInfo}>
                  <Bell size={18} color="#64748B" />
                  <div>
                    <span style={styles.prefLabel}>Notificações por E-mail</span>
                    <p style={styles.prefSub}>Receba alertas de segurança e relatórios</p>
                  </div>
                </div>
                <div style={styles.toggleActive} />
              </div>
              <div style={styles.prefItem}>
                <div style={styles.prefInfo}>
                  <Globe size={18} color="#64748B" />
                  <div>
                    <span style={styles.prefLabel}>Idioma do Painel</span>
                    <p style={styles.prefSub}>Português (Brasil)</p>
                  </div>
                </div>
                <button style={styles.textBtn}>Mudar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '40px', backgroundColor: '#F4F4F4', minHeight: '100vh', fontFamily: "'Outfit', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  headerInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-1.5px' },
  pageSub: { fontSize: '14px', color: '#94A3B8', fontWeight: '500' },
  saveBtn: { 
    backgroundColor: '#6366F1', color: 'white', border: 'none', padding: '12px 24px', 
    borderRadius: '24px', fontWeight: '700', cursor: 'pointer', display: 'flex', 
    alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
  },
  
  contentGrid: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: '32px' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '32px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '32px' },
  
  card: { backgroundColor: 'white', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '24px' },

  profileHero: { marginBottom: '24px' },
  banner: { height: '100px', backgroundColor: '#6366F1', borderRadius: '24px', marginBottom: '-50px' },
  avatarSection: { padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
  avatarWrapper: { position: 'relative' },
  largeAvatar: { width: '100px', height: '100px', borderRadius: '32px', objectFit: 'cover', border: '4px solid white', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' },
  avatarPlaceholder: { width: '100px', height: '100px', borderRadius: '32px', backgroundColor: '#6366F1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '800', border: '4px solid white' },
  uploadLabel: { position: 'absolute', bottom: '-4px', right: '-4px', backgroundColor: '#0F172A', padding: '8px', borderRadius: '12px', cursor: 'pointer', border: '3px solid white' },
  heroInfo: { textAlign: 'center' },
  heroName: { fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 },
  heroRole: { fontSize: '14px', color: '#64748B', fontWeight: '600', margin: '4px 0 0' },
  
  quickStats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '24px' },
  statItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  statLabel: { fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  statValue: { fontSize: '14px', fontWeight: '700', color: '#0F172A' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: '24px', fontSize: '12px', fontWeight: '700', width: 'fit-content' },

  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#64748B', marginLeft: '4px' },
  inputWrapper: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F1F5F9', padding: '0 16px', borderRadius: '24px', height: '52px', border: '1px solid transparent', transition: 'all 0.2s' },
  input: { flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '14px', fontWeight: '600', color: '#0F172A' },
  textarea: { backgroundColor: '#F1F5F9', border: 'none', outline: 'none', borderRadius: '24px', padding: '16px', fontSize: '14px', fontWeight: '600', color: '#0F172A', minHeight: '100px', resize: 'none', fontFamily: 'inherit' },
  inputHint: { fontSize: '11px', color: '#94A3B8', fontWeight: '500', marginLeft: '4px' },

  securityList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  securityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: '24px', backgroundColor: '#F8FAFC' },
  securityIcon: { width: '44px', height: '44px', borderRadius: '18px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  securityText: { flex: 1, display: 'flex', flexDirection: 'column' },
  securityLabel: { fontSize: '14px', fontWeight: '700', color: '#0F172A' },
  securitySub: { fontSize: '11px', color: '#94A3B8', fontWeight: '500' },
  textBtn: { background: 'none', border: 'none', color: '#6366F1', fontWeight: '800', fontSize: '12px', cursor: 'pointer', padding: '4px 8px' },

  prefsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  prefItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  prefInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  prefLabel: { fontSize: '14px', fontWeight: '700', color: '#0F172A', display: 'block' },
  prefSub: { fontSize: '12px', color: '#94A3B8', fontWeight: '500', margin: 0 },
  toggleActive: { width: '40px', height: '22px', backgroundColor: '#6366F1', borderRadius: '24px', position: 'relative', cursor: 'pointer', opacity: 0.8 }
};

export default ProfilePage;
