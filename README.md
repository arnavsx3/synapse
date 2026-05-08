# Synapse

Synapse is a full-stack knowledge workspace that combines notes, projects, semantic retrieval, AI chat, background processing, and realtime updates in one app. The project began as a learning-first SaaS sandbox and has gradually grown into a broader systems-learning playground.

## Overview

Synapse is built around a workspace model where users can organize projects and notes, then use AI features on top of that data. The app now includes:

- authentication and protected routes
- workspace, project, note, and chat flows
- semantic note retrieval with embeddings
- AI chat grounded in user data
- background jobs for embedding generation
- realtime updates with Socket.IO
- Docker-based orchestration for the local runtime services

## Current Scope

The repo now spans much more than the early setup phases. In practical terms, it includes:

- Next.js App Router frontend
- custom Node server for Next.js plus Socket.IO
- Drizzle ORM with Neon Postgres
- pgvector-based note embeddings
- BullMQ worker processing
- Redis-backed queue and pub/sub behavior
- Groq-powered assistant responses
- Docker Compose for local orchestration of app, worker, and Redis

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand

### Backend And Infra

- Next.js route handlers
- custom Node HTTP server
- Drizzle ORM
- Neon Postgres
- pgvector
- Redis
- BullMQ
- Socket.IO
- Docker
- Docker Compose

### AI

- Groq API
- external embedding API

## Architecture

The app uses a custom server in [server.ts](/D:/PROJECTS/synapse/server.ts:1) so the HTTP layer and Socket.IO server run together. Background embedding work is processed separately by [worker/note-embedding-worker.ts](/D:/PROJECTS/synapse/worker/note-embedding-worker.ts:1). Redis is used for BullMQ jobs and Redis-backed realtime messaging. PostgreSQL is currently provided by Neon, and note embeddings are stored with `pgvector`.

## Authentication Note

This repo intentionally uses a mixed auth approach:

- Google OAuth uses NextAuth
- email/password auth uses custom API routes and manual database session creation

This is an intentional learning tradeoff rather than an accidental inconsistency. The current setup keeps the important auth ideas visible without blocking progress on the rest of the stack.

## Main Runtime Pieces

The app currently has three local runtime services:

1. `app`
   Serves the UI, API routes, auth flow, and Socket.IO connection.

2. `worker`
   Processes note embedding jobs in the background.

3. `redis`
   Supports BullMQ and Redis-based realtime behavior.

Postgres is not containerized in the current setup. The app still connects to Neon through `DATABASE_URL`.

## Scripts

```bash
npm run dev
npm run worker
npm run build
npm run start
npm run lint
```

## Environment Variables

Create a `.env` file in the project root and provide values for:

```env
DATABASE_URL=
REDIS_URL=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GROQ_API_KEY=
EMBEDDING_API_URL=
EMBEDDING_API_KEY=
EMBEDDING_DIMENSIONS=384
```

### Notes

- In the current Docker setup, `DATABASE_URL` should still point to Neon.
- Inside Docker Compose, Redis is addressed as `redis://redis:6379`.
- `AUTH_TRUST_HOST=true` is used for the containerized app service so Auth.js trusts the local host header.

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Run the worker in a separate terminal:

```bash
npm run worker
```

Make sure Redis and your required environment variables are available before testing queue, embedding, AI, or realtime flows.

## Docker Setup

This repo includes a first-pass Docker setup focused on local orchestration rather than full infrastructure replacement.

### What Docker Runs

- `synapse-app`
- `synapse-worker`
- `synapse-redis`

### What Stays External

- Neon Postgres
- external AI and embedding providers

### Start The Stack

From the project root:

```bash
docker compose up --build
```

### Stop The Stack

```bash
docker compose down
```

### Useful Commands

```bash
docker compose up --build
docker compose down
docker compose logs -f app
docker compose logs -f worker
docker compose logs -f redis
```

### What A Healthy Docker Run Looks Like

You should be able to confirm that:

- the app opens at `http://localhost:3000`
- login works
- protected routes remain accessible
- editing a note triggers an embedding job
- the worker logs show `Embedding job completed: ...`
- realtime socket connections join successfully

## Core Flow

The main end-to-end flow in this repo looks like this:

1. a user creates or updates a note
2. the note is stored in Postgres
3. the app enqueues an embedding job through Redis and BullMQ
4. the worker generates and stores the embedding
5. assistant requests retrieve relevant notes semantically
6. Groq receives grounded context and returns the response

## Why This Repo Exists

Even though the app now includes several production-style parts, this project is still primarily a learning workspace. The goal is to understand how the pieces fit together, iterate phase by phase, and keep tradeoffs visible rather than pretending the project is optimized for purity above learning value.

## License

MIT
