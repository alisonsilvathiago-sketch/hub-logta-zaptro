# LogStoka — Domínios, OAuth e Webhooks

Referência oficial para produção, Mercado Livre Developers e implementação no Cursor.

## Domínios

| Ambiente | URL | Uso |
|----------|-----|-----|
| Landing | `https://logstoka.com.br` | Site institucional / vendas |
| App | `https://app.logstoka.com.br` | Sistema WMS (frontend React) |
| API | `https://api.logstoka.com.br` | Backend, OAuth callbacks, webhooks |

## DNS (obrigatório antes do OAuth ML)

Criar subdomínio **`api.logstoka.com.br`** apontando para o servidor da API:

```txt
api.logstoka.com.br  →  A record  →  IP do VPS
```

ou

```txt
api.logstoka.com.br  →  CNAME  →  backend.vercel.app
```

Sem isso o Mercado Livre **não aceita** o Redirect URI.

Documentação: [Cloudflare — Create subdomain records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-subdomain/)

## API Base URL

```txt
https://api.logstoka.com.br
```

Variável de ambiente:

```env
LOGSTOKA_API_PUBLIC_URL=https://api.logstoka.com.br
VITE_LOGSTOKA_API_PUBLIC_URL=https://api.logstoka.com.br
```

Dev local: `http://localhost:8788` (fallback automático).

## OAuth — Redirect URIs (Mercado Livre e demais)

Registrar **exatamente** estas URLs no painel de cada marketplace:

| Marketplace | Redirect URI |
|-------------|--------------|
| Mercado Livre | `https://api.logstoka.com.br/integrations/mercadolivre/callback` |
| Shopee | `https://api.logstoka.com.br/integrations/shopee/callback` |
| TikTok Shop | `https://api.logstoka.com.br/integrations/tiktok/callback` |
| Amazon | `https://api.logstoka.com.br/integrations/amazon/callback` |
| Magalu | `https://api.logstoka.com.br/integrations/magalu/callback` |

### Mercado Livre — tipos de grant

Marcar no painel ML:

- ✅ **Authorization Code**
- ✅ **Refresh Token**
- ❌ **Client Credentials** (não usar)

## Webhooks — entrada (marketplace → LogStoka)

| Marketplace | Endpoint |
|-------------|----------|
| Mercado Livre | `POST https://api.logstoka.com.br/webhooks/mercadolivre` |
| Shopee | `POST https://api.logstoka.com.br/webhooks/shopee` |
| TikTok Shop | `POST https://api.logstoka.com.br/webhooks/tiktok` |
| Amazon | `POST https://api.logstoka.com.br/webhooks/amazon` |
| Magalu | `POST https://api.logstoka.com.br/webhooks/magalu` |

Headers recomendados: `x-company-id`, assinatura HMAC quando disponível.

## Rotas genéricas (legado / ERP)

- `POST /webhooks/orders`
- `POST /webhooks/marketplaces`
- `POST /webhooks/inventory`
- `POST /webhooks/shipping`

## Catálogo JSON (API)

```bash
GET https://api.logstoka.com.br/integrations/catalog
```

Retorna base URL, callbacks OAuth e webhooks por marketplace.

## Código

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/logstokaApiDomains.ts` | Constantes frontend |
| `server/src/lib/apiDomains.ts` | Constantes backend |
| `server/src/routes/integrationRoutes.ts` | Handlers OAuth + webhooks |
| `.cursor/rules/logstoka-api-domains-oauth.mdc` | Regra Cursor |

## Dev

```bash
npm run dev --prefix apps/logstoka/server   # porta 8788
npm run dev --prefix apps/logstoka          # porta 5177
```

Proxy Vite: `/logstoka-api` → `LOGSTOKA_API_PROXY` (ver `vite.config.ts`).
