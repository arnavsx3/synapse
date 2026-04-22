# Note To Self

## Working Rule
This project exists primarily for learning and exploring tech stacks step by step.

Because of that:
- Do **not** modify the codebase by default.
- Do **not** refactor, fix, or implement anything unless I explicitly ask for it.
- Treat the repo as a learning workspace first, not a production app first.
- When helping, prefer:
  - explaining the current state,
  - mapping features to architecture,
  - suggesting next milestones,
  - identifying gaps between intent and implementation,
  - outlining implementation plans without making changes.

If code changes are ever requested, keep them tightly scoped to the exact learning goal.

---

# Project Phases

## Phase 1: Foundation Setup
### Aim
Establish the base app structure and get comfortable with the full-stack project skeleton.

### Focus
- Next.js app setup
- TypeScript project structure
- Tailwind styling basics
- App Router layout/pages
- Basic local development workflow

### Tech Stack
- Next.js
- React
- TypeScript
- Tailwind CSS

### Outcome
A working app shell with pages, layouts, and a clean frontend foundation.

---

## Phase 2: Authentication & User Access
### Aim
Learn how authentication works in a modern SaaS-style application.

### Focus
- User signup/login flow
- Session handling
- Protected routes
- OAuth provider integration
- Auth-related database tables

### Tech Stack
- NextAuth
- Google OAuth
- Custom auth API routes
- Drizzle ORM
- PostgreSQL / Neon
- bcryptjs

### Outcome
Users can create accounts, log in, and access protected dashboard pages.

---

## Phase 3: Core Workspace CRUD
### Aim
Build the actual knowledge workspace foundation with projects and notes.

### Focus
- Create/read/update/delete for notes
- Create/read/update/delete for projects
- Organizing notes by project/inbox
- Dashboard UI state management
- Client-server data flow

### Tech Stack
- Next.js App Router
- Next.js Route Handlers / API routes
- React Query
- Zustand
- Zod
- Drizzle ORM
- PostgreSQL / Neon

### Outcome
A functioning notes/projects workspace MVP.

---

## Phase 4: Data Modeling & Validation
### Aim
Learn how to structure backend data safely and predictably.

### Focus
- Relational schema design
- User-project-note relationships
- Validation of API inputs
- Safe request/response handling
- Ownership and authorization checks

### Tech Stack
- Drizzle ORM
- PostgreSQL
- Zod

### Outcome
A cleaner and more reliable backend contract.

---

## Phase 5: AI Integration
### Aim
Introduce LLM-powered workflows into the workspace.

### Focus
- Chat or assistant UI
- Prompt construction
- Sending workspace context to the model
- Streaming model responses
- Understanding how AI features fit into product UX

### Tech Stack
- Groq API
- Next.js API routes / server logic
- React frontend for chat UI

### Outcome
Users can ask questions and receive AI-generated responses.

---

## Phase 6: Context-Aware AI
### Aim
Make AI responses grounded in the user’s own notes instead of generic model output.

### Focus
- Retrieving relevant notes
- Injecting note context into prompts
- Designing context windows carefully
- Improving quality of AI answers with user data

### Tech Stack
- Groq API
- PostgreSQL queries
- Server-side prompt assembly

### Outcome
AI becomes meaningfully useful inside the workspace.

---

## Phase 7: Semantic Search & Embeddings
### Aim
Learn retrieval-based AI patterns using vector search.

### Focus
- Generating embeddings for notes
- Storing embeddings in the database
- Similarity search
- Retrieval-augmented querying
- Note discovery beyond keyword match

### Tech Stack
- pgvector
- PostgreSQL
- Embedding model/provider
- Drizzle or SQL for vector queries

### Outcome
Relevant notes can be retrieved semantically for search and AI workflows.

---

## Phase 8: Background Jobs & Async Processing
### Aim
Learn how production-style apps offload heavier work.

### Focus
- Running embedding generation asynchronously
- Handling delayed/background tasks
- Separating request/response work from processing work
- Worker architecture

### Tech Stack
- Redis / Upstash
- BullMQ
- Background workers

### Outcome
Expensive tasks like embedding generation happen outside the main request cycle.

---

## Phase 9: Real-Time Features
### Aim
Learn how live updates work in collaborative or interactive apps.

### Focus
- Real-time note/chat updates
- WebSocket lifecycle
- Event-based updates
- Syncing client UI with server-side events

### Tech Stack
- WebSockets
- Socket.IO or equivalent real-time transport

### Outcome
The app can push updates live instead of relying only on refetching.

---

## Phase 10: Performance & Caching
### Aim
Understand how to optimize full-stack app responsiveness.

### Focus
- Reducing repeated expensive reads
- Caching hot queries
- Smarter invalidation
- Improving perceived app speed

### Tech Stack
- Redis / Upstash
- React Query caching
- Server-side caching patterns

### Outcome
The app becomes faster and more production-like.

---

## Phase 11: DevOps & Local Infrastructure
### Aim
Learn how to package and run the stack more like a real deployment.

### Focus
- Containerizing services
- Local environment consistency
- Multi-service orchestration
- Environment variable management

### Tech Stack
- Docker
- Docker Compose

### Outcome
The app and supporting services can run in a repeatable environment.

---

## Phase 12: Advanced SaaS Features
### Aim
Explore more advanced architecture once the fundamentals are understood.

### Focus
- Multi-tenant workspaces
- Role-based access control
- Collaborative editing
- Agents and automations
- Stronger caching strategies

### Tech Stack
- Depends on the feature
- Likely builds on auth, DB, AI, queues, realtime, and caching layers

### Outcome
The project evolves from a learning MVP into a deeper systems-learning sandbox.

---

# Current Reality Check

At the moment, the project mainly covers:
- foundational setup,
- authentication basics,
- database-backed notes/projects CRUD,
- client state and API integration.

The following are mostly still future phases:
- AI chat,
- context-aware AI,
- semantic/vector search,
- background jobs,
- Redis caching,
- realtime systems,
- Dockerized infra.

So the repo currently aligns most strongly with:
- Phase 1
- Phase 2
- Phase 3
- part of Phase 4

---

# How To Help On This Repo

When assisting on this project:
- first identify which phase the current task belongs to,
- explain the concept and purpose of that phase,
- keep recommendations aligned with the learning goal,
- avoid changing code unless explicitly asked,
- prefer phased roadmaps over broad “production-grade” rewrites.

---
