# Plataforma de estudo gamificado serverless

Este documento detalha uma evolução do quiz atual em HTML/JS puro para uma aplicação completa em **React**, com backend **serverless na Cloudflare**, banco relacional **Cloudflare D1 via Drizzle ORM** e armazenamento de arquivos em **Cloudflare R2**.

> Observação: a Cloudflare possui **D1** para banco SQL e **R2** para objetos/arquivos. Como Drizzle integra muito bem com D1, este plano assume **D1 + Drizzle** para os dados e **R2** para uploads de JSON. Se a intenção era “R1”, provavelmente o serviço correto é D1 ou R2, dependendo do tipo de dado.

## 1. Visão do produto

A aplicação será uma comunidade de apoio ao estudo baseada em quizzes. O usuário cria conta, faz login, envia arquivos JSON com perguntas, responde quizzes, acompanha seu progresso, publica seus próprios bancos de questões, segue outros usuários, participa de grupos de estudo e conversa em chats.

O objetivo é unir três experiências:

- **Estudo individual**: responder questões, revisar erros, acompanhar histórico, ver evolução.
- **Gamificação**: pontuação, conquistas, streaks, ranking e metas.
- **Comunidade**: perfis públicos, seguidores, grupos, chat e quizzes compartilhados.

## 2. Funcionalidades principais

### 2.1 Conta, login e perfil

O sistema deve permitir:

- cadastro por email e senha;
- login e logout;
- recuperação de senha;
- perfil público com nome, avatar, bio, estatísticas e quizzes publicados;
- perfil privado com email, preferências, segurança e histórico pessoal;
- configuração de privacidade do perfil e dos quizzes.

Campos sugeridos para o perfil:

- nome de exibição;
- username único;
- foto/avatar;
- bio curta;
- área de estudo;
- links opcionais;
- estatísticas públicas: quizzes respondidos, questões estudadas, acertos, sequência de dias, posição no ranking.

### 2.2 Upload de JSON de quiz

Depois de logado, o usuário poderá enviar um arquivo JSON no formato do projeto atual:

```json
{
  "title": "Banco de Questões de IHC",
  "description": "Questões de múltipla escolha.",
  "questions": [
    {
      "id": 1,
      "topic": "Usabilidade",
      "statement": "O que é eficácia em usabilidade?",
      "options": [
        { "id": "A", "text": "..." },
        { "id": "B", "text": "..." }
      ],
      "answer": "A",
      "explanation": "..."
    }
  ],
  "tags": ["ihc", "usabilidade"]
}
```

Fluxo recomendado:

1. Usuário seleciona o arquivo.
2. Frontend valida tamanho, extensão e JSON válido.
3. Backend valida o schema com Zod.
4. Arquivo original é salvo no R2.
5. Dados normalizados são salvos no D1.
6. Quiz fica como privado por padrão.
7. Usuário pode editar título, descrição, tags e visibilidade.

### 2.3 Responder quizzes

O usuário poderá:

- iniciar um quiz;
- responder uma pergunta por vez;
- navegar entre perguntas;
- salvar progresso automaticamente;
- corrigir ao final ou por questão, conforme o modo escolhido;
- revisar erros;
- refazer somente erradas;
- ver explicações;
- continuar uma tentativa interrompida.

Modos úteis:

- **Prática**: mostra feedback imediato.
- **Simulado**: mostra resultado só no fim.
- **Revisão**: filtra erradas, favoritas ou tópicos específicos.
- **Rápido**: sessão curta com número limitado de questões.

### 2.4 Histórico de estudo

O sistema deve arquivar:

- todo quiz enviado pelo usuário;
- toda tentativa iniciada;
- respostas dadas;
- data e hora de cada resposta;
- acertos, erros e tempo gasto;
- questões revisadas;
- evolução por tópico/tag.

Indicadores importantes:

- questões estudadas hoje;
- questões estudadas por semana/mês;
- taxa de acerto geral;
- taxa de acerto por tag;
- tempo médio por questão;
- sequência de dias estudando;
- erros recorrentes;
- tópicos fracos.

### 2.5 Quizzes públicos e pesquisa

