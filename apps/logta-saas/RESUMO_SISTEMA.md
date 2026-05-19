# 🚛 Modelo Logta SaaS Salvo e Isolado

O sistema de transportadora foi salvo na pasta dedicada e está configurado para operar de forma independente, garantindo que não haja mistura com outros projetos no seu computador.

## 📂 Estrutura de Arquivos Salva

### 🖥️ Frontend (`apps/logta-saas/`)
- package.json - Scripts de dev/build e dependências (React 19, Vite).
- vite.config.ts - Configuração do Vite com aliases isolados.
- src/App.tsx - Estrutura principal e roteamento.
- src/index.css - Design System (Tailwind 4.0).
- src/pages/Dashboard.tsx - Interface de monitoramento premium.
- src/pages/CRM.tsx - Gestão de clientes.
- README.md - Documentação exclusiva do projeto.
- .gitignore - Isolamento de arquivos locais.

### ⚙️ Backend (`apps/logta-saas/server/`)
- package.json - Scripts Node.js/Express.
- src/index.ts - Servidor API básico com health check.
- .env - Variáveis de ambiente locais.
- tsconfig.json - Configuração TypeScript para backend.

## 🛡️ Garantia de Isolamento
1. **Sem Dependências Cruzadas:** Nenhuma parte deste código importa arquivos do `apps/zaptro` ou `hub`.
2. **Ambiente Local:** O `.env` e o mock de API (`src/lib/api.ts`) garantem que você possa testar tudo offline.
3. **Pasta Única:** Todo o "modelo" está contido dentro de `apps/logta-saas`.
