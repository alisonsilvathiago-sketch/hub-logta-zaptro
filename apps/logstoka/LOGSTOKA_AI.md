# IA OBRIGATÓRIA — LLAMA 3.2 (LogStoka)

A **Llama 3.2** (Ollama) é o **motor principal de inteligência** do LogStoka — componente **obrigatório, nativo e permanentemente activo**. Não é um chatbot opcional.

**Não criar opção para desactivar a IA** em produção.

## Objetivo

Funcionar como colaborador inteligente: auxiliar utilizadores, automatizar tarefas, reduzir erros operacionais e aumentar produtividade em **todos os módulos**.

## Arquitetura

```
Utilizador → Início / Assistente IA Global (drawer)
          → POST /v1/ai/chat
          → intentRouter → dataContext (RAG Supabase)
          → operationalAgent → Ollama Llama 3.2
          → resposta com dados reais + sugestões proactivas
```

| Caminho | Função |
|---------|--------|
| `server/src/modules/ai/ollamaService.ts` | Chat e JSON via Ollama |
| `server/src/modules/ai/dataContext.ts` | RAG — dados reais |
| `server/src/modules/ai/intentRouter.ts` | Detecção de intenção |
| `server/src/modules/ai/systemPrompt.ts` | Prompt do motor principal |
| `server/src/modules/ai/agents/operationalAgent.ts` | Orquestrador |
| `server/src/modules/ai/documentReader.ts` | PDF/planilha/OCR |
| `server/src/routes/aiRoutes.ts` | `/v1/ai/*` |
| `src/modules/ai/` | Drawer global, hooks, constantes |
| `src/modules/inicio/InicioPage.tsx` | Home do motor IA |

## Funções da IA

- Cadastro e correção de produtos, descrições para marketplaces, categorias
- Organização de estoque, classificação, conferência de inventários
- Análise de movimentações, relatórios, vendas, produtos parados
- Sugestões de reposição e transferência, logística
- Documentos: PDF, planilhas, imagens, OCR, NF-e
- Integrações: Mercado Livre, Shopee, Amazon, TikTok Shop, Magalu, Shein, Bling, Tiny, Omie

## Assistente IA Global

Disponível em **todas as telas** `/app/*`:

- Botão ✨ no header
- Drawer lateral `LogstokaAiDrawer`
- Evento: `window.dispatchEvent(new CustomEvent('logstoka:open-ai-drawer', { detail: { message: '…' } }))`

## Automação proactiva

A IA sugere automaticamente (quando detectado no contexto RAG):

- Cadastro incompleto · produtos duplicados
- Divergências de estoque · erros de integração/sync
- Melhorias operacionais

## Agentes (intents)

| Intent | Domínio |
|--------|---------|
| `stock` | Estoque, SKUs, mínimos |
| `movements` | Entradas, saídas, transferências |
| `returns` | Devoluções |
| `inventory` | Inventário, divergências |
| `replenishment` | Reposição, produtos parados |
| `imports` | Documentos, OCR, NF-e |
| `analytics` | Vendas, lojas, ranking |
| `integrations` | Marketplaces, ERPs, sync |
| `products` | Cadastro, descrições, categorias |
| `daily_summary` | Resumo operacional |

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/ai/health` | Status Ollama (poll automático no client) |
| POST | `/v1/ai/chat` | Chat com RAG |
| GET | `/v1/ai/daily-briefing` | Resumo automático |
| POST | `/v1/ai/validate-import` | Validação pré-importação |

## Variáveis

```env
LOGSTOKA_OLLAMA_URL=http://108.174.151.98:11434
LOGSTOKA_OLLAMA_MODEL=llama3.2
```

## Regra de implementação

Toda nova funcionalidade do LogStoka deve ser **acessível pela IA**: adicionar intent, contexto RAG e acções sugeridas quando aplicável.

A IA responde **apenas** com dados do contexto RAG — nunca inventar números.

Cursor rule: `.cursor/rules/logstoka-llama-ai-core.mdc`
