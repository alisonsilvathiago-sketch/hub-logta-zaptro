import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const MasterConnect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { impersonate } = useAuth();

  useEffect(() => {
    const tenantId = searchParams.get('tenant');
    const isDev = searchParams.get('dev') === 'true';

    if (tenantId) {

      
      // Ativa a impersonação no context/localStorage
      localStorage.setItem('hub-impersonate-tenant', tenantId);

      // Se for ambiente de dev, emulamos a sessão do master no Zaptro também
      if (isDev) {
        localStorage.setItem('hub-dev-session', JSON.stringify({
          email: 'admin@zaptro.com.br',
          full_name: 'Master Admin (Bypass)',
          role: 'MASTER'
        }));
      }

      // Redireciona para o dashboard do Zaptro
      const timer = setTimeout(() => {
        window.location.href = '/inicio';
      }, 500);

      return () => clearTimeout(timer);
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, impersonate]);

  return <Loading message="Conectando ao ambiente Zaptro via Hub..." />;
};

export default MasterConnect;
