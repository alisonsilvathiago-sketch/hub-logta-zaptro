import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { Mail, Lock, ArrowRight, Zap, Eye, EyeOff } from 'lucide-react';
import logtaContainerImage from '../assets/logta-login-photo.png';

const Login = () => {
  const navigate = useNavigate();
  const { config, updateConfig } = useTenant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailBlur = () => {
    if (email.includes('@transportessilva.com')) {
      updateConfig({
        companyName: 'Transportes Silva',
        primaryColor: '#F97316',
      });
    } else if (email.includes('@logta.com')) {
      updateConfig({
        companyName: 'LOGTA',
        primaryColor: '#2563EB',
      });
    } else if (email.includes('@varejoglobal.com')) {
      updateConfig({
        companyName: 'Varejo Global',
        primaryColor: '#10B981',
      });
    } else if (email.includes('@zaptro.com')) {
      updateConfig({
        companyName: 'Zaptro Hub',
        primaryColor: '#8B5CF6',
      });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex w-full bg-white selection:bg-primary/30 font-sans">
      
      {/* Left Column: Visual / Premium Gradient Card */}
      <div className="hidden lg:flex lg:w-[1392px] lg:h-[100px] py-8 relative items-stretch bg-gradient-to-br from-black to-gray-900">
        <div className="flex-1 lg:w-[922px] lg:h-[1000px] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-[32px] p-16 flex flex-col justify-between relative overflow-hidden shadow-2xl">
          {/* Abstract background glows */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: 'var(--color-black)' }}
          >
            <img
              src={logtaContainerImage}
              alt=""
              className="h-full w-full object-cover object-center opacity-95"
              loading="lazy"
              decoding="async"
            />
          </div>
          
          {/* Star Icon (Matching Screenshot #2) */}
          <div className="relative z-10">
            <svg className="w-10 h-10 text-white/90" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.8 8.6L22 9.2L16.5 14L18.2 21L12 17.3L5.8 21L7.5 14L2 9.2L9.2 8.6L12 2Z" />
            </svg>
          </div>

          <div className="relative z-10 space-y-6 max-w-md">
            <span className="text-white/60 text-sm font-bold uppercase tracking-normal">Plataforma SaaS</span>
            <h2 className="text-4xl font-black text-white tracking-tight leading-[1.15]">
              O controle completo da sua logística, simplificado.
            </h2>
            <p className="text-lg text-white/80 font-medium leading-relaxed">
              Tenha visibilidade total em tempo real sobre frotas, fretes e resultados operacionais em uma única tela inteligente.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Sleek Form Workspace */}
      <div className="w-full lg:w-[55%] flex flex-col justify-between p-12 lg:p-24 relative z-10 animate-in fade-in duration-1000">

        {/* Center Login Form */}
        <div className="max-w-md w-full mx-auto my-auto py-12">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Acessar a Conta</h1>
            <p className="text-gray-500 font-medium text-sm">Insira seu e-mail corporativo e senha de acesso abaixo.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-700 uppercase tracking-normal ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="voce@empresa.com.br"
                  className="w-full px-5 py-4 bg-white border border-gray-200 hover:border-gray-300 focus:border-primary rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-gray-700 uppercase tracking-normal">Senha de Acesso</label>
                <a href="#" className="text-xs font-bold text-primary hover:underline">Esqueceu a senha?</a>
              </div>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full h-[60px] pl-5 pr-12 py-4 bg-white border border-gray-200 hover:border-gray-300 focus:border-primary rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              disabled={isLoading}
              className="w-full py-4 mt-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-normal hover:opacity-95 transition-all duration-300 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Social login divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs font-black uppercase tracking-normal text-gray-400">
              <span className="bg-white px-4">ou continue com</span>
            </div>
          </div>

          {/* Social login options */}
          <div className="grid grid-cols-1 gap-3">
            <button className="w-full py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center font-bold text-xs text-gray-500">
              Google
            </button>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-400 font-bold">
            Não tem uma conta? <a href="#" className="text-primary hover:underline">Falar com Consultor</a>
          </p>
        </div>

      </div>
      
    </div>
  );
};

export default Login;
