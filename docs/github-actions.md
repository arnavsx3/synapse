# GitHub Actions and Amazon ECR

The workflow is defined in
[`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml). GitHub Actions
is the hosted automation runner; it is conceptually similar to a Jenkinsfile,
but the workflow, triggers, jobs, and steps live in a repository YAML file.

## Workflow triggers

```text
Pull request → main
  └─ validate

Push → main
  ├─ validate
  └─ publish-image (only after validate succeeds)
```

The workflow uses a concurrency group so a newer run can cancel an older run
for the same branch or pull request.

## Validation job

The `validate` job runs on a temporary GitHub-hosted Ubuntu runner. The runner
checks out the repository, installs the locked npm dependencies, and runs:

```text
npm test
npm run lint
npx tsc --noEmit
npm run build
```

The runner is temporary. It is not an EC2 instance owned by Synapse, and the
Docker image is not left on the user's laptop. GitHub may retain configured
workflow cache data, but the runner itself is discarded after the job.

## ECR publishing job

The `publish-image` job runs only on a push to `main`, and only after
`validate` succeeds. It:

1. Requests a short-lived AWS session through GitHub's OIDC identity token.
2. Assumes the `synapse-github-actions-ecr` IAM role.
3. Logs in to the private ECR repository.
4. Builds the root `Dockerfile` with Docker Buildx.
5. Pushes the same image under two tags:
   - the full Git commit SHA, for immutable deployments;
   - `latest`, for convenience during development.
6. Uses GitHub Actions cache storage to speed up later Docker builds.

The ECR image may appear as an image index, an image, and a small BuildKit
attestation record. Those records represent one build, not separate Synapse,
Redis, and Nginx services.

## AWS identity model

The workflow does not store a long-lived AWS access key in GitHub. The IAM role
trusts the GitHub OIDC provider and is restricted to this repository's `main`
branch. Its permissions are limited to authenticating to ECR and pushing or
reading layers in the `synapse` repository.

The GitHub Actions role is separate from:

- the EKS cluster IAM role;
- the future managed node-group IAM role;
- the EBS CSI Pod Identity role;
- the VPC CNI Pod Identity role;
- the AWS Load Balancer Controller role.

Do not reuse the GitHub Actions role for Kubernetes add-ons or application
workloads.

## Current automation boundary

The workflow currently validates code and publishes the container image. It does
not yet deploy to EKS. The first deployment is intentionally manual so the
cluster, node group, Load Balancer Controller, Secrets, and Helm values can be
verified. Once that bootstrap is healthy, an EKS deployment job can be added to
the workflow using the immutable commit-SHA image tag.

## Useful checks

From the GitHub repository:

1. Open **Actions → Synapse CI/CD**.
2. Inspect the `validate` job and then `publish-image` for a push to `main`.
3. In ECR, confirm the repository contains the commit SHA tag and `latest`.
4. Prefer the commit SHA tag when installing Helm.

Never put `DATABASE_URL`, `OPENROUTER_API_KEY`, or Kubernetes Secret values in
workflow logs, repository variables, documentation, or image layers.