O usuário poderá tornar um quiz público para que outras pessoas usem.

Recursos de descoberta:

- busca por título;
- busca por tags;
- filtros por assunto, autor, popularidade e data;
- ordenação por mais usados, mais recentes e melhor avaliados;
- página pública do quiz com resumo, tags, quantidade de questões, autor e estatísticas.

### 2.6 Social: seguir e seguidores

Funcionalidades mínimas:

- seguir usuário;
- deixar de seguir;
- ver seguidores;
- ver seguindo;
- feed simples com quizzes publicados e conquistas relevantes;
- notificações básicas quando alguém seguir ou usar um quiz público.

### 2.7 Grupos de estudo

Grupos podem ser públicos, privados ou por convite.

Cada grupo deve ter:

- nome;
- descrição;
- avatar/capa;
- membros;
- papéis: dono, moderador e membro;
- quizzes compartilhados;
- chat de texto;
- ranking interno;
- metas coletivas opcionais.

Funcionalidades iniciais:

- criar grupo;
- convidar usuário;
- entrar/sair;
- enviar mensagens;
- compartilhar quiz no grupo;
- ver ranking do grupo.

### 2.8 Chat de texto

O chat deve permitir:

- mensagens em tempo real;
- histórico persistente;
- paginação por mensagens antigas;
- edição ou exclusão de mensagem própria;
- moderação por dono/moderador;
- envio de links para quizzes.

Arquitetura recomendada:

- **Durable Objects** para salas de chat em tempo real;
- **D1** para persistir histórico;
- **Workers** para autenticação, permissões e APIs;
- WebSocket entre frontend e Durable Object.

### 2.9 Chamadas de áudio

Áudio é uma feature mais avançada e deve entrar depois do chat estar estável.

Recomendação:

- usar **WebRTC** para áudio entre usuários;
- usar **Durable Objects** como servidor de sinalização;
- limitar chamadas por grupo pequeno no MVP;
- considerar serviço externo se precisar de salas grandes, gravação ou moderação avançada.

No MVP, mantenha apenas chat de texto. Áudio pode entrar como fase 3.

## 3. Princípios de IHC aplicados

A aplicação deve respeitar princípios de Interação Humano-Computador desde o início.

### 3.1 Visibilidade do estado do sistema

- mostrar progresso do quiz;
- indicar salvamento automático;
- mostrar carregamento e erros claramente;
- exibir se o quiz é privado ou público;
- mostrar status online/offline no chat, se implementado.

### 3.2 Controle e liberdade do usuário

- permitir voltar em perguntas;
- permitir pausar e continuar;
- permitir cancelar upload antes de salvar;
- permitir deixar quiz privado;
- permitir apagar ou despublicar conteúdo próprio.

### 3.3 Prevenção de erros

- validar JSON antes do upload definitivo;
- mostrar preview das questões importadas;
- bloquear publicação se o quiz tiver questões inválidas;
- confirmar ações destrutivas, como excluir quiz ou grupo.

### 3.4 Consistência

- manter os mesmos padrões de botão, feedback e navegação em todo o app;
- usar linguagem clara e direta;
- padronizar tags, cards de quiz, telas de perfil e indicadores.

### 3.5 Reconhecimento em vez de memorização

- mostrar filtros visíveis;
- exibir histórico recente;
- sugerir retomar estudos;
- manter ações frequentes fáceis de encontrar.

### 3.6 Acessibilidade

- contraste adequado;
- navegação por teclado;
- foco visível;
- labels em formulários;
- textos alternativos para imagens;
- layout responsivo;
- não depender apenas de cor para indicar acerto/erro.

## 4. Arquitetura técnica

### 4.1 Stack recomendada

Frontend:

- React;
- TypeScript;
- Vite;
- React Router;
- TanStack Query para cache de API;
- React Hook Form + Zod para formulários;
- Tailwind CSS ou CSS Modules;
- Zustand ou Context API para estado local simples.

Backend/serverless:

