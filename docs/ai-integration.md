# AI / RAG integration

The API is designed so external AI systems can retrieve quiz content and
ground answers on it (retrieval-augmented generation).

## Discovery

- `GET /llms.txt` — machine-readable entry point (llms.txt convention)
  describing the app and pointing agents to the endpoints below.
- `GET /openapi.json` — full OpenAPI spec, generated from the route code.
- `GET /docs` — Swagger UI for humans.

## Retrieval endpoints

| Endpoint | Use |
| --- | --- |
| `GET /api/quizzes/search?q=<query>` | lexical retrieval over public quizzes |
| `GET /api/quizzes/:id` | structured quiz JSON (questions, options, answers, explanations) |
| `GET /api/quizzes/:id/export` | normalized export for ingestion pipelines |
| `GET /api/quizzes/:id/export?format=markdown` | Markdown rendering, one `##` section per question — chunks cleanly for embeddings |
| `GET /share/quizzes/:id` | HTML with JSON-LD `Quiz` schema for crawlers |

Authorization mirrors the app: public quizzes are readable anonymously,
private quizzes only with the owner's session cookie. RAG pipelines indexing
content anonymously therefore only ever see published material.

## Recommended ingestion flow

1. Enumerate public quizzes via `/api/quizzes/search`.
2. Fetch `/api/quizzes/:id/export?format=markdown`.
3. Chunk by `##` heading (one question per chunk keeps the statement, all
   options, the answer and the explanation together — self-contained context).
4. Store the chunk with metadata: quiz id, title, tags, author, question index.
5. Cite `/share/quizzes/:id` as the canonical source URL.

## Future work (not implemented)

- Semantic search with Cloudflare **Vectorize** + **Workers AI** embeddings:
  embed question chunks on upload (`quizService.import`), query at search
  time, and blend with the current lexical search.
- A quiz-generation endpoint (AI drafts a quiz from user notes) following the
  same architecture recipe: contract → service → route.
