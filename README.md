# 🧠 Synapse

> AI-powered knowledge workspace — combining note-taking, semantic search, and real-time AI assistance.

Synapse is a full-stack, production-style SaaS application inspired by tools like Notion and ChatGPT. It allows users to create, organize, and interact with their knowledge using AI.

---

## 🚀 Features

* ✍️ Rich note-taking & knowledge management
* 🤖 AI-powered chat & document assistance (Groq API)
* 🔍 Semantic search using vector embeddings (pgvector)
* ⚡ Real-time updates with WebSockets
* 🧠 Context-aware AI responses from user data
* 📦 Background processing with job queues
* 🚀 Optimized performance using caching

---

## 🧱 Tech Stack

### 🖥️ Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Zustand (state management)

### ⚙️ Backend

* Next.js API Routes (or Node.js service)
* tRPC (optional)
* Zod (schema validation)

### 🤖 AI Layer

* Groq API (LLM inference + streaming)

### 🗄️ Database

* PostgreSQL (Neon)
* Drizzle (orm)
* pgvector (vector similarity search)


### ⚡ Caching & Queue

* Redis (Upstash)
* BullMQ (background jobs & workers)

### 🔌 Real-Time

* WebSockets / Socket.IO

### 🔐 Authentication

* NextAuth / Clerk

### 🐳 DevOps

* Docker
* Docker Compose

---

## 🧠 Architecture Overview

Client (Next.js)
↓
API Layer
↓
Service Layer
├── AI Service (Groq)
├── Database Service (PostgreSQL)
├── Cache Layer (Redis)
├── Queue System (BullMQ)
↓
Infrastructure (Neon + Redis)

---

## 🔁 Core Workflows

### 📝 Note Processing

1. User creates a note
2. Stored in PostgreSQL
3. Background job generates embeddings
4. Stored using pgvector

---

### 🤖 AI Query Flow

1. User asks a question
2. Relevant notes retrieved via vector search
3. Context sent to Groq API
4. Response streamed back in real-time

---

## 🛠️ Setup (Local Development)

```bash
# clone repo
git clone https://github.com/your-username/synapse.git

cd synapse

# install deps
npm install

# run dev server
npm run dev
```

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
DATABASE_URL=
REDIS_URL=
GROQ_API_KEY=
NEXTAUTH_SECRET=
```

---

## 🐳 Docker (optional)

```bash
docker-compose up --build
```

---

## 📈 Future Improvements

* Multi-tenant workspaces
* Role-based access control
* Collaborative editing
* AI agents & automation
* Advanced caching strategies

---

## 🤝 Contributing

This is a personal portfolio project, but suggestions and feedback are welcome.

---

## 📜 License

MIT License

---

## ⭐ Acknowledgements

Inspired by modern AI-native tools like Notion, ChatGPT, and knowledge graphs.
