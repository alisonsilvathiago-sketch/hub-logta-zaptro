import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

const MasterConnect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const tenantId = searchParams.get('tenant');
    const isDev = searchParams.get('dev') === 'true';
    
    if (tenantId) {

      localStorage.setItem('hub-impersonate-tenant', tenantId);
      
      // Se for ambiente de dev, emulamos a sessão do master no Logta também
      if (isDev) {
        localStorage.setItem('hub-dev-session', JSON.stringify({
          email: 'admin@logta.app',
          full_name: 'Master Admin (Bypass)',
          role: 'MASTER'
        }));
      }

      // Pequeno delay para garantir que o storage seja gravado
      const timer = setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return <Loading message="Sincronizando com o Master Hub..." />;
};

export default MasterConnect;