- Cloudflare Pages para hospedar o frontend;
- Cloudflare Workers para API;
- Cloudflare D1 como banco SQL;
- Drizzle ORM para schema, migrations e queries;
- Cloudflare R2 para armazenar arquivos JSON originais e avatares;
- Durable Objects para chat em tempo real e futura sinalização WebRTC;
- Cloudflare Queues para tarefas assíncronas, se necessário.

Autenticação:

- opção simples: sessão própria com cookies HTTP-only;
- opção robusta: Better Auth, Lucia Auth ou Auth.js adaptado ao ambiente serverless;
- senhas com hash seguro usando Web Crypto ou biblioteca compatível com Workers.

### 4.2 Estrutura de pastas sugerida

```text
.
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  ├─ components/
│  │  │  ├─ features/
│  │  │  ├─ routes/
│  │  │  ├─ lib/
│  │  │  └─ styles/
│  │  └─ package.json
│  └─ api/
│     ├─ src/
│     │  ├─ routes/
│     │  ├─ db/
│     │  ├─ auth/
│     │  ├─ validators/
│     │  ├─ services/
│     │  └─ durable-objects/
│     ├─ drizzle/
│     ├─ drizzle.config.ts
│     └─ wrangler.toml
├─ packages/
│  └─ shared/
│     ├─ quiz-schema.ts
│     ├─ validators.ts
│     └─ types.ts
└─ package.json
```

Para um projeto menor, também é possível manter `web` e `api` juntos em um único app com Cloudflare Pages Functions.

## 5. Modelo de dados

### 5.1 Tabelas principais

```text
users
- id
- email
- password_hash
- username
- display_name
- bio
- avatar_url
- created_at
- updated_at

sessions
- id
- user_id
- token_hash
- expires_at
- created_at

quizzes
- id
- owner_id
- title
- description
- visibility
- source_file_key
- question_count
- plays_count
- created_at
- updated_at
- published_at

quiz_tags
- quiz_id
- tag_id

tags
- id
- name
- slug

questions
- id
- quiz_id
- external_id
- topic
- statement
- answer
- explanation
- position

question_options
- id
- question_id
- option_key
- text
- position

quiz_attempts
- id
- quiz_id
- user_id
- mode
- status
- score
- correct_count
- wrong_count
- started_at
- finished_at

question_answers
- id
- attempt_id
- question_id
- selected_option
- is_correct
- answered_at
- time_spent_ms

follows
- follower_id
- following_id
- created_at

study_groups
- id
- owner_id
- name
- description
- visibility
- created_at
- updated_at

study_group_members
- group_id
- user_id
- role
- joined_at

study_group_quizzes
- group_id
- quiz_id
- shared_by
- created_at

chat_messages
- id
- group_id
- sender_id
- body
- created_at
- edited_at
- deleted_at

points_events
- id
- user_id
- type
- points
- metadata_json
- created_at

achievements
- id
- key
- title
- description
- points

user_achievements
- user_id
- achievement_id
- unlocked_at
```

### 5.2 Drizzle schema simplificado

```ts
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  visibility: text("visibility", { enum: ["private", "public", "unlisted"] }).notNull(),
  sourceFileKey: text("source_file_key"),
  questionCount: integer("question_count").notNull().default(0),
  playsCount: integer("plays_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  publishedAt: integer("published_at", { mode: "timestamp" }),
});

export const follows = sqliteTable(
  "follows",
  {
    followerId: text("follower_id").notNull().references(() => users.id),
    followingId: text("following_id").notNull().references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.followerId, table.followingId] }),
  }),
);
```

## 6. API proposta

