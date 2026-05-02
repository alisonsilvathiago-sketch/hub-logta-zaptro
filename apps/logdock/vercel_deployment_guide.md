# Guia de Implantação do LogDock no Vercel

Este guia descreve os passos exatos para separar e implantar o projeto **LogDock** no Vercel de forma isolada, dentro da sua organização de equipe (`team_bufEwvRw60uJbU0iejmMAnbh`).

## ⚙️ Configurações Aplicadas
- **Pasta Raiz do Projeto:** `apps/logdock`
- **Link de Organização:** Configurado localmente em `apps/logdock/.vercel/project.json`.
- **Arquivo de Configuração do Vercel:** Criado em `vercel.json`.

---

## 🚀 Passo a Passo para Criar o Projeto no Vercel

Você pode fazer isso pela interface web do Vercel ou pelo terminal:

### Opção 1: Pela Interface Web do Vercel
1. Acesse o painel do Vercel sob a sua equipe (`team_bufEwvRw60uJbU0iejmMAnbh`).
2. Clique em **Add New...** -> **Project**.
3. Selecione o repositório do seu GitHub onde o monorepo está hospedado.
4. Na tela de importação do projeto, configure os seguintes campos:
   - **Project Name:** `hub-logta-zaptro-logdock`
   - **Framework Preset:** `Vite` ou `Other`
   - **Root Directory:** clique em **Edit** e selecione `apps/logdock`.
5. Em **Build and Output Settings**, garanta que esteja assim:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Clique em **Deploy**.

---

### Opção 2: Pelo Terminal (Vercel CLI)
No seu terminal local, a partir da raiz do monorepo, execute os comandos:

```bash
# 1. Entre na pasta do LogDock
cd apps/logdock

# 2. Faça o login na conta correta (caso ainda não esteja logado)
npx vercel login

# 3. Vincule e envie para o Vercel usando o ID de equipe correto
npx vercel link --scope team_bufEwvRw60uJbU0iejmMAnbh

# 4. Publique para produção
npx vercel --prod
```

Isso criará o projeto totalmente separado no Vercel, mantendo os outros projetos (`hub`, `zaptro`, `logta`) intactos e independentes! 🚀
