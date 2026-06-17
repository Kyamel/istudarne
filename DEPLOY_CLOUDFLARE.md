# Deploy na Cloudflare

Este guia explica como publicar o app novo do Istudarne na Cloudflare usando:

- **Cloudflare Workers** para o backend Hono, landing SSR e rotas de compartilhamento;
- **Static Assets do Worker** para a React SPA;
- **Cloudflare D1** para dados relacionais;
- **Cloudflare R2** para os JSONs originais enviados pelo usuário;
- **Durable Objects** para a base do chat em tempo real;
- **GitHub Actions** para deploy automático.

Fontes oficiais úteis:

- Workers com GitHub Actions: <https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/>
- Comandos D1 no Wrangler: <https://developers.cloudflare.com/d1/wrangler-commands/>
- Comandos Wrangler: <https://developers.cloudflare.com/workers/wrangler/commands/>

## 1. Instalar dependências

No projeto:

```bash
npm install
```

Confira se a aplicação compila localmente:

```bash
npm run typecheck
npm run build
```

## 2. Fazer login na Cloudflare localmente

```bash
npx wrangler login
```

Depois confirme sua conta:

```bash
npx wrangler whoami
```

## 3. Criar o banco D1

Crie o banco remoto:

```bash
npx wrangler d1 create istudarne-db
```

O comando retorna algo parecido com:

```toml
[[d1_databases]]
binding = "DB"
database_name = "istudarne-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copie o `database_id` retornado e substitua o placeholder em [wrangler.jsonc](/home/lucas/dev/web/istudarne/wrangler.jsonc):

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "istudarne-db",
    "database_id": "COLE_O_DATABASE_ID_AQUI"
  }
]
```

## 4. Criar o bucket R2

Crie o bucket usado para armazenar os JSONs originais:

```bash
npx wrangler r2 bucket create istudarne-quiz-files
```

O nome precisa bater com o binding em [wrangler.jsonc](/home/lucas/dev/web/istudarne/wrangler.jsonc):

```jsonc
"r2_buckets": [
  {
    "binding": "QUIZ_FILES",
    "bucket_name": "istudarne-quiz-files"
  }
]
```

## 5. Aplicar migrations no D1 remoto

As migrations ficam em [migrations/](/home/lucas/dev/web/istudarne/migrations).

Para aplicar no banco remoto:

```bash
npm run db:migrate:remote
```

Para testar localmente:

```bash
npm run db:migrate:local
```

## 6. Publicar manualmente uma vez

Depois de configurar D1 e R2:

```bash
npm run deploy
```

Esse script executa:

```bash
npm run build
wrangler deploy
```

Ao final, o Wrangler mostra a URL do Worker, geralmente no formato:

```text
https://istudarne.SEU_SUBDOMINIO.workers.dev
```

Rotas importantes:

```text
/                       landing SSR
/app                    React SPA
/docs                   Swagger UI
/openapi.json           especificação OpenAPI
/api/health             health check
/share/quizzes/:quizId  página SSR para compartilhamento
```

## 7. Configurar deploy automático no GitHub

O workflow em [.github/workflows/deploy-cloudflare.yml](/home/lucas/dev/web/istudarne/.github/workflows/deploy-cloudflare.yml) espera dois secrets:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

No GitHub:

1. Abra o repositório.
2. Vá em **Settings > Secrets and variables > Actions**.
3. Clique em **New repository secret**.
4. Crie `CLOUDFLARE_ACCOUNT_ID`.
5. Crie `CLOUDFLARE_API_TOKEN`.

## 8. Criar o API token da Cloudflare

Na Cloudflare:

1. Abra o dashboard da Cloudflare.
2. Vá em **My Profile > API Tokens** ou **Account API Tokens**.
3. Clique em **Create Token**.
4. Use um token customizado ou o template de edição de Workers.
5. Restrinja o token à conta correta.

Permissões recomendadas para este projeto:

```text
Account - Workers Scripts - Edit
Account - D1 - Edit
Account - Workers Tail - Read
Account - Account Settings - Read
Account - R2 Storage - Edit
```

Se for usar domínio próprio em zona da Cloudflare, adicione também permissão de zona conforme a necessidade do domínio.

Nunca coloque o token diretamente no repositório. Use apenas GitHub Secrets.

## 9. Como o workflow funciona

Em push para `main`, o workflow:

1. instala dependências com `npm ci`;
2. roda `npm run typecheck`;
3. roda `npm run build`;
4. aplica migrations remotas com `npm run db:migrate:remote`;
5. publica o Worker com `npx wrangler deploy`.

Também dá para executar manualmente pela aba **Actions** usando `workflow_dispatch`.

## 10. Domínio próprio

Depois que o Worker estiver publicado:

1. Vá no dashboard da Cloudflare.
2. Abra **Workers & Pages**.
3. Selecione o Worker `istudarne`.
4. Vá em **Settings > Domains & Routes**.
5. Adicione um domínio ou rota.

Exemplos:

```text
istudarne.com/*
app.istudarne.com/*
```

Se usar domínio próprio, revise a URL pública usada nos links de compartilhamento.

## 11. Checklist de produção

Antes de liberar para usuários reais:

- trocar o `database_id` placeholder em `wrangler.jsonc`;
- confirmar que o bucket R2 existe;
- aplicar migrations remotas;
- testar `/api/health`;
- testar upload de JSON;
- testar `/share/quizzes/:quizId`;
- configurar autenticação real e secrets de sessão;
- revisar permissões do token do GitHub Actions;
- ativar domínio próprio, se necessário.
