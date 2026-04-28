import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  Truck, 
  Zap, 
  CreditCard, 
  Users, 
  ChevronRight,
  HelpCircle,
  BarChart3,
  Bot,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Download,
  MapPin,
  Clock,
  Shield
} from 'lucide-react';

const LIME = '#D9FF00';
const BG_COLOR = '#F9F9F7';

// --- DATA STRUCTURES ---

interface Article {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content: JSX.Element;
  tags: string[];
}

interface Category {
  id: string;
  title: string;
  icon: JSX.Element;
  desc: string;
}

const CATEGORIES: Category[] = [
  { id: 'whatsapp', title: 'Automação & WhatsApp', icon: <MessageSquare color={LIME} />, desc: 'Múltiplos atendentes, robôs de resposta e conexão de números.' },
  { id: 'rotas', title: 'Gestão de Rotas (IA)', icon: <Truck color={LIME} />, desc: 'Otimização de custos, diesel e resumos inteligentes de viagens.' },
  { id: 'crm', title: 'CRM & Vendas', icon: <BarChart3 color={LIME} />, desc: 'Funil de leads, orçamentos online e acompanhamento comercial.' },
  { id: 'conta', title: 'Conta & Acesso', icon: <Users color={LIME} />, desc: 'Gestão de equipe, níveis de permissão e segurança.' },
  { id: 'financeiro', title: 'Financeiro & Planos', icon: <CreditCard color={LIME} />, desc: 'Faturas, métodos de pagamento, planos e upgrades.' },
  { id: 'api', title: 'API & Integrações', icon: <Bot color={LIME} />, desc: 'Conecte o Zaptro ao seu ERP ou sistemas externos.' },
];

