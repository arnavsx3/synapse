# Synapse documentation

Synapse is a small RAG workload used to demonstrate a containerised AWS and
Kubernetes delivery path. The application is intentionally simple; the main
portfolio focus is the path from source code to a tested image in Amazon ECR
and a Helm-managed deployment on Amazon EKS.

## Start here

- [Architecture](architecture.md) — application and AWS component relationships.
- [GitHub Actions, ECR, and EKS](github-actions.md) — CI checks, OIDC
  authentication, image tags, namespace-scoped deployment, and rollouts.
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
| EKS cluster | `synapse-dev` is active in `us-east-1` with one healthy managed node |
| Load Balancer Controller | Installed with Helm and EKS Pod Identity; deployment is `2/2` Ready |
| Helm workload deployment | Automated on successful pushes to `main` with an immutable ECR commit-SHA image |
| Route 53 and custom DNS | Hosted zone and ALB alias configured for `synapes-dev.online` |
| Workload and node autoscaling | HPA plus Cluster Autoscaler enabled for development |

## Scope boundaries

Included: Amazon ECR, Amazon EKS, Kubernetes manifests, Helm, Neon PostgreSQL,
AWS Load Balancer Controller, Route 53, workload/node autoscaling, and GitHub
Actions deployment automation.

Deferred: HTTPS/ACM, ArgoCD/GitOps, Terraform/OpenTofu, RDS, ElastiCache,
security hardening, disaster recovery, advanced observability, and multi-region
deployment.

Never commit `.env`, database URLs, API keys, Kubernetes Secret values, or AWS
access keys. Use placeholders in documentation and create runtime Secrets
outside Git.
