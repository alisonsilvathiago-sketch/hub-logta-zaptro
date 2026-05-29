# IA OPERACIONAL LOGSTOKA — LLAMA 3.2

O LogStoka possui uma camada de Inteligência Artificial utilizando **Llama 3.2** (Ollama na VPS).

A IA **não é um chatbot** — é um **copiloto operacional** em todas as telas.

## Objetivo

Auxiliar operadores, gestores e administradores em todas as tarefas do WMS.

## Arquitetura

**Llama 3.2 + RAG (Supabase) + agentes especializados**

```
Utilizador → Drawer IA (frontend)
          → POST /v1/ai/chat (API LogStoka)
          → intentRouter → dataContext (RAG)
          → operationalAgent → Ollama /api/chat
          → resposta com dados reais
```

### Módulos

| Caminho | Função |
|---------|--------|
| `server/src/modules/ai/ollamaService.ts` | Chat e JSON via Ollama |
| `server/src/modules/ai/dataContext.ts` | RAG — consultas Supabase |
| `server/src/modules/ai/intentRouter.ts` | Detecção de intenção |
| `server/src/modules/ai/agents/operationalAgent.ts` | Orquestrador principal |
| `server/src/modules/ai/documentReader.ts` | Validação de importações |
| `server/src/routes/aiRoutes.ts` | `/v1/ai/*` |
| `src/modules/ai/` | Drawer global + chat |

### Agentes (intents)

- **stock** — estoque, SKUs, depósitos, mínimo
- **movements** — entradas, saídas, transferências
- **returns** — devoluções e motivos
- **inventory** — divergências e recontagem
- **replenishment** — reposição, giro, produtos parados
- **imports** — validação Excel/CSV/PDF/OCR
- **analytics** — lojas, marketplaces, ranking
- **daily_summary** — resumo operacional do dia

## Assistente global

Botão **IA Operacional** no header (todas as telas `/app/*`).

Evento global:

```js
window.dispatchEvent(new CustomEvent('logstoka:open-ai-drawer', { detail: { message: '…' } }));
```

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/ai/health` | Status Ollama |
| POST | `/v1/ai/chat` | Chat com RAG |
| GET | `/v1/ai/daily-briefing` | Resumo automático |
| POST | `/v1/ai/validate-import` | Validação pré-importação |

## Variáveis

```env
LOGSTOKA_OLLAMA_URL=http://108.174.151.98:11434
LOGSTOKA_OLLAMA_MODEL=llama3.2
```

## Futuro

Toda nova funcionalidade do LogStoka deve ser acessível pela IA.

Novos agentes: adicionar intent em `intentRouter.ts`, contexto em `dataContext.ts`, e expor via `/v1/ai/chat`.

## Exemplos de perguntas

- Quantas unidades do SKU 123 temos?
- Quais produtos estão abaixo do estoque mínimo?
- Quantas devoluções tivemos hoje?
- Quais produtos estão parados há mais de 90 dias?
- Existe divergência no inventário?
- Qual marketplace gerou mais saídas?

---

**Regra:** a IA responde com dados do contexto RAG; nunca inventar números.
