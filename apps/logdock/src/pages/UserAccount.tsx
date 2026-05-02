import React from 'react';
import { 
  Box, Shield, CreditCard, ChevronRight, 
  AlertTriangle, HardDrive, Info, User,
  Mail, Building2, Calendar, ShieldCheck, Lock, Camera
} from 'lucide-react';
import { useAuth } from '@shared/context/AuthContext';

const ProfilePage: React.FC = () => {
  const { profile, updateProfile } = useAuth() as any;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const storage = { used: 6.7, total: 20, percent: 33.5 };

  const [uploading, setUploading] = React.useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await updateProfile({ avatar_url: base64 });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.avatarSection}>
            <div 
              style={styles.avatar} 
              onClick={() => fileInputRef.current?.click()}
              title="Mudar foto de perfil"
              onMouseEnter={e => { const overlay = e.currentTarget.querySelector('.avatar-overlay') as HTMLElement; if (overlay) overlay.style.opacity = '1'; }}
              onMouseLeave={e => { const overlay = e.currentTarget.querySelector('.avatar-overlay') as HTMLElement; if (overlay) overlay.style.opacity = '0'; }}
            >
                {uploading ? (
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFF', textAlign: 'center' }}>...</div>
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} style={styles.avatarImg} alt="Avatar" />
                ) : (
                  profile?.full_name?.charAt(0) || 'U'
                )}
                <div className="avatar-overlay" style={styles.avatarOverlay}>
                  <Camera size={18} color="#FFF" />
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#FFF', marginLeft: '4px' }}>Alterar</span>
                </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <div style={styles.userInfo}>
                <h1 style={styles.userName}>{profile?.full_name || 'Usuário LogDock'}</h1>
                <span style={styles.userRole}>Administrador da conta</span>
            </div>
        </div>
        <div style={styles.badgeGroup}>
            <div style={styles.activeBadge}>
                <ShieldCheck size={14} /> Conta Protegida
            </div>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.mainCol}>
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Plano e Armazenamento</h2>
                <div style={styles.planCard}>
                    <div style={styles.planInfo}>
                        <div style={styles.iconBox}><Box size={20} color="#0061FF" /></div>
                        <div style={{ flex: 1 }}>
                            <div style={styles.planName}>LogDock Professional <span style={styles.planTag}>Ativo</span></div>
                            <div style={styles.planDesc}>Você está no plano mais avançado para empresas.</div>
                        </div>
                        <button style={styles.actionBtn}>Mudar plano</button>
                    </div>
                    
                    <div style={styles.storageStats}>
                        <div style={styles.statsHeader}>
                            <span style={styles.statsTitle}>Uso de armazenamento</span>
                            <span style={styles.statsLabel}>{storage.used} GB / {storage.total} GB</span>
                        </div>
                        <div style={styles.progressContainer}>
                            <div style={{...styles.progressFill, width: `${storage.percent}%`}} />
                        </div>
                        <div style={styles.statsLegend}>
                            <div style={styles.legendItem}><div style={{...styles.dot, backgroundColor: '#0061FF'}} /> Documentos</div>
                            <div style={styles.legendItem}><div style={{...styles.dot, backgroundColor: '#8B5CF6'}} /> Mídia</div>
                            <div style={styles.legendItem}><div style={{...styles.dot, backgroundColor: '#E2E8F0'}} /> Livre</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Dados da Empresa</h2>
                <div style={styles.card}>
                    <div style={styles.dataRow}>
                        <div style={styles.dataIcon}><Building2 size={18} /></div>
                        <div style={styles.dataContent}>
                            <label style={styles.dataLabel}>Nome da Organização</label>
                            <span style={styles.dataValue}>{profile?.company_name || 'Minha Empresa Ltda'}</span>
                        </div>
                        <button style={styles.editBtn}>Editar</button>
                    </div>
                    <div style={styles.dataRow}>
                        <div style={styles.dataIcon}><Mail size={18} /></div>
                        <div style={styles.dataContent}>
                            <label style={styles.dataLabel}>E-mail de Cobrança</label>
                            <span style={styles.dataValue}>{profile?.email}</span>
                        </div>
                        <button style={styles.editBtn}>Editar</button>
                    </div>
                </div>
            </div>
        </div>

        <div style={styles.sideCol}>
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Segurança</h2>
                <div style={styles.card}>
                    <div style={styles.securityItem}>
                        <Shield size={18} color="#10B981" />
                        <div style={{ flex: 1 }}>
                            <div style={styles.securityTitle}>Autenticação de 2 fatores</div>
                            <div style={styles.securityStatus}>Habilitado</div>
                        </div>
                        <ChevronRight size={16} color="#94A3B8" />
                    </div>
                    <div style={styles.securityItem}>
                        <Lock size={18} color="#0061FF" />
                        <div style={{ flex: 1 }}>
                            <div style={styles.securityTitle}>Senha da conta</div>
                            <div style={styles.securityStatus}>Alterada há 3 meses</div>
                        </div>
                        <ChevronRight size={16} color="#94A3B8" />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '32px' },
  avatarSection: { display: 'flex', alignItems: 'center', gap: '24px' },
  avatar: { width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#0061FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '900', color: '#FFF', boxShadow: '0 10px 25px rgba(0,97,255,0.3)', cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' },
  userInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  userName: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  userRole: { fontSize: '14px', fontWeight: '600', color: '#94A3B8' },
  badgeGroup: { display: 'flex', gap: '12px' },
  activeBadge: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#ECFDF5', color: '#059669', borderRadius: '12px', fontSize: '13px', fontWeight: '700' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '40px' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '40px' },
  section: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '800', color: '#1E1E1E', textTransform: 'uppercase', letterSpacing: '0.5px' },
  card: { backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', overflow: 'hidden' },
  planCard: { backgroundColor: '#FFF', borderRadius: '24px', border: '1px solid #F1F5F9', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' },
  planInfo: { display: 'flex', alignItems: 'center', gap: '20px' },
  iconBox: { width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#F0F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: '18px', fontWeight: '800', color: '#1E1E1E', display: 'flex', alignItems: 'center', gap: '12px' },
  planTag: { padding: '4px 10px', backgroundColor: '#0061FF', color: '#FFF', fontSize: '11px', fontWeight: '800', borderRadius: '6px' },
  planDesc: { fontSize: '14px', color: '#64748B', marginTop: '4px', fontWeight: '500' },
  actionBtn: { padding: '10px 20px', borderRadius: '12px', border: '1px solid #EAEAEA', backgroundColor: '#FFF', color: '#1E1E1E', fontSize: '13px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' },
  storageStats: { display: 'flex', flexDirection: 'column', gap: '16px' },
  statsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  statsTitle: { fontSize: '14px', fontWeight: '700', color: '#1E1E1E' },
  statsLabel: { fontSize: '13px', fontWeight: '600', color: '#64748B' },
  progressContainer: { height: '12px', backgroundColor: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#0061FF', borderRadius: '10px' },
  statsLegend: { display: 'flex', gap: '24px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#64748B' },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  dataRow: { padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '20px' },
  dataIcon: { color: '#94A3B8' },
  dataContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  dataLabel: { fontSize: '12px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  dataValue: { fontSize: '15px', fontWeight: '600', color: '#1E1E1E' },
  editBtn: { background: 'none', border: 'none', color: '#0061FF', fontSize: '13px', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' },
  securityItem: { padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'all 0.2s' },
  securityTitle: { fontSize: '14px', fontWeight: '700', color: '#1E1E1E' },
  securityStatus: { fontSize: '12px', fontWeight: '600', color: '#10B981' }
};

export default ProfilePage;
