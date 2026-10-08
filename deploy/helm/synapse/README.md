# Synapse Helm chart

This chart deploys the current workload boundary to Kubernetes:

- AWS Load Balancer Controller ingress → Nginx
- Nginx → Next.js app
- Next.js app → Neon PostgreSQL, Redis, and OpenRouter
- BullMQ worker → Redis, Neon PostgreSQL, and OpenRouter
- Redis StatefulSet with optional persistent storage

## Build and tag the application image

The Next.js app and worker use the same image. Tag it with an immutable commit
identifier for deployments and optionally add an environment tag for convenience:

```bash
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=000000000000
export ECR_REPOSITORY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/synapse"
export IMAGE_TAG="$(git rev-parse --short=12 HEAD)"

docker build -t "$ECR_REPOSITORY:$IMAGE_TAG" .
docker tag "$ECR_REPOSITORY:$IMAGE_TAG" "$ECR_REPOSITORY:dev"
```

The ECR repository and push workflow are documented in
[`docs/github-actions.md`](../../../docs/github-actions.md). Do not put AWS
credentials or application secrets in this chart.

## Configure secrets

Create a Secret in the target namespace using your secret manager or a local
command. The chart expects these keys when they are used by the workload:

- `DATABASE_URL`
- `OPENROUTER_API_KEY`
- `LLM_API_KEY` (optional; empty means the OpenRouter key fallback is used)
- `EMBEDDING_API_KEY` (optional; empty means the OpenRouter key fallback is used)

Pass its name with `--set secrets.existingSecret=synapse-secrets`. The default
values never create or print a Secret.

## Render or install

```bash
helm lint deploy/helm/synapse -f deploy/helm/synapse/values-dev.yaml

helm template synapse deploy/helm/synapse \
  --namespace synapse-dev \
  -f deploy/helm/synapse/values-dev.yaml \
  --set image.repository="$ECR_REPOSITORY" \
  --set image.tag="$IMAGE_TAG" \
  --set secrets.existingSecret=synapse-secrets
```

Use the same overrides with `helm upgrade --install` after the EKS cluster and
AWS Load Balancer Controller are ready.
