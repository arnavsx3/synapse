# Synapse architecture

## Workload path

```text
User
  │
  ▼
Route 53 alias
  │
  ▼
AWS Application Load Balancer
  │  AWS Load Balancer Controller creates this from the Helm Ingress
  ▼
Nginx
  │
  ▼
Next.js app ───────────────► Neon PostgreSQL
  │                              (external managed database)
  ├────────────────────────► OpenRouter
  │                              (chat and embeddings)
  ▼
Redis ◄──────────────────── BullMQ embedding worker
  (EKS StatefulSet)             (same Synapse image)
```

## Kubernetes workload boundaries

The Helm chart deploys four workload components:

| Component | Kubernetes resource | Image source | Responsibility |
| --- | --- | --- | --- |
| Nginx | Deployment and Service | Docker Hub: `nginx:1.27-alpine` | Public HTTP edge and reverse proxy |
| Next.js app | Deployment and Service | ECR: `synapse:<tag>` | UI, API routes, RAG retrieval, and chat |
| BullMQ worker | Deployment | ECR: `synapse:<tag>` | Asynchronous context embedding jobs |
| Redis | StatefulSet and Service | Docker Hub: `redis:7-alpine` | Queue backend and AOF-persisted job state |

The app and worker deliberately use the same ECR image. Redis and Nginx use
their upstream public images; they are not built by the Synapse image workflow.

## Data and provider boundaries

- Neon PostgreSQL stores contexts, chunks, embeddings, and chat messages.
- pgvector stores 2,048-dimensional embeddings produced by
  `nvidia/nemotron-3-embed-1b:free` through OpenRouter.
- OpenRouter serves both the `openrouter/free` chat route and embeddings.
- `LLM_API_KEY` and `EMBEDDING_API_KEY` may remain empty because the app falls
  back to `OPENROUTER_API_KEY`.
- Redis is internal to the cluster and is not exposed through the Ingress.

## AWS components

| Component | Current value or purpose |
| --- | --- |
| Region | `us-east-1` |
| ECR repository | `synapse` |
| EKS cluster | `synapse-dev` |
| Kubernetes namespace | `synapse-dev` |
| Cluster networking | IPv4, default VPC, public and private API endpoint |
| Ingress | AWS Load Balancer Controller with an internet-facing ALB |
| DNS | Route 53 alias record to the ALB |
| Database | Neon PostgreSQL, external to AWS |

## Deliberate portfolio trade-offs

This is a development-oriented cluster. The control-plane logs and optional
network monitoring are disabled to control cost. The public API endpoint is
currently open for bootstrap access, and the project does not yet include
security hardening, advanced observability, disaster recovery, or multi-region
design.
