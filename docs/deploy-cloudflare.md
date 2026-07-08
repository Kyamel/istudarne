# Deploying to Cloudflare

This guide explains how to deploy the new Istudarne app to Cloudflare using:

* **Cloudflare Workers** for the Hono backend, SSR landing page, and sharing routes;
* **Worker Static Assets** for the React SPA;
* **Cloudflare D1** for relational data;
* **Cloudflare R2** for the original JSON files uploaded by users;
* **Durable Objects** as the foundation for real-time chat;
* **GitHub Actions** for automatic deployment.

Useful official resources:

* Workers with GitHub Actions: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
* D1 commands in Wrangler: https://developers.cloudflare.com/d1/wrangler-commands/
* Wrangler commands: https://developers.cloudflare.com/workers/wrangler/commands/

## 1. Install dependencies

In the project directory, run:

```bash
npm install
```

Make sure the application builds successfully locally:

```bash
npm run typecheck
npm run build
```

## 2. Log in to Cloudflare locally

```bash
npx wrangler login
```

Then confirm your account:

```bash
npx wrangler whoami
```

## 3. Create the D1 database

Create the remote database:

```bash
npx wrangler d1 create istudarne-db
```

The command returns something similar to:

```toml
[[d1_databases]]
binding = "DB"
database_name = "istudarne-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy the returned `database_id` and replace the placeholder in [wrangler.jsonc](/home/lucas/dev/web/istudarne/wrangler.jsonc):

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "istudarne-db",
    "database_id": "PASTE_THE_DATABASE_ID_HERE"
  }
]
```

## 4. Create the R2 bucket

Create the bucket used to store the original JSON files:

```bash
npx wrangler r2 bucket create istudarne-quiz-files
```

The name must match the binding in [wrangler.jsonc](/home/lucas/dev/web/istudarne/wrangler.jsonc):

```jsonc
"r2_buckets": [
  {
    "binding": "QUIZ_FILES",
    "bucket_name": "istudarne-quiz-files"
  }
]
```

## 5. Apply migrations to the remote D1 database

The migrations are located in [migrations/](/home/lucas/dev/web/istudarne/migrations).

To apply them to the remote database:

```bash
npm run db:migrate:remote
```

To test them locally:

```bash
npm run db:migrate:local
```

## 6. Deploy manually for the first time

After configuring D1 and R2, run:

```bash
npm run deploy
```

This script executes:

```bash
npm run build
wrangler deploy
```

When it finishes, Wrangler displays the Worker URL, usually in the following format:

```text
https://istudarne.YOUR_SUBDOMAIN.workers.dev
```

Important routes:

```text
/                       SSR landing page
/app                    React SPA
/docs                   Swagger UI
/openapi.json           OpenAPI specification
/api/health             Health check
/share/quizzes/:quizId  SSR sharing page
```

## 7. Configure automatic deployment on GitHub

The workflow in [.github/workflows/deploy-cloudflare.yml](/home/lucas/dev/web/istudarne/.github/workflows/deploy-cloudflare.yml) expects two secrets:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

On GitHub:

1. Open the repository.
2. Go to **Settings > Secrets and variables > Actions**.
3. Click **New repository secret**.
4. Create `CLOUDFLARE_ACCOUNT_ID`.
5. Create `CLOUDFLARE_API_TOKEN`.

## 8. Create the Cloudflare API token

In Cloudflare:

1. Open the Cloudflare dashboard.
2. Go to **My Profile > API Tokens** or **Account API Tokens**.
3. Click **Create Token**.
4. Use a custom token or the Workers editing template.
5. Restrict the token to the correct account.

Recommended permissions for this project:

```text
Account - Workers Scripts - Edit
Account - D1 - Edit
Account - Workers Tail - Read
Account - Account Settings - Read
Account - R2 Storage - Edit
```

If you plan to use a custom domain managed through Cloudflare, also add the required zone permissions for that domain.

Never place the token directly in the repository. Store it only in GitHub Secrets.

## 9. How the workflow works

Whenever changes are pushed to `main`, the workflow:

1. installs dependencies using `npm ci`;
2. runs `npm run typecheck`;
3. runs `npm run build`;
4. applies remote migrations using `npm run db:migrate:remote`;
5. deploys the Worker using `npx wrangler deploy`.

You can also run it manually from the **Actions** tab using `workflow_dispatch`.

## 10. Custom domain

After the Worker has been deployed:

1. Open the Cloudflare dashboard.
2. Go to **Workers & Pages**.
3. Select the `istudarne` Worker.
4. Go to **Settings > Domains & Routes**.
5. Add a domain or route.

Examples:

```text
istudarne.com/*
app.istudarne.com/*
```

When using a custom domain, review the public URL used in sharing links.

## 11. Production checklist

Before making the application available to real users:

* replace the `database_id` placeholder in `wrangler.jsonc`;
* confirm that the R2 bucket exists;
* apply remote migrations;
* test `/api/health`;
* test JSON uploads;
* test `/share/quizzes/:quizId`;
* configure real authentication and session secrets;
* review the GitHub Actions token permissions;
* enable a custom domain, when applicable.
