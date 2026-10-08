# Synapse

Synapse is a context-first chat arcade. Add text or upload `.txt`, `.md`, PDF, or `.docx` files, then chat with an assistant grounded in that context.

## Product shape

The app intentionally has only two pages:

- `/` — the arcade-themed context console for pasting text, uploading files, and managing memory.
- `/chat` — the chat console with loaded context visible beside the conversation.

There are no accounts, workspaces, projects, workflows, or custom server layer.

## Architecture

```text
Browser → Nginx → Next.js App Router → Postgres
                              ├──────→ Redis → embedding worker
                              └──────→ OpenRouter-compatible AI APIs
```

- Next.js App Router serves the UI and route handlers.
- Nginx is the local reverse proxy and the future Kubernetes ingress edge.
- Postgres stores context items, embeddings, and chat messages.
- Redis and BullMQ process context embeddings asynchronously.
- Redis uses AOF persistence in Compose; embedding jobs retry four times with exponential backoff, retain recent failures for inspection, and are processed by a gracefully shutting-down worker with configurable concurrency.
- The RAG pipeline chunks each document with overlap, stores character offsets and source metadata, and embeds each chunk independently.
- Retrieval returns diverse chunk-level matches with source references. If embeddings are pending, unavailable, rate-limited, or over quota, it switches to weighted keyword search and reports the degraded mode.
- Context items expose `pending`, `processing`, `completed`, and `failed` embedding status so indexing failures are visible instead of silently disappearing.
- Chat uses OpenRouter's OpenAI-compatible API. The default `openrouter/free` route selects an available free chat model; the model and endpoint are configurable.

## Local setup

1. Copy `.env.example` to `.env`.
2. Add the fresh development `DATABASE_URL`.
3. Create an OpenRouter API key and set `OPENROUTER_API_KEY` (or the separate `LLM_API_KEY` and `EMBEDDING_API_KEY` variables).
4. The default embedding route is NVIDIA's free `nvidia/nemotron-3-embed-1b:free` model with 2,048 dimensions. OpenRouter free routes are rate-limited and their availability can change.
5. Tune `EMBEDDING_WORKER_CONCURRENCY` if the embedding provider allows more or fewer concurrent requests.

Apply the migrations before starting the app against an existing database:

```bash
npm run db:migrate
```

The latest migration changes the vector dimension for the OpenRouter embedding model and marks stored context as pending. Existing vectors are intentionally discarded because vectors from different embedding models cannot be mixed; pending contexts are re-indexed when their embedding jobs are queued again.

OpenRouter's free routes are rate-limited and model availability can change. Do not send confidential or personal data to free provider endpoints.

Install and run the app directly:

```bash
npm install
npm run dev
```

Run the worker separately when using Redis:

```bash
npm run worker
```

Run the automated checks:

```bash
npm test
npm run lint
npx tsc --noEmit
```

## Docker Compose

Compose runs Nginx, the standalone Next.js image, the context embedding worker, and Redis:

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). Nginx is the only exposed application service.

### Hosted inference fallback

Hosted inference still depends on provider availability and rate limits. A `402` or quota response marks semantic retrieval as quota-limited and activates keyword retrieval; a `429` response reports rate limiting and does the same. If the chat provider is unavailable, Synapse stores a local response with the retrieval sources and a warning instead of failing the request entirely.

## Useful scripts

```bash
npm run dev
npm run worker
npm run build
npm run start
npm run lint
```

## Next deployment targets

The container boundaries map directly to the planned EKS deployment: AWS Load Balancer Controller ingress, Nginx, the Synapse app, the context embedding worker, and Redis. The initial deployment configuration lives in `deploy/helm/synapse` with separate development and staging values. ECR image publishing, EKS bootstrap, and GitHub Actions delivery will build on this chart.

The manual EKS bootstrap and deployment sequence is documented in [`deploy/eks/README.md`](deploy/eks/README.md).

ArgoCD/GitOps, infrastructure-as-code, managed Redis, security hardening, advanced observability, disaster recovery, and multi-region deployment are intentionally deferred.
