# LogStoka — Fluxo operacional real

Este documento descreve o processo diário das empresas que vendem em marketplaces e operam estoque + expedição. O LogStoka deve **adaptar-se ao fluxo da empresa**, não forçar mudança de processo.

## Fluxo atual (referência cliente)

```
Marketplace (Shopee, ML, TikTok, Magalu, Shein…)
  → ERP (ex.: Bling) / planilha / relatório
  → Estoque recebe relatório
  → Separação
  → Conferência
  → Expedição
  → Transportadora
```

## Entrada de relatórios

Com ou **sem API**:

| Canal | Uso |
|-------|-----|
| API / Webhook | Pedidos e estoque automáticos |
| Excel / CSV | Upload manual |
| PDF / Imagem | OCR + IA (Llama) |
| Foto do relatório | Importações + IA |

## Calendário semanal (saídas)

| Dia | Foco operacional |
|-----|------------------|
| **Segunda** | Processar vendas de **sexta e sábado** (até meia-noite). Expedir para marketplaces. |
| **Terça** | Processar **domingo** + parte de **segunda**. Enviar até ~15h o da terça. |
| **Quarta** | Processar **terça** + parte de **quarta**. |
| **Quinta** | Dia mais leve — pendências e atrasos. |
| **Sexta** | Operação encerra ~**17:48**. Vendas até meia-noite vão para fila de segunda. |
| **Sábado** | Vendas acumulam para processamento na segunda. |

## Fila operacional

```
Relatório recebido → Separação → Conferência → Expedição → Transportadora → Em trânsito
```

O sistema deve mostrar sempre:

- O que **não foi enviado**
- O que está **pendente**
- O que está **atrasado**
- O que está **em trânsito**

## Perfis de tenant

1. **Somente estoque** — entrada, saída, inventário, separação, conferência, expedição (+ API mínima para ERP).
2. **Estoque + integrações** — marketplaces, webhooks, Bling, automações completas.

Configurado em **Configurações → Empresa → Operação**.

## Módulo no produto

- **Painel de Trabalho** (`/app/operacao`) — central diária do operador.
- Alertas personalizáveis (fase 2).
- Regras por empresa (fase 2).
