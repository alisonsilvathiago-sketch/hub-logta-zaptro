# Inbox WhatsApp — corrigir AGORA

## Por que não chega mensagem

1. **Cloud ainda 401** — `evolution-webhook` com JWT ligado (deploy `--no-verify-jwt` não aplicado).
2. **Túnel loca.lt** estava morto — Evolution enviava para URL que não responde.

WhatsApp na Evolution: **conectado** ✅  
Banco: só mensagens de **teste**, nada novo do telefone real ❌

---

## Opção 1 — Terminal (recomendado)

```bash
cd /Volumes/PODCAST/PROJETOS/hub-logta-zaptro
npx supabase login
bash apps/zaptro/scripts/deploy-evolution-webhook-only.sh
```

**Tem de aparecer `HTTP 200` no final.** Se aparecer 401, o deploy não aplicou.

---

## Opção 2 — Dashboard Supabase (se CLI falhar)

1. https://supabase.com/dashboard/project/rrjnkmgkhbtapumgmhhr/functions
2. Abra **`evolution-webhook`**
3. Desligue **“Verify JWT with legacy secret”** (OFF)
4. **Deploy** o código de `apps/zaptro/supabase/functions/evolution-webhook/index.ts`
5. Teste no terminal:

```bash
curl -s -w '\nHTTP %{http_code}\n' -X POST \
  'https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/evolution-webhook' \
  -H 'Content-Type: application/json' \
  -d '{"event":"Message","instance":"zaptro","data":{"Info":{"Chat":"5511999887766@s.whatsapp.net","IsFromMe":false,"ID":"t1"},"Message":{"conversation":"teste"}}}'
```

---

## Depois do HTTP 200

```bash
bash apps/zaptro/scripts/fix-wa-inbox-webhook.sh
npm run dev --prefix apps/zaptro
```

No app: **login** → **Conexão** (QR) → **Conversas** → mensagem de **outro celular** → refresh.

URL na Evolution:

`https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/evolution-webhook`
