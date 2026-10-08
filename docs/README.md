# Synapse documentation

Synapse is a small RAG workload used to demonstrate a containerised AWS and
Kubernetes delivery path. The application is intentionally simple; the main
portfolio focus is the path from source code to a tested image in Amazon ECR
and a Helm-managed deployment on Amazon EKS.

## Start here

- [Architecture](architecture.md) — application and AWS component relationships.
- [GitHub Actions and ECR](github-actions.md) — CI checks, OIDC authentication,
  image tags, and the current delivery boundary.
- [EKS deployment](eks-deployment.md) — cluster prerequisites, add-ons, node
  group, Load Balancer Controller, secrets, Helm, and Route 53.
- [Environment values](environments.md) — development and staging conventions.

The lower-level chart reference remains in
[`deploy/helm/synapse/README.md`](../deploy/helm/synapse/README.md), and the
step-by-step AWS bootstrap runbook remains in
[`deploy/eks/README.md`](../deploy/eks/README.md).

## Current delivery status

| Area | Status |
| --- | --- |
| Application container image | Built by the repository Dockerfile |
| GitHub Actions validation | Enabled for pull requests and pushes to `main` |
| Amazon ECR publishing | Enabled for successful pushes to `main` |
| EKS cluster | Configured in the AWS Console; creation and activation are the next manual step |
| Helm workload deployment | Manual bootstrap first; automation follows after validation |
| Route 53 and custom DNS | Planned after the ALB has a stable hostname |

## Scope boundaries

Included: Amazon ECR, Amazon EKS, Kubernetes manifests, Helm, Neon PostgreSQL,
AWS Load Balancer Controller, Route 53, and GitHub Actions.

Deferred: ArgoCD/GitOps, Terraform/OpenTofu, RDS, ElastiCache, security
hardening, disaster recovery, advanced observability, and multi-region
deployment.

Never commit `.env`, database URLs, API keys, Kubernetes Secret values, or AWS
access keys. Use placeholders in documentation and create runtime Secrets
outside Git.
