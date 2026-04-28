# Resumo do Sistema Logta — Plataforma de Inteligência Logística

Este documento apresenta uma visão consolidada de todo o ecossistema desenvolvido para a plataforma Logta até à data de 23 de abril de 2026.

---

## 1. VISÃO GERAL
*   **Nome do Sistema:** Logta Platform (Logta SaaS)
*   **Objetivo Principal:** Centralização e automação da operação logística (TMS), gestão de frotas, RH, comercial e financeiro em uma única torre de controle.
*   **Público-alvo:** Transportadoras, embarcadores, frotistas e gestores de logística de alto desempenho.

---

## 2. MÓDULOS IMPLEMENTADOS
1.  **Dashboard de Inteligência (Control Tower)**
2.  **Logística (TMS - Transport Management System)**
3.  **Frota (Asset Management & Tracking)**
4.  **CRM (Vendas & Leads Estratégicos)**
5.  **Financeiro (Fluxo de Caixa & Custos)**
6.  **Pessoas (RH, Motoristas & Performance)**
7.  **Estoque (WMS - Warehouse Management System)**
8.  **Academy (Treinamento & Capacitação)**
9.  **Drivers Portal (Interface de execução de campo)**

---

## 3. PÁGINAS E FUNCIONALIDADES DETALHADAS

### 📦 Logística (TMS)
*   **Página:** Painel Operacional e Gestão de Entregas
*   **URL:** `/logistica/dashboard`, `/logistica/entregas`, `/logistica/mapa`
*   **Função:** Controle total da operação de transporte.
*   **Funcionalidades:**
    *   Monitoramento de janelas de entrega (SLA).
    *   Mapa interativo com rastreamento em tempo real (Leaflet).
    *   Gestão de ocorrências e justificativas.
    *   Criação e edição de rotas complexas.
*   **Status:** Completo / Operacional.

### 🚛 Frota
*   **Página:** Gestão de Ativos e Manutenção
*   **URL:** `/frota`, `/veiculos`
*   **Função:** Monitoramento de ativos e manutenção.
*   **Funcionalidades:**
    *   Dashboard de custos mensais por veículo.
    *   Controle de abastecimento e consumo.
    *   Agenda de manutenções preventivas.
    *   Gestão de rastreadores e transmissores.
*   **Status:** Completo.

### 👥 Pessoas & Motoristas
*   **Página:** RH e Performance de Motoristas
*   **URL:** `/motoristas`, `/rh`, `/usuarios`
*   **Função:** Gestão de capital humano e conformidade legal.
*   **Funcionalidades:**
    *   Ranking de performance (On-time delivery).
    *   Upload e validação de documentos (CNH, Toxicológico).
    *   Gestão de permissões por papel (Admin, Gerente, Motorista).
*   **Status:** Completo (Standardized UI).

### 💰 Financeiro
*   **Página:** Fluxo de Caixa e Transações
*   **URL:** `/financeiro`
*   **Função:** Saúde financeira do negócio.
*   **Funcionalidades:**
    *   Registro de transações (Receitas/Despesas).
    *   Calculadora financeira integrada para simulações rápidas.
    *   Gráficos de fluxo de caixa e projeção de lucros.
*   **Status:** Completo.

---

## 4. FUNCIONALIDADES GLOBAIS
*   **Autenticação:** Login seguro via Supabase Auth com persistência de sessão.
*   **RBAC (Permissões):** Redirecionamento dinâmico baseado na função do usuário.
*   **Notificações:** Feedback instantâneo (Toasts) para todas as ações do sistema.
*   **Multi-tenancy:** Arquitetura que isola dados de múltiplas empresas (Tenants) no mesmo banco.
*   **Exportação:** Exportação de dados para CSV/PDF em quase todas as tabelas.

---

## 5. PADRÃO DE DESIGN (Clean Light Premium)
*   **Estética:** Visual de alta fidelidade, minimalista e profissional.
*   **Cores:** Roxo Real (`#7c3aed`), Slate/Preto (`#0f172a`), Branco Premium.
*   **UX:** Uso de esqueletos de carregamento, animações de fade-in e transições suaves.
*   **Componentes:** Uso intensivo de `MetricCard` (KPIS com sparklines) e `LogtaModal`.

---

## 6. ESTRUTURA TÉCNICA
*   **Frontend:** React 19 + Vite + TypeScript.
*   **Backend/DB:** Supabase (PostgreSQL).
*   **Estilização:** CSS-in-JS (Style Objects) para máximo controle e performance.
*   **Mapa:** Leaflet.js para visualização geoespacial.

---

## 7. PONTOS FORTES
*   **Integridade Visual:** Sistema coeso que parece um produto único.
*   **Rapidez de Resposta:** Operações de CRUD otimizadas com feedback imediato ao usuário.
*   **Segurança:** Proteção de dados via Row Level Security (RLS) no banco de dados.

---

## 8. RESUMO FINAL
O sistema está em nível **Ready-to-Deploy (MVP+)**. Todas as funções críticas para operação de uma transportadora estão presentes, testadas e com design premium. O foco atual mudou de "desenvolvimento de base" para "refinação de UX e estabilidade".
