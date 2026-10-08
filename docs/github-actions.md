# GitHub Actions, Amazon ECR, and Amazon EKS

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
       └─ deploy-dev (only after publish-image succeeds)
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

## ECR and EKS identity model

The workflow does not store a long-lived AWS access key in GitHub. The IAM role
trusts the GitHub OIDC provider and is restricted to this repository's `main`
branch. Its permissions are limited to authenticating to ECR and pushing or
reading layers in the `synapse` repository.

The same short-lived OIDC role is used by the image and deployment jobs. It has:

- ECR permissions for the `synapse` repository;
- `eks:DescribeCluster` for `synapse-dev`;
- an EKS access entry associated with `AmazonEKSAdminPolicy`, scoped only to the
  `synapse-dev` namespace.

The access entry is Kubernetes authorization, while the IAM policy is AWS API
authorization. Both are required: IAM lets the runner discover the cluster,
and the EKS access entry lets its generated Kubernetes token manage the
namespace.

The GitHub Actions role is still separate from:

- the EKS cluster IAM role;
- the future managed node-group IAM role;
- the EBS CSI Pod Identity role;
- the VPC CNI Pod Identity role;
- the AWS Load Balancer Controller role.

Do not reuse the GitHub Actions role for Kubernetes add-ons or application
workloads.

## EKS deployment job

The `deploy-dev` job runs only after `publish-image` succeeds. It:

1. Assumes the same OIDC role without storing AWS keys in GitHub.
2. Runs `aws eks update-kubeconfig` for `synapse-dev`.
3. Verifies that the role can read deployments in `synapse-dev`.
4. Runs Helm with `values-dev.yaml`, the existing runtime Secret, and
   `github.sha` as the immutable image tag.
5. Waits for the app, worker, and Nginx Deployments to roll out.
6. Prints the current Ingress address for the deployment log.

The namespace and Secret must already exist from the one-time EKS bootstrap.
The workflow intentionally does not create or print application secrets.

The deploy job uses the same commit SHA that was published by `publish-image`,
so a successful run has a direct source-to-image-to-cluster relationship.

## One-time AWS authorization

The deploy role's cluster-discovery permission is documented in
[`deploy/eks/github-actions-eks-policy.json`](../deploy/eks/github-actions-eks-policy.json).
The EKS access entry can be recreated with:

```bash
ROLE_ARN=arn:aws:iam::161012475209:role/synapse-github-actions-ecr

aws iam put-role-policy \
  --role-name synapse-github-actions-ecr \
  --policy-name SynapseEKSDescribeCluster \
  --policy-document file://deploy/eks/github-actions-eks-policy.json

aws eks create-access-entry \
  --cluster-name synapse-dev \
  --region us-east-1 \
  --principal-arn "$ROLE_ARN" \
  --type STANDARD

aws eks associate-access-policy \
  --cluster-name synapse-dev \
  --region us-east-1 \
  --principal-arn "$ROLE_ARN" \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSAdminPolicy \
  --access-scope type=namespace,namespaces=synapse-dev
```

Do not broaden the access scope to the whole cluster for this development
pipeline.

## Useful checks

From the GitHub repository:

1. Open **Actions → Synapse CI/CD**.
2. Inspect `validate`, `publish-image`, and `deploy-dev` for a push to `main`.
3. In ECR, confirm the repository contains the commit SHA tag and `latest`.
4. Confirm the three rollout checks pass and the Ingress is present.
5. Prefer the commit SHA tag for any manual Helm operation.

Never put `DATABASE_URL`, `OPENROUTER_API_KEY`, or Kubernetes Secret values in
workflow logs, repository variables, documentation, or image layers.