### 6.1 Autenticação

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PATCH /api/me
```

### 6.2 Quizzes

```text
POST   /api/quizzes/upload
GET    /api/quizzes
GET    /api/quizzes/search?query=ihc&tags=usabilidade
GET    /api/quizzes/:id
PATCH  /api/quizzes/:id
DELETE /api/quizzes/:id
POST   /api/quizzes/:id/publish
POST   /api/quizzes/:id/unpublish
```

### 6.3 Tentativas e respostas

```text
POST  /api/quizzes/:id/attempts
GET   /api/attempts/:id
POST  /api/attempts/:id/answers
POST  /api/attempts/:id/finish
GET   /api/me/stats
GET   /api/me/history
```

### 6.4 Perfis e social

```text
GET    /api/users/:username
POST   /api/users/:id/follow
DELETE /api/users/:id/follow
GET    /api/users/:id/followers
GET    /api/users/:id/following
```

### 6.5 Grupos

```text
POST   /api/groups
GET    /api/groups
GET    /api/groups/:id
PATCH  /api/groups/:id
DELETE /api/groups/:id
POST   /api/groups/:id/join
POST   /api/groups/:id/leave
POST   /api/groups/:id/quizzes
GET    /api/groups/:id/messages
```

### 6.6 Chat

```text
GET /api/groups/:id/chat/connect
```

Esse endpoint retorna ou abre uma conexão WebSocket com Durable Object responsável pela sala do grupo.

## 7. Telas principais

### 7.1 Dashboard

Primeira tela depois do login.

Deve mostrar:

- botão para continuar estudo recente;
- estatísticas do dia;
- streak;
- quizzes recentes;
- grupos ativos;
- ranking resumido;
- recomendações por tags.

### 7.2 Biblioteca de quizzes

Tela para encontrar quizzes.

Elementos:

- busca por título;
- filtro por tags;
- cards de quiz;
- indicador de dificuldade ou taxa média de acerto;
- autor;
- botão para iniciar;
- botão para salvar/favoritar.

### 7.3 Upload/importação

Fluxo em etapas:

1. Selecionar JSON.
2. Validar arquivo.
3. Preview: título, descrição, número de questões e tags.
4. Mostrar erros de validação, se existirem.
5. Salvar como privado.
6. Editar metadados.
7. Publicar, se desejar.

### 7.4 Tela de quiz

Deve priorizar foco e legibilidade:

- enunciado claro;
- alternativas com área de clique grande;
- progresso visível;
- navegação anterior/próxima;
- feedback de resposta;
- explicação após correção;
- botão para marcar questão para revisar.

### 7.5 Perfil de usuário

Mostra:

- informações públicas;
- estatísticas;
- quizzes publicados;
- seguidores/seguindo;
- conquistas;
- botão seguir/deixar de seguir.

### 7.6 Grupo de estudo

Mostra:

- cabeçalho do grupo;
- membros;
- ranking interno;
- quizzes compartilhados;
- chat;
- ações de moderação.

## 8. Gamificação

### 8.1 Pontuação

Sugestão inicial:

- +10 pontos por resposta correta;
- +2 pontos por questão respondida;
- +20 pontos por concluir um quiz;
- bônus por sequência diária;
- bônus por publicar quiz usado por outras pessoas;
- bônus por revisar erro e acertar depois.

Evite pontuação que incentive quantidade sem qualidade. O sistema deve valorizar revisão e consistência.

### 8.2 Leaderboard

Rankings possíveis:

- global semanal;
- global mensal;
- por grupo;
- por tag/área;
- entre pessoas seguidas.

Para evitar injustiça:

- preferir ranking semanal/mensal em vez de ranking eterno;
- limitar pontos diários abusivos;
- considerar taxa de acerto e consistência;
- não mostrar apenas competição: mostrar também progresso pessoal.

### 8.3 Conquistas

Exemplos:

- primeira sessão concluída;
- 100 questões respondidas;
- 7 dias seguidos estudando;
- 10 quizzes publicados;
- 50 erros revisados;
- 80% de acerto em uma tag.

## 9. Busca por título e tags

No D1, a busca inicial pode usar `LIKE` com índices simples:

```sql
SELECT *
FROM quizzes
WHERE visibility = 'public'
  AND title LIKE '%' || ? || '%'
ORDER BY plays_count DESC, created_at DESC;
```

Para tags:

```sql
SELECT q.*
FROM quizzes q
JOIN quiz_tags qt ON qt.quiz_id = q.id
JOIN tags t ON t.id = qt.tag_id
WHERE q.visibility = 'public'
  AND t.slug IN (?, ?, ?)
