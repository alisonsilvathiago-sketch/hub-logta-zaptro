-- Seed: Knowledge Base Initial Content
-- Description: Populate categories and base articles for the Logta Help Center.

-- 1. Inserir Categorias
INSERT INTO public.knowledge_categories (id, name, description, icon, display_order)
VALUES 
    ('c1000000-0000-0000-0000-000000000000', 'Sistema Logta', 'Guia completo de uso dos módulos CRM, RH, Financeiro e Logística.', 'LayoutDashboard', 1),
    ('c2000000-0000-0000-0000-000000000000', 'WhatsApp SAAS', 'Como conectar instâncias, configurar automações e gerenciar conversas.', 'MessageSquare', 2),
    ('c3000000-0000-0000-0000-000000000000', 'Academy (Cursos)', 'Tudo sobre como acessar, comprar e gerenciar seus treinamentos internos.', 'GraduationCap', 3),
    ('c4000000-0000-0000-0000-000000000000', 'Pagamentos', 'Informações sobre assinaturas, faturamento, upgrades e cancelamentos.', 'CreditCard', 4),
    ('c5000000-0000-0000-0000-000000000000', 'Central de Suporte', 'Como abrir chamados técnicos e acompanhar o atendimento do time Master.', 'Headphones', 5),
    ('c6000000-0000-0000-0000-000000000000', 'Problemas Comuns', 'Soluções rápidas para erros de login, instabilidades e dúvidas frequentes.', 'AlertCircle', 6)
ON CONFLICT (id) DO NOTHING;

-- 2. Inserir Artigos de Exemplo (Sistema Logta)
INSERT INTO public.knowledge_articles (category_id, title, slug, excerpt, content)
VALUES 
    ('c1000000-0000-0000-0000-000000000000', 'Primeiros Passos no Logta', 'primeiros-passos', 'Aprenda Configurar sua empresa no primeiro acesso.', 
     '# Bem-vindo ao Logta!\n\nPara começar a usar o Logta, siga estes passos:\n\n1. Acesse **Configurações White-Label** para subir sua logo.\n2. Cadastre sua equipe no módulo **RH**.\n3. Configure seus veículos e motoristas em **Frotas**.\n\nAssista aos tutoriais completos no Academy.'),
    
    ('c2000000-0000-0000-0000-000000000000', 'Como Conectar seu WhastApp', 'conectar-whatsapp', 'Guia para ler o QR Code e ativar sua instância.', 
     '# Conexão WhatsApp\n\nSiga o procedimento abaixo para ativar o WhatsApp no seu Logta:\n\n- Vá em **Canal WhatsApp** no menu lateral.\n- Clique em **Nova Instância**.\n- Use o seu celular para ler o **QR Code** gerado na tela.\n\n*Nota: Sua instância deve estar ativa para que as notificações automáticas funcionem.*'),
    
    ('c3000000-0000-0000-0000-000000000000', 'Acessando os Cursos do Academy', 'acesso-academy', 'Saiba como entrar no portal de educação academy.logta.com.br.', 
     '# Logta Academy\n\nTodos os treinamentos da sua empresa estão centralizados no domínio **academy.logta.com.br**.\n\nUse o mesmo login e senha do sistema principal para acessar seus cursos comprados ou os treinamentos internos da sua transportadora.'),
     
    ('c5000000-0000-0000-0000-000000000000', 'Como Abrir um Chamado', 'abrir-chamado', 'Instruções para falar com o suporte técnico.', 
     '# Suporte Técnico\n\nSe você encontrar qualquer dificuldade técnica, acesse o botão **Suporte Técnico** na barra lateral. \n\nDescreva o problema com o máximo de detalhes possível para que o time Master oficial possa resolver rapidamente.'),
     
    ('c6000000-0000-0000-0000-000000000000', 'Erro de Login e Senha', 'erro-login', 'O que fazer quando não conseguir acessar o sistema.', 
     '# Problemas de Acesso\n\n1. Verifique se o CAPS LOCK está ligado.\n2. Se esqueceu sua senha, use o link **Recuperar Senha** na tela de login.\n3. Em caso de "Conta Suspensa", contate o administrador financeiro da sua empresa.')
ON CONFLICT (slug) DO NOTHING;
