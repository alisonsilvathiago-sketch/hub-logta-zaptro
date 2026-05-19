# Logta SaaS - Sistema de Transportadora Professional

Este é o modelo base (boilerplate) para o sistema de transportadora Logta. Ele foi configurado para ser totalmente isolado e profissional.

## 🏗️ Estrutura do Projeto

- **Frontend:** React 19 + Vite + Tailwind 4.0
- **Backend:** Node.js + Express + TypeScript
- **Design System:** High-End Dark Mode com tokens de 40px radius.

## 🚀 Como Iniciar

### Frontend (localhost)
```bash
cd apps/logta-saas
npm install
npm run dev
```

Abre automaticamente em **http://localhost:5173**

### Backend (localhost)
```bash
cd apps/logta-saas/server
npm install
npm run dev
```

API em **http://localhost:8788** (`GET /health`)

## 🛠️ Módulos Configurados (Draft)
1. Dashboard (KPIs em tempo real)
2. CRM de Clientes
3. Gestão de Fretes
4. Roteirização
5. Frota
6. Motoristas
7. Docs Fiscais (CTe/MDFe)
8. Financeiro
9. Cargas
10. Relatórios
11. Faturamento
12. RH
13. Automação (Zaptu)
14. Permissões
15. Hub
16. Mobile App

## 🔒 Isolamento
Este projeto está configurado para não importar código de outros domínios (`zaptro`, `hub`), mantendo a arquitetura limpa e independente.
