import React from 'react';
import { ArrowLeft, User, Mail, Shield, Clock, Key, Lock, Pencil, Trash2, Activity } from 'lucide-react';
import { toastSuccess } from '@core/lib/toast';

interface LogtaUserDetailProps {
  userId: string;
  onBack: () => void;
}

const LogtaUserDetail: React.FC<LogtaUserDetailProps> = ({ userId, onBack }) => {
  // Mock data for demo
  const user = {
    id: userId,
    name: userId === '1' ? 'Alison Thiago' : 'Marcos Oliveira',
    email: userId === '1' ? 'alison@logta.io' : 'marcos@falcao.com',
    role: userId === '1' ? 'Master Admin' : 'Gerente Operacional',
    type: userId === '1' ? 'Superuser' : 'Staff',
    lastLogin: 'Agora mesmo',
    status: 'active',
    avatar: userId === '1' ? 'AT' : 'MO'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={onBack} 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '12px', 
              border: '1px solid #E2E8F0', 
              background: 'white', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#64748B' 
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '16px', 
            backgroundColor: '#F8FAFC', 
            color: '#0F172A', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: '900',
            border: '1px solid #E2E8F0'
          }}>
            {user.avatar}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0F172A' }}>{user.name}</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>{user.email} • {user.type}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            title="Resetar Senha do Usuário"
            onClick={() => toastSuccess('Link de redefinição enviado!')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Key size={18} />
          </button>
          <button 
            title="Bloquear Conta do Usuário"
            onClick={() => toastSuccess('Status alterado com sucesso')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Lock size={18} />
          </button>
          <button 
            title="Editar Dados do Cadastro"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Pencil size={18} />
          </button>
          <button 
            title="Excluir Conta Permanentemente"
            onClick={() => toastSuccess('Usuário removido')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '32px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>Informações do Perfil</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Cargo / Permissão</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Shield size={16} color="#0061FF" />
                  <span style={{ fontWeight: 700, color: '#1E293B' }}>{user.role}</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Status da Conta</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0061FF' }}></span>
                  <span style={{ fontWeight: 700, color: '#1E293B' }}>Ativo</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Último Acesso</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={16} color="#64748B" />
                  <span style={{ fontWeight: 700, color: '#1E293B' }}>{user.lastLogin}</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>ID de Autenticação</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: 'monospace', color: '#64748B', fontSize: '12px' }}>usr_logta_{user.id}x99</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: '24px', padding: '24px', border: '1px solid #E2E8F0' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Atividade Recente</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { event: 'Acesso ao Sistema', time: 'Há 2 min', icon: User },
                { event: 'Alteração de Rota', time: 'Hoje, 09:12', icon: Activity },
                { event: 'Relatório Exportado', time: 'Ontem, 14:30', icon: FileText }
              ].map((act, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <act.icon size={14} color="#94A3B8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{act.event}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{act.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FileText = ({ size, color }: any) => <Activity size={size} color={color} />;

export default LogtaUserDetail;
