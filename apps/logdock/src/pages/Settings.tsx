import React, { useState } from 'react';
import { 
  User, Shield, Bell, Grid, Award, 
  Users, Lock, Share2, ChevronRight, 
  ExternalLink, Laptop, AlertTriangle, 
  Camera, Trash2, Check, Globe,
  Mail, Key, Smartphone, Eye, LogOut, FileText
} from 'lucide-react';
import { useAuth } from '@shared/context/AuthContext';
import Button from '@shared/components/Button';
import { toast } from 'react-hot-toast';
import { supabase } from '@shared/lib/supabase';

const SettingsPage: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('geral');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState({
    storage: true,
    bulkDelete: true,
    newDevice: true,
    marketing: false
  });

  // Brand state
  const [brandName, setBrandName] = useState('');
  const [brandSite, setBrandSite] = useState('');

  const handleToggleNotification = (key: keyof typeof notifications) => {
    const newSettings = { ...notifications, [key]: !notifications[key] };
    setNotifications(newSettings);
    toast.success('Preferência de notificação atualizada!');
  };

  const handleSaveBrand = async () => {
    setLoading(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success('Identidade visual salva com sucesso!');
    setLoading(false);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText('https://logdock.com/referrals/alison-thiago-2024');
    toast.success('Link de indicação copiado!');
  };

  const handleSendInvite = () => {
    toast.success('Convite enviado para o e-mail informado!');
  };

  const handleGenerateReport = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Gerando relatório de dados...',
        success: 'Relatório enviado para seu e-mail!',
        error: 'Erro ao gerar relatório.',
      }
    );
  };

  const handleSaveName = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', profile?.id);

      if (error) throw error;
      toast.success('Nome atualizado com sucesso!');
      setIsEditingName(false);
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile?.email || '');
      if (error) throw error;
      toast.success('Link de redefinição enviado para seu e-mail!');
    } catch (error: any) {
      toast.error('Erro ao enviar link: ' + error.message);
    }
  };

  const tabs = [
    { id: 'geral', label: 'Geral', icon: User },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'aplicativos', label: 'Aplicativos', icon: Grid },
    { id: 'marca', label: 'Fortalecimento da marca', icon: Award },
    { id: 'amigo', label: 'Indicar um amigo', icon: Users },
    { id: 'privacidade', label: 'Privacidade', icon: Lock },
    { id: 'compartilhamento', label: 'Compartilhamento', icon: Share2 },
  ];

  const renderGeral = () => (
    <div style={styles.settingsSection}>
      <div style={styles.planCards}>
        <div style={styles.planCard}>
          <div style={styles.planHeader}>LogDock Básico</div>
          <ul style={styles.planFeatures}>
            <li><Check size={14} color="#0061FF" /> 2 GB de armazenamento</li>
            <li><Check size={14} color="#0061FF" /> Todos os arquivos localmente</li>
            <li><Check size={14} color="#0061FF" /> Sincronização em 3 dispositivos</li>
          </ul>
          <button style={{ ...styles.currentPlanBtn, backgroundColor: '#F2F2F2', color: '#000' }}>Plano atual</button>
        </div>
        <div style={{ ...styles.planCard, border: '1px solid #0061FF33' }}>
          <div style={styles.planHeader}>LogDock Plus</div>
          <ul style={styles.planFeatures}>
            <li><Check size={14} color="#0061FF" /> 2 TB (2.000 GB) de espaço</li>
            <li><Check size={14} color="#0061FF" /> Acesso em todos os dispositivos</li>
            <li><Check size={14} color="#0061FF" /> Histórico de versões de 30 dias</li>
          </ul>
          <button style={{ ...styles.upgradePlanBtn, backgroundColor: '#000', color: '#FFF' }}>Avaliação grátis - 30 dias</button>
        </div>
      </div>

      <div style={styles.contentBlock}>
        <h3 style={styles.blockTitle}>Informações básicas</h3>
        <div style={styles.infoRow}>
          <div style={styles.infoLabel}>Foto</div>
          <div style={styles.infoValue}>
            <div style={styles.userBadgeLarge}>{profile?.full_name?.[0]}</div>
            <div style={styles.actionLinks}>
              <button style={styles.actionLink}>Editar</button>
              <button style={styles.actionLink}>Excluir</button>
            </div>
          </div>
        </div>
        <div style={styles.infoRow}>
          <div style={styles.infoLabel}>Nome</div>
          <div style={styles.infoValue}>
            {isEditingName ? (
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ ...styles.brandInput, flex: 1, height: '32px', padding: '0 10px' }}
                />
                <button style={styles.actionLink} onClick={handleSaveName} disabled={loading}>
                  {loading ? '...' : 'Salvar'}
                </button>
                <button style={styles.actionLink} onClick={() => setIsEditingName(false)}>Cancelar</button>
              </div>
            ) : (
              <>
                <span>{profile?.full_name}</span>
                <button style={styles.actionLink} onClick={() => setIsEditingName(true)}>Editar</button>
              </>
            )}
          </div>
        </div>
        <div style={styles.infoRow}>
          <div style={styles.infoLabel}>E-mail pessoal</div>
          <div style={styles.infoValue}>
            <span>{profile?.email}</span>
            <button style={styles.actionLink}>Editar</button>
          </div>
        </div>
      </div>

      <div style={styles.contentBlock}>
        <h3 style={styles.blockTitle}>Preferências</h3>
        <div style={styles.infoRow}>
          <div style={styles.infoLabel}>Idioma</div>
          <div style={styles.infoValue}>
            <span>Português (Brasil)</span>
            <button style={styles.actionLink}>Editar</button>
          </div>
        </div>
        <div style={styles.infoRow}>
          <div style={styles.infoLabel}>Fuso horário automático</div>
          <div style={styles.infoValue}>
            <span>GMT-03:00 Ativado</span>
            <div style={styles.toggleWrapper}><div style={styles.toggleActive} /></div>
          </div>
        </div>
      </div>

      <div style={styles.dangerZone}>
        <h3 style={styles.blockTitle}>Excluir conta</h3>
        <div style={styles.infoRow}>
          <div style={styles.infoLabel}>Excluir meu LogDock</div>
          <div style={styles.infoValue}>
            <button style={styles.deleteAccountBtn}>Excluir conta</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSeguranca = () => (
    <div style={styles.settingsSection}>
      <div style={styles.contentBlock}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={styles.blockTitle}>Autenticação de dois fatores</h3>
          <span style={styles.badgeSuccess}>Ativado</span>
        </div>
        <div style={styles.infoRow}>
          <div style={styles.infoLabel}>Método de preferência</div>
          <div style={styles.infoValue}>
            <span>SMS (+55 11 95091-2622)</span>
            <button style={styles.actionLink}>Editar</button>
          </div>
        </div>
      </div>

      <div style={styles.contentBlock}>
        <h3 style={styles.blockTitle}>Senha</h3>
        <div style={styles.infoRow}>
          <div style={styles.infoLabel}>Alterar senha</div>
          <div style={styles.infoValue}>
            <button style={styles.actionLink} onClick={handleResetPassword}>Enviar e-mail de redefinição</button>
          </div>
        </div>
      </div>

      <div style={styles.contentBlock}>
        <h3 style={styles.blockTitle}>Navegadores web</h3>
        <div style={styles.browserTable}>
          <div style={styles.browserRow}>
            <div style={styles.browserInfo}>
              <Globe size={18} color="#64748B" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>Chrome no Mac OS X</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Barueri, São Paulo, Brasil</div>
              </div>
            </div>
            <div style={styles.browserStatus}>Sessão atual</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificacoes = () => (
    <div style={styles.settingsSection}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div>
          <h3 style={styles.blockTitle}>Alertas</h3>
          <div style={styles.checkList}>
            <div style={styles.checkItem} onClick={() => handleToggleNotification('storage')}>
              <div style={{ ...styles.checkSquare, backgroundColor: notifications.storage ? '#0061FF' : '#E2E8F0' }}>
                {notifications.storage && <Check size={12} color="white" />}
              </div> 
              Estou ficando sem espaço
            </div>
            <div style={styles.checkItem} onClick={() => handleToggleNotification('bulkDelete')}>
              <div style={{ ...styles.checkSquare, backgroundColor: notifications.bulkDelete ? '#0061FF' : '#E2E8F0' }}>
                {notifications.bulkDelete && <Check size={12} color="white" />}
              </div> 
              Eu excluir um grande número de arquivos
            </div>
            <div style={styles.checkItem} onClick={() => handleToggleNotification('newDevice')}>
              <div style={{ ...styles.checkSquare, backgroundColor: notifications.newDevice ? '#0061FF' : '#E2E8F0' }}>
                {notifications.newDevice && <Check size={12} color="white" />}
              </div> 
              Um novo dispositivo for conectado
            </div>
          </div>
        </div>
        <div>
          <h3 style={styles.blockTitle}>Arquivos</h3>
          <div style={styles.checkList}>
            <div style={styles.checkItem}><div style={styles.checkSquare}><Check size={12} color="white" /></div> Atividade em pastas compartilhadas</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAmigo = () => (
    <div style={styles.settingsSection}>
      <div style={styles.referralBanner}>
        <div style={styles.referralText}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px' }}>Indique e ganhe até 16 GB grátis</h2>
          <div style={{ marginBottom: '20px' }}>
            <div style={styles.smallLabel}>Compartilhe seu link de indicação</div>
            <div style={styles.copyInputGroup}>
              <input readOnly value="https://logdock.com/referrals/alison..." style={styles.copyInput} />
              <button style={styles.copyBtn} onClick={handleCopyReferral}>copiar link</button>
            </div>
          </div>
          <div>
            <div style={styles.smallLabel}>Envie um convite por e-mail</div>
            <div style={styles.inviteInputGroup}>
              <input placeholder="E-mail" style={styles.inviteInput} />
              <button style={styles.sendInviteBtn} onClick={handleSendInvite}>Enviar convite</button>
            </div>
          </div>
        </div>
        <div style={styles.referralIllustration}>
          <div style={styles.chestIcon}>💰</div>
        </div>
      </div>

      <div style={styles.referralSteps}>
        <div style={styles.stepItem}>
          <Share2 size={24} color="#F2F2F2" />
          <h4 style={styles.stepTitle}>Compartilhe seu link de indicação</h4>
          <p style={styles.stepDesc}>Convide amigos ou colegas de equipe com seu link de indicação pessoal.</p>
        </div>
        <div style={styles.stepItem}>
          <Laptop size={24} color="#F2F2F2" />
          <h4 style={styles.stepTitle}>A pessoa assina o LogDock</h4>
          <p style={styles.stepDesc}>Eles criam uma conta do LogDock e instalam o aplicativo para desktop ou dispositivos móveis.</p>
        </div>
        <div style={styles.stepItem}>
          <Award size={24} color="#F2F2F2" />
          <h4 style={styles.stepTitle}>Você e sua indicação ganham uma recompensa</h4>
          <p style={styles.stepDesc}>Assim que o aplicativo for instalado, cada um de vocês ganhará 500 MB.</p>
        </div>
      </div>

      <div style={styles.contentBlock}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={styles.blockTitle}>Suas indicações</h3>
          <span style={{ fontSize: '13px', color: '#94A3B8' }}>0 byte de 16 GB de espaço grátis ganho</span>
        </div>
        <div style={styles.simpleTable}>
          <div style={styles.tableHeader}>
            <span>Destinatário</span>
            <span>Status</span>
            <span>Atualizado</span>
          </div>
          <div style={styles.tableEmpty}>Você ainda não indicou ninguém</div>
        </div>
      </div>
    </div>
  );

  const renderPrivacidade = () => (
    <div style={styles.settingsSection}>
      <div style={styles.contentBlock}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={styles.blockTitle}>Cookies</h3>
            <p style={styles.stepDesc}>Gerencie suas preferências de cookies e suas configurações de "Não vender nem compartilhar".</p>
          </div>
          <button style={styles.actionLink}>Editar</button>
        </div>
      </div>

      <div style={styles.contentBlock}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={styles.blockTitle}>Acesse seus dados</h3>
            <p style={styles.stepDesc}>Obtenha uma cópia dos dos dados pessoais que o LogDock mantém sobre você.</p>
          </div>
          <button style={styles.actionLink} onClick={handleGenerateReport}>Gerar relatório</button>
        </div>
        <div style={styles.historyTable}>
          <div style={styles.tableHeader}>
            <span>Data da solicitação</span>
            <span>Relatório para download</span>
          </div>
          <div style={styles.tableRow}>
            <span>-</span>
            <span>-</span>
          </div>
        </div>
      </div>

      <div style={styles.contentBlock}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={styles.blockTitle}>Exclua seus dados</h3>
            <p style={styles.stepDesc}>Excluir dados não relacionados à conta (por exemplo, dados de vendas e marketing).</p>
          </div>
          <button style={styles.actionLink}>Excluir dados</button>
        </div>
      </div>
    </div>
  );

  const renderAplicativos = () => (
    <div style={styles.settingsSection}>
      <div style={styles.contentBlock}>
        <h3 style={styles.blockTitle}>Iniciar a partir do LogDock</h3>
        <p style={styles.stepDesc}>Abra, compartilhe seu conteúdo e colabore através desses aplicativos que você pode executar enquanto usa o LogDock.</p>
        <div style={styles.appEmptyState}>
          Os aplicativos que você conectar serão listados aqui. Para começar, acesse o <span style={{ color: '#0061FF', cursor: 'pointer' }}>App Center</span>.
        </div>
      </div>

      <div style={styles.contentBlock}>
        <h3 style={styles.blockTitle}>Ver conteúdo do LogDock</h3>
        <p style={styles.stepDesc}>Acesse e faça alterações no conteúdo do seu LogDock ao usar estes aplicativos fora do LogDock.</p>
        <div style={styles.appRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.appIconSmall}><Grid size={20} color="#0061FF" /></div>
            <div style={{ fontWeight: '700' }}>LogDock</div>
          </div>
          <ChevronRight size={18} color="#94A3B8" />
        </div>
      </div>

      <div style={styles.contentBlock}>
        <h3 style={styles.blockTitle}>Aplicativos de edição padrão</h3>
        <p style={styles.stepDesc}>Você pode escolher como abrir cada tipo de arquivo no LogDock.</p>
        <div style={styles.appTable}>
          <div style={styles.tableHeader}>
            <span style={{ width: '60%' }}>Tipo de arquivo</span>
            <span style={{ width: '20%' }}>Extensões</span>
            <span style={{ width: '20%' }}>Abrir com</span>
          </div>
          <div style={styles.tableRow}>
            <div style={{ width: '60%', display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={16} color="#4285F4" /> Documento do Word</div>
            <span style={{ width: '20%' }}>.docx, .doc</span>
            <div style={styles.selectBox}>visualizar no logdock.com <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} /></div>
          </div>
          <div style={styles.tableRow}>
            <div style={{ width: '60%', display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={16} color="#34A853" /> Pasta de trabalho do Excel</div>
            <span style={{ width: '20%' }}>.xlsx, .xls</span>
            <div style={styles.selectBox}>visualizar no logdock.com <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} /></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMarca = () => (
    <div style={styles.settingsSection}>
      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF' }}>Central de identidade visual</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={styles.brandCard}>
            <h4 style={styles.brandCardTitle}>Mostre sua marca ao compartilhar</h4>
            <p style={styles.brandCardDesc}>Dê um toque profissional aos arquivos compartilhados com elementos personalizados como logotipo e nome da marca.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={styles.brandActionBtn}>Avaliação grátis</button>
              <button style={styles.brandSecondaryBtn}>Quero saber mais</button>
            </div>
          </div>

          <div style={styles.brandInputBlock}>
            <h4 style={styles.brandInputTitle}>Adicione o nome e o site da sua marca</h4>
            <input 
              placeholder="Nome da marca" 
              style={styles.brandInput} 
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
            <input 
              placeholder="Site (ex: www.suaempresa.com.br)" 
              style={{ ...styles.brandInput, marginTop: '12px' }} 
              value={brandSite}
              onChange={(e) => setBrandSite(e.target.value)}
            />
          </div>

          <div style={styles.brandInputBlock}>
            <h4 style={styles.brandInputTitle}>Adicione seu logo e plano de fundo</h4>
            <div style={styles.uploadBox}>
              <Camera size={24} color="#0061FF" />
              <span style={{ fontSize: '12px', color: '#1E293B', marginTop: '8px', fontWeight: '600' }}>Adicionar logotipo</span>
              <button style={styles.uploadBtnSmall} onClick={() => document.getElementById('logo-upload')?.click()}>Enviar um logo</button>
              <input type="file" id="logo-upload" hidden />
            </div>
            <div style={{ ...styles.uploadBox, marginTop: '12px' }}>
              <ImageIcon size={24} color="#0061FF" />
              <span style={{ fontSize: '12px', color: '#1E293B', marginTop: '8px', fontWeight: '600' }}>Adicione um plano de fundo</span>
              <button style={styles.uploadBtnSmall} onClick={() => document.getElementById('bg-upload')?.click()}>Escolher plano de fundo</button>
              <input type="file" id="bg-upload" hidden />
            </div>
          </div>

          <button style={styles.saveBrandBtn} onClick={handleSaveBrand} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>

        <div style={styles.brandPreview}>
          <div style={styles.previewTabs}>
            <span style={styles.previewTabActive}>Arquivo compartilhado</span>
            <span>Pasta compartilhada</span>
            <span>E-mail</span>
          </div>
          <div style={styles.previewContent}>
            <div style={styles.previewIllustration}>
               <div style={{ opacity: 0.5 }}>Visualização da Interface</div>
               <div style={styles.previewArt}>🎨</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompartilhamento = () => (
    <div style={styles.settingsSection}>
      <div style={styles.contentBlock}>
        <h3 style={styles.blockTitle}>Compartilhamento de arquivos</h3>
        <p style={styles.stepDesc}>Gerencie como os outros podem compartilhar seus arquivos e pastas.</p>
        <div style={styles.infoRow}>
          <div style={styles.infoLabel}>Links compartilhados</div>
          <div style={styles.infoValue}>
            <span>Apenas pessoas convidadas</span>
            <button style={styles.actionLink}>Alterar</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Conta pessoal</h1>
        <div style={styles.tabContainer}>
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {activeTab === tab.id && <div style={styles.tabIndicator} />}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.content}>
        {activeTab === 'geral' && renderGeral()}
        {activeTab === 'seguranca' && renderSeguranca()}
        {activeTab === 'notificacoes' && renderNotificacoes()}
        {activeTab === 'amigo' && renderAmigo()}
        {activeTab === 'privacidade' && renderPrivacidade()}
        {activeTab === 'aplicativos' && renderAplicativos()}
        {activeTab === 'marca' && renderMarca()}
        {activeTab === 'compartilhamento' && renderCompartilhamento()}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '40px 60px',
    maxWidth: '1200px',
    margin: '0',
    color: '#000000',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '40px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '24px',
    color: '#000000',
  },
  tabContainer: {
    display: 'flex',
    gap: '24px',
    borderBottom: '1px solid #E2E8F0',
  },
  tab: {
    background: 'none',
    border: 'none',
    color: '#475569',
    padding: '12px 0',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    position: 'relative',
    transition: 'color 0.2s',
  },
  tabActive: {
    color: '#000000',
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: '-1px',
    left: '0',
    right: '0',
    height: '2px',
    backgroundColor: '#000000',
  },
  content: {
    marginTop: '32px',
  },
  settingsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '40px',
  },
  planCards: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
  planHeader: {
    fontSize: '16px',
    fontWeight: '800',
    marginBottom: '20px',
    color: '#334155',
  },
  planFeatures: {
    listStyle: 'none',
    padding: '0',
    margin: '0 0 24px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    color: '#334155',
  },
  currentPlanBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#E2E8F0',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
  },
  upgradePlanBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#0061FF',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  contentBlock: {
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: '32px',
  },
  blockTitle: {
    fontSize: '15px',
    fontWeight: '800',
    marginBottom: '24px',
    color: '#000000',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
  },
  infoLabel: {
    fontSize: '13px',
    color: '#334155',
    width: '200px',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '700',
    color: '#000000',
  },
  userBadgeLarge: {
    width: '40px',
    height: '40px',
    backgroundColor: '#0061FF',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '800',
    color: 'white',
  },
  actionLinks: {
    display: 'flex',
    gap: '16px',
  },
  actionLink: {
    background: 'none',
    border: 'none',
    color: '#0061FF',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    textDecoration: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#0061FF11',
  },
  toggleWrapper: {
    width: '40px',
    height: '20px',
    backgroundColor: '#0061FF',
    borderRadius: '10px',
    padding: '2px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  toggleActive: {
    width: '16px',
    height: '16px',
    backgroundColor: 'white',
    borderRadius: '50%',
  },
  deleteAccountBtn: {
    background: 'none',
    border: 'none',
    color: '#EF4444',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
    color: '#0061FF46',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '800',
  },
  browserTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
  browserRow: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  browserInfo: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  browserStatus: {
    fontSize: '12px',
    color: '#64748B',
  },
  checkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  checkItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    fontSize: '13px',
    color: '#475569',
  },
  checkSquare: {
    width: '18px',
    height: '18px',
    backgroundColor: '#0061FF',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTab: {
    padding: '40px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #E2E8F0',
    color: '#475569',
  },
  referralBanner: {
    backgroundColor: '#3F4E0F',
    borderRadius: '12px',
    padding: '40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
    overflow: 'hidden',
    position: 'relative',
  },
  referralText: {
    flex: 1,
    zIndex: 2,
  },
  referralIllustration: {
    width: '200px',
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '80px',
  },
  smallLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  copyInputGroup: {
    display: 'flex',
    maxWidth: '350px',
    backgroundColor: '#00000033',
    borderRadius: '8px',
    border: '1px solid #FFFFFF33',
    overflow: 'hidden',
  },
  copyInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'white',
    padding: '10px 12px',
    fontSize: '13px',
  },
  copyBtn: {
    backgroundColor: 'white',
    color: 'black',
    border: 'none',
    padding: '0 16px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  inviteInputGroup: {
    display: 'flex',
    maxWidth: '350px',
    backgroundColor: '#00000033',
    borderRadius: '8px',
    border: '1px solid #FFFFFF33',
    overflow: 'hidden',
  },
  inviteInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'white',
    padding: '10px 12px',
    fontSize: '13px',
  },
  sendInviteBtn: {
    backgroundColor: '#FFFFFF33',
    color: 'white',
    border: 'none',
    padding: '0 16px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  referralSteps: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '32px',
    marginTop: '40px',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  stepTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#000000',
  },
  stepDesc: {
    fontSize: '13px',
    color: '#000000',
    lineHeight: '1.6',
    fontWeight: '500',
  },
  simpleTable: {
    marginTop: '16px',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #E2E8F0',
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748B',
  },
  tableEmpty: {
    padding: '40px 0',
    textAlign: 'center',
    fontSize: '13px',
    color: '#94A3B8',
  },
  historyTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    marginTop: '20px',
  },
  tableRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px',
    fontSize: '13px',
    color: '#1E293B',
    borderBottom: '1px solid #E2E8F0',
  },
  appEmptyState: {
    padding: '32px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#64748B',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px dashed #F2F2F2',
    marginTop: '16px',
  },
  appRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    cursor: 'pointer',
    color: '#1E293B',
  },
  appIconSmall: {
    width: '36px',
    height: '36px',
    backgroundColor: '#0061FF11',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  selectBox: {
    padding: '6px 12px',
    backgroundColor: '#E2E8F0',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#1E293B',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  brandCard: {
    backgroundColor: '#FFFFFF',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
  brandCardTitle: {
    fontSize: '14px',
    fontWeight: '800',
    marginBottom: '12px',
    color: '#334155',
  },
  brandCardDesc: {
    fontSize: '12px',
    color: '#1E293B',
    marginBottom: '20px',
    lineHeight: '1.5',
    fontWeight: '500',
  },
  brandActionBtn: {
    padding: '8px 16px',
    backgroundColor: 'white',
    color: 'black',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  brandSecondaryBtn: {
    padding: '8px 16px',
    backgroundColor: '#00000033',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  brandInputBlock: {
    padding: '20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
  brandInputTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: '16px',
  },
  brandInput: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'white',
    border: '1px solid #F2F2F2',
    borderRadius: '6px',
    color: '#334155',
    fontSize: '13px',
  },
  uploadBox: {
    padding: '30px',
    backgroundColor: 'white',
    border: '1px dashed #F2F2F2',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnSmall: {
    marginTop: '12px',
    padding: '6px 12px',
    backgroundColor: '#F1F5F9',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  saveBrandBtn: {
    padding: '12px',
    backgroundColor: '#334155',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '12px',
  },
  brandPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    height: 'fit-content',
  },
  previewTabs: {
    display: 'flex',
    gap: '20px',
    padding: '16px 24px',
    backgroundColor: 'white',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    borderBottom: '1px solid #E2E8F0',
  },
  previewTabActive: {
    color: '#0061FF',
    paddingBottom: '4px',
    borderBottom: '2px solid #0061FF',
  },
  previewContent: {
    padding: '40px',
    display: 'flex',
    justifyContent: 'center',
  },
  previewIllustration: {
    width: '100%',
    height: '240px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#94A3B8',
    gap: '12px',
  },
  previewArt: {
    fontSize: '48px',
  }
};

export default SettingsPage;