GROUP BY q.id;
```

Quando crescer, considerar:

- Cloudflare D1 FTS5, se disponível no ambiente usado;
- Meilisearch, Typesense ou Algolia;
- índice próprio em tabela auxiliar normalizada.

## 10. Segurança e privacidade

Cuidados obrigatórios:

- senhas com hash forte;
- cookies HTTP-only, Secure e SameSite;
- CSRF se usar cookies em rotas mutáveis;
- validação de entrada com Zod em toda API;
- autorização por recurso: dono do quiz, membro do grupo, moderador;
- rate limit para login, upload, mensagens e busca;
- sanitização de mensagens do chat;
- limite de tamanho para JSON e avatar;
- logs sem dados sensíveis;
- possibilidade de apagar conta e dados pessoais.

## 11. Implementação por fases

### Fase 1: base React e autenticação

- Criar app React com Vite e TypeScript.
- Migrar telas atuais para componentes React.
- Criar rotas: home, login, cadastro, dashboard, quiz.
- Configurar Cloudflare Pages/Workers.
- Configurar D1, Drizzle e migrations.
- Implementar usuários, sessões e perfil básico.

### Fase 2: quizzes persistidos

- Implementar upload de JSON.
- Validar JSON com Zod.
- Salvar arquivo original no R2.
- Salvar quiz, questões e alternativas no D1.
- Criar listagem dos quizzes do usuário.
- Criar fluxo de responder quiz com tentativa e respostas persistidas.
- Criar histórico de estudo e estatísticas básicas.

### Fase 3: publicação e descoberta

- Adicionar visibilidade privado/público/não listado.
- Implementar busca por título e tags.
- Criar páginas públicas de quiz.
- Criar perfis públicos.
- Implementar seguir/deixar de seguir.

### Fase 4: gamificação

- Criar tabela de eventos de pontos.
- Calcular pontuação por resposta, conclusão e streak.
- Criar conquistas.
- Criar leaderboard global e por grupo.
- Criar dashboard de progresso.

### Fase 5: grupos e chat

- Criar grupos de estudo.
- Criar membros e papéis.
- Compartilhar quizzes no grupo.
- Implementar chat com Durable Objects e WebSocket.
- Persistir histórico no D1.

### Fase 6: áudio

- Implementar sinalização WebRTC com Durable Objects.
- Criar sala de áudio por grupo.
- Adicionar controles de microfone, entrada/saída e participantes.
- Avaliar limites de escala e moderação.

## 12. Comandos iniciais sugeridos

Criar projeto React:

```bash
npm create vite@latest apps/web -- --template react-ts
```

Instalar dependências principais:

```bash
npm install @tanstack/react-query react-router-dom zod react-hook-form
npm install -D wrangler drizzle-kit typescript
npm install drizzle-orm
```

Criar banco D1:

```bash
npx wrangler d1 create study-quiz-db
```

Rodar migrations:

```bash
npx drizzle-kit generate
npx wrangler d1 migrations apply study-quiz-db --local
npx wrangler d1 migrations apply study-quiz-db --remote
```

Criar bucket R2:

```bash
npx wrangler r2 bucket create study-quiz-files
```

## 13. Critérios de pronto do MVP

O MVP estará pronto quando:

- usuário consegue criar conta e login;
- usuário consegue enviar JSON válido;
- quiz importado aparece na biblioteca privada;
- usuário consegue responder e finalizar quiz;
- respostas ficam salvas no servidor;
- dashboard mostra questões estudadas, acertos e histórico;
- usuário consegue publicar quiz;
- outro usuário consegue pesquisar e usar quiz público;
- interface é responsiva, acessível e consistente.

## 14. Prioridade recomendada

Para evitar um projeto grande demais logo no início, a ordem mais saudável é:

1. Migrar o quiz atual para React mantendo comportamento existente.
2. Adicionar autenticação.
3. Persistir quizzes e respostas no D1.
4. Implementar upload real de JSON.
5. Criar dashboard de progresso.
6. Publicar e pesquisar quizzes.
7. Adicionar social simples.
8. Adicionar grupos.
9. Adicionar chat.
10. Avaliar áudio.

Assim, a aplicação cresce sem perder o núcleo: ajudar o usuário a estudar melhor.
