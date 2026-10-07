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
                              └──────→ hosted Llama-compatible API
```

- Next.js App Router serves the UI and route handlers.
- Nginx is the local reverse proxy and the future Kubernetes ingress edge.
- Postgres stores context items, embeddings, and chat messages.
- Redis and BullMQ process context embeddings asynchronously.
- Redis uses AOF persistence in Compose; embedding jobs retry four times with exponential backoff, retain recent failures for inspection, and are processed by a gracefully shutting-down worker with configurable concurrency.
- Retrieval uses vector similarity when embeddings are available, with a keyword fallback for local development.
- Chat uses the open-weight `TinyLlama/TinyLlama-1.1B-Chat-v1.0` model through Hugging Face's OpenAI-compatible endpoint; the model and endpoint are configurable.

## Local setup

1. Copy `.env.example` to `.env`.
2. Add the fresh development `DATABASE_URL`.
3. Add an `LLM_API_KEY` with Hugging Face Inference Providers permission.
4. Add the same token as `EMBEDDING_API_KEY`; the default embedding model is the Apache-2.0 `sentence-transformers/all-MiniLM-L6-v2` with 384 dimensions.
5. Tune `EMBEDDING_WORKER_CONCURRENCY` if the embedding provider allows more or fewer concurrent requests.

The models are free/open-weight to use under their respective licenses, but hosted inference requests can still consume Hugging Face/provider quota.

Install and run the app directly:

```bash
npm install
npm run dev
```

Run the worker separately when using Redis:

```bash
npm run worker
```

## Docker Compose

Compose runs Nginx, the standalone Next.js image, the context embedding worker, and Redis:

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). Nginx is the only exposed application service.

## Useful scripts

```bash
npm run dev
npm run worker
npm run build
npm run start
npm run lint
```

## Next deployment targets

The container boundaries map directly to the planned EKS deployment: Nginx ingress, Synapse app, context embedding worker, and Redis. Kubernetes manifests and ArgoCD GitOps configuration will follow after the local core is stable.