const ARTICLES: Article[] = [
  {
    id: 'wa-1',
    category: 'whatsapp',
    title: 'Como conectar múltiplos atendentes em um único número de WhatsApp?',
    excerpt: 'Aprenda a centralizar seu atendimento comercial e operacional usando apenas um QR Code.',
    tags: ['whatsapp', 'atendimento', 'multi-agente'],
    content: (
      <>
        <p>O Zaptro permite que sua transportadora tenha 5, 10 ou até 50 atendentes usando o mesmo número de WhatsApp. Isso elimina a necessidade de cada vendedor ter um celular físico diferente.</p>
        <h3>Passo a passo para conexão:</h3>
        <ol>
          <li>Acesse o menu <b>Configurações de WhatsApp</b> no seu painel Zaptro.</li>
          <li>Clique em "Adicionar Nova Conexão".</li>
          <li>Abra o WhatsApp no seu celular, vá em "Aparelhos Conectados" e escaneie o QR Code que aparecerá na tela.</li>
          <li>Pronto! Agora você pode criar <b>Departamentos</b> (ex: Comercial, Financeiro, Logística) e distribuir os atendentes.</li>
        </ol>
        <div style={{ backgroundColor: '#F1F5F9', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
          <b>Dica de Ouro:</b> Ative as mensagens de saudação automática para que seu cliente nunca fique sem resposta, mesmo fora do horário comercial.
        </div>
      </>
    )
  },
  {
    id: 'rotas-1',
    category: 'rotas',
    title: 'IA de Rotas: Como economizar até 30% em combustível?',
    excerpt: 'Nossa inteligência artificial analisa trajetos e sugere as melhores rotas para sua frota.',
    tags: ['rotas', 'diesel', 'ia', 'economia'],
    content: (
      <>
        <p>A Inteligência Artificial do Zaptro não apenas traça um caminho; ela calcula o <b>custo por KM</b> e o rendimento esperado do veículo.</p>
        <h3>Funcionalidades Principais:</h3>
        <ul>
          <li><b>Resumo de Viagem:</b> Após a rota, a IA gera um relatório de paradas não programadas e eficiência.</li>
          <li><b>Cálculo de Diesel:</b> Preveja exatamente quanto será gasto antes mesmo do motorista ligar o caminhão.</li>
          <li><b>Link de Rastreio:</b> Envie um link para o seu cliente final acompanhar a carga em tempo real.</li>
        </ul>
        <p>Para configurar sua primeira rota, vá em <b>Logística &gt; Nova Rota</b> e selecione os veículos disponíveis.</p>
      </>
    )
  },
  {
    id: 'crm-1',
    category: 'crm',
    title: 'Transformando Leads do WhatsApp em Orçamentos Reais',
    excerpt: 'Use o CRM integrado para não perder nenhuma oportunidade de frete.',
    tags: ['crm', 'vendas', 'leads', 'orçamento'],
    content: (
      <>
        <p>O CRM do Zaptro foi desenhado especificamente para o setor de transportes. Esqueça planilhas manuais.</p>
        <h3>Como funciona o fluxo:</h3>
        <ol>
          <li>O lead entra em contato via WhatsApp.</li>
          <li>Com um clique, você o transforma em uma <b>Oportunidade</b> no CRM.</li>
          <li>A ferramenta de <b>Orçamento Online</b> gera um PDF profissional em segundos com os dados da carga.</li>
          <li>Se o cliente aprovar, o orçamento vira uma <b>Ordem de Serviço</b> automaticamente.</li>
        </ol>
      </>
    )
  },
  {
    id: 'mot-1',
    category: 'motorista',
    title: 'Guia do Motorista: Como usar o App Zaptro Mobile?',
    excerpt: 'Tutorial completo para motoristas enviarem fotos de comprovantes e localizações.',
    tags: ['motorista', 'app', 'tutorial'],
    content: (
      <>
        <p>O motorista não precisa de login complexo. Ele recebe um link direto no WhatsApp para acessar sua rota.</p>
        <h3>O que o motorista faz no App:</h3>
        <ul>
          <li><b>Check-in:</b> Avisa quando chegou no ponto de carga ou descarga.</li>
          <li><b>Fotos de Canhotos:</b> Tira foto da nota fiscal assinada e envia direto para o escritório.</li>
          <li><b>Ocorrências:</b> Reporta pneus furados, trânsito ou atrasos com um botão.</li>
        </ul>
      </>
    )
  }
];

// --- COMPONENTS ---

const HelpCenter: React.FC = () => {
  const [view, setView] = useState<'home' | 'category' | 'article'>('home');
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [selectedArt, setSelectedArt] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Transportadora');

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, selectedCat, selectedArt]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return [];
    return ARTICLES.filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const catArticles = useMemo(() => {
    if (!selectedCat) return [];
    return ARTICLES.filter(a => a.category === selectedCat.id);
  }, [selectedCat]);

  const handleOpenArticle = (art: Article) => {
    setSelectedArt(art);
    setView('article');
  };

  const handleOpenCategory = (cat: Category) => {
    setSelectedCat(cat);
    setView('category');
  };

  // --- RENDERERS ---

  const renderHome = () => (
    <>
      {/* HERO SECTION */}
      <section style={{ padding: '80px 24px 60px', textAlign: 'center', background: 'linear-gradient(180deg, #FFF 0%, #F9F9F7 100%)' }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, letterSpacing: '-0.04em', margin: '0 0 16px' }}>
          Olá, como podemos ajudar?
        </h1>
        <p style={{ fontSize: 16, color: '#64748B', fontWeight: 500, marginBottom: 40, maxWidth: 600, marginInline: 'auto' }}>
          Utilize nossa Inteligência Artificial para encontrar respostas rápidas sobre automação, rotas e CRM.
        </p>

        <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.06)', padding: '4px', display: 'flex', border: '1px solid #E2E8F0' }}>
            <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center' }}><Search size={22} color="#94A3B8" /></div>
            <input 
              type="text"
              placeholder="Ex: Como conectar meu WhatsApp?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, fontWeight: 500, padding: '16px 0' }}
            />
            <button style={{ backgroundColor: '#000', color: LIME, padding: '0 28px', borderRadius: 16, border: 'none', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 4 }}>
              Gerar <Zap size={14} fill={LIME} />
            </button>
          </div>
          {searchQuery && (
            <div style={{ position: 'absolute', top: 'calc(100% + 12px)', left: 0, right: 0, backgroundColor: '#FFF', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #E2E8F0', zIndex: 1000, padding: '12px', textAlign: 'left', maxHeight: 400, overflowY: 'auto' }}>
              {filteredArticles.length > 0 ? filteredArticles.map(art => (
                <div key={art.id} onClick={() => handleOpenArticle(art)} style={{ padding: '16px', borderRadius: 16, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{art.title}</div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>{art.excerpt}</div>
                </div>
              )) : <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>Nenhum artigo encontrado.</div>}
            </div>
          )}
        </div>
      </section>

      {/* TABS */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, borderBottom: '1px solid #E2E8F0', marginBottom: 60 }}>
        {['Transportadora', 'Motorista', 'Embarcador'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '16px 8px', border: 'none', borderBottom: `3px solid ${activeTab === tab ? '#000' : 'transparent'}`, fontWeight: activeTab === tab ? 800 : 500, fontSize: 15, color: activeTab === tab ? '#000' : '#64748B', cursor: 'pointer', backgroundColor: 'transparent' }}>
            Sou {tab}
          </button>
        ))}
      </div>

      {/* CONTENT BASED ON TAB */}
      <section style={{ maxWidth: 1100, margin: '0 auto 100px', padding: '0 24px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 32 }}>{activeTab === 'Transportadora' ? 'Tudo para sua gestão' : activeTab === 'Motorista' ? 'Facilite sua viagem' : 'Acompanhe sua carga'}</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {activeTab === 'Transportadora' && CATEGORIES.map(cat => (
            <div key={cat.id} onClick={() => handleOpenCategory(cat)} style={{ backgroundColor: '#FFF', borderRadius: 24, padding: '32px', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>{cat.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>{cat.title}</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5, marginBottom: 16 }}>{cat.desc}</p>
              <div style={{ color: '#000', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>Ver artigos <ChevronRight size={14} /></div>
            </div>
          ))}

          {activeTab === 'Motorista' && (
             <div onClick={() => handleOpenArticle(ARTICLES.find(a => a.id === 'mot-1')!)} style={{ backgroundColor: '#FFF', borderRadius: 24, padding: '32px', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
               <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: LIME, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><Download color="#000" /></div>
               <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>Como usar o App Zaptro</h3>
               <p style={{ fontSize: 14, color: '#64748B' }}>Tutorial completo para motoristas de frota ou agregados.</p>
             </div>
          )}

          {activeTab === 'Embarcador' && (
             <div style={{ backgroundColor: '#FFF', borderRadius: 24, padding: '32px', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
               <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><MapPin color={LIME} /></div>
               <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>Rastreamento Público</h3>
               <p style={{ fontSize: 14, color: '#64748B' }}>Veja como acompanhar sua carga em tempo real sem precisar de senha.</p>
             </div>
          )}
        </div>
      </section>
    </>
  );

  const renderCategory = () => (
    <section style={{ maxWidth: 900, margin: '40px auto 100px', padding: '0 24px' }}>
      <button onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', fontWeight: 600, marginBottom: 32 }}>
        <ArrowLeft size={18} /> Voltar para o início
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
         <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{selectedCat?.icon}</div>
         <h1 style={{ fontSize: 32, fontWeight: 900 }}>{selectedCat?.title}</h1>
      </div>
      <p style={{ fontSize: 16, color: '#64748B', marginBottom: 48 }}>{selectedCat?.desc}</p>

      <div style={{ display: 'grid', gap: 16 }}>
        {catArticles.length > 0 ? catArticles.map(art => (
          <div key={art.id} onClick={() => handleOpenArticle(art)} style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: 20, border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = '#000'}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{art.title}</div>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>{art.excerpt}</p>
          </div>
        )) : <p>Em breve novos artigos para esta categoria.</p>}
      </div>
    </section>
  );

  const renderArticle = () => (
    <section style={{ maxWidth: 800, margin: '40px auto 100px', padding: '0 24px' }}>
      <button onClick={() => setView('category')} style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', fontWeight: 600, marginBottom: 32 }}>
        <ArrowLeft size={18} /> Voltar para {selectedCat?.title || 'Ajuda'}
      </button>
      
      <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: LIME, backgroundColor: '#000', padding: '4px 12px', borderRadius: 6, display: 'inline-block', marginBottom: 16 }}>
        {selectedArt?.category.toUpperCase()}
      </div>
      <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 32 }}>
        {selectedArt?.title}
      </h1>

      <article style={{ fontSize: 17, lineHeight: 1.7, color: '#334155' }}>
        {selectedArt?.content}
      </article>

      <div style={{ marginTop: 60, padding: '40px', backgroundColor: '#FFF', borderRadius: 24, border: '1px solid #E2E8F0', textAlign: 'center' }}>
        <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Esta informação te ajudou?</h4>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#FFF', cursor: 'pointer', fontWeight: 700 }}><ThumbsUp size={18} /> Sim</button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#FFF', cursor: 'pointer', fontWeight: 700 }}><ThumbsDown size={18} /> Não</button>
        </div>
      </div>
    </section>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG_COLOR, fontFamily: 'Inter, -apple-system, sans-serif', color: '#0F172A' }}>
      {/* HEADER */}
      <header style={{ height: 80, backgroundColor: '#FFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 5vw', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, backgroundColor: '#000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={20} color={LIME} fill={LIME} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em' }}>zaptro</span>
            <div style={{ width: 1, height: 20, backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#64748B' }}>Central de Ajuda</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}><Globe size={18} /> Português</div>
          <button style={{ backgroundColor: '#000', color: '#FFF', padding: '10px 24px', borderRadius: 12, border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Acessar Sistema</button>
        </div>
      </header>

      {/* DYNAMIC VIEW */}
      {view === 'home' && renderHome()}
      {view === 'category' && renderCategory()}
      {view === 'article' && renderArticle()}

      {/* FOOTER */}
      <footer style={{ padding: '80px 5vw 40px', backgroundColor: '#FFF', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40, marginBottom: 60 }}>
            <div style={{ maxWidth: 300 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}><Zap size={24} color="#000" fill="#000" /><span style={{ fontSize: 22, fontWeight: 900 }}>zaptro</span></div>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>A inteligência que move o transporte. Automação, CRM e Rastreamento em um único ecossistema.</p>
            </div>
            <div style={{ display: 'flex', gap: 80 }}>
              <div><h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 20 }}>SUPORTE</h4><p style={{ fontSize: 14, color: '#64748B' }}>Suporte 24/7 via WhatsApp<br/>E-mail: help@zaptro.com.br</p></div>
              <div><h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 20 }}>REDES</h4><p style={{ fontSize: 14, color: '#64748B' }}>Instagram<br/>LinkedIn</p></div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 40, display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: 13 }}>
            <span>© 2026 Zaptro. Orgulhosamente servindo a logística brasileira.</span>
            <div style={{ display: 'flex', gap: 24 }}><span>Privacidade</span><span>Termos</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HelpCenter;
