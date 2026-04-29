import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { isMasterRole } from '../utils/logtaRbac';

// Tela elegante de bloqueio
function BlockScreen({ title, message }: { title: string, message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '440px', border: '1px solid #E2E8F0' }}>
        <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>
          🔒
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A2340', marginBottom: '12px' }}>{title}</h2>
        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, marginBottom: '32px' }}>{message}</p>
        <a href="https://hub.logta.com.br" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px', background: '#1A2340', color: '#fff', textDecoration: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px', transition: 'background 0.2s' }}>
          Acessar o Hub Central
        </a>
      </div>
    </div>
  );
}

// O Guardião do Logta
export default function HubGuard({ children, companyId }: { children: React.ReactNode, companyId: string }) {
  const { profile } = useAuth();
  const [status, setStatus] = useState<'loading' | 'allowed' | 'blocked' | 'maintenance'>('loading');
  const [reason, setReason] = useState('');

  useEffect(() => {
    async function validateWithHub() {
      if (!companyId) return;

      // BYPASS: Se for MASTER, o Hub libera tudo automaticamente
      if (isMasterRole(profile?.role)) {
        setStatus('allowed');
        return;
      }

      try {
        // 1. Pegar a API KEY do Hub salva na empresa atual no Logta
        const { data: company } = await supabase
          .from('companies')
          .select('hub_api_key')
          .eq('id', companyId)
          .single();

        const token = company?.hub_api_key;
        
        if (!token) {
          setStatus('blocked');
          setReason('Sua empresa não possui uma chave de integração ativa com o Hub.');
          return;
        }

        // 2. Chamar o Cérebro (Hub Master)
        const res = await fetch('https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/validate-access', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ product: 'logta' }) 
        });
        
        const data = await res.json();

        // 3. Verifica as respostas do Hub
        if (data.maintenance) {
          setStatus('maintenance');
          return;
        }

        if (data.valid) {
          setStatus('allowed'); 
        } else {
          setStatus('blocked');
          if (data.reason === 'company_blocked') setReason('O acesso da sua empresa foi suspenso no Logta Hub.');
          else if (data.reason === 'no_active_products') setReason('Assinatura expirada ou não encontrada.');
          else if (data.reason === 'product_not_enabled') setReason('Seu plano atual não permite acesso ao Logta ERP.');
          else setReason('Erro de validação com o Hub central.');
        }

      } catch (err) {
        setStatus('blocked');
        setReason('Erro na conexão de segurança com a HUB.');
      }
    }

    validateWithHub();
  }, [companyId, profile?.role]);

  if (status === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#1A2340', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === 'maintenance') return <BlockScreen title="Manutenção Logta" message="Estamos atualizando o Logta para você. Voltamos em alguns minutos!" />;
  
  if (status === 'blocked') return <BlockScreen title="Acesso Negado" message={reason} />;

  return <>{children}</>;
}
