# Istudarne

Plataforma de estudo gamificado em construção. O repositório agora mantém duas camadas:

- `mvp/`: versão estática original em HTML, CSS e JavaScript puro, publicada no GitHub Pages pelo workflow atual.
- `app/` + `worker/`: nova aplicação React SPA com API Hono em Cloudflare Workers.

## Arquitetura nova

```text
React SPA
├─ /app/*                 interface autenticada, dashboard, quizzes e grupos
├─ app/lib/               cliente de API, schemas e código compartilhado
└─ app/pages/             telas iniciais

Hono Worker
├─ /                      landing page renderizada no Worker
├─ /share/quizzes/:id     página SSR para compartilhamento e metatags
├─ /docs                  Swagger UI gerado pelas rotas Hono/OpenAPI
├─ /openapi.json          especificação OpenAPI gerada do código
├─ /api/*                 API JSON
├─ D1 + Drizzle           dados relacionais, schema e migrations
├─ R2                     JSON original enviado pelo usuário
└─ Durable Objects        base para chat em tempo real
```

## Rodar localmente

Instale dependências:

```bash
npm install
```

Crie o banco local e aplique migrations:

```bash
npm run db:migrate:local
```

Inicie o ambiente:

```bash
npm run dev
```

## Próximos passos de implementação

- autenticação real com cookie HTTP-only;
- tela de quiz carregando questões reais por API;
- persistência de tentativas e respostas;
- busca por tags;
- perfis públicos;
- grupos e chat WebSocket via Durable Objects.
