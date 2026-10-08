# Synapse EKS deployment runbook

This runbook bootstraps the first development EKS environment before cluster
deployment is added to GitHub Actions.

## Known deployment values

```text
AWS region:       us-east-1
AWS account:      161012475209
Cluster name:     synapse-dev
Namespace:        synapse-dev
ECR repository:   161012475209.dkr.ecr.us-east-1.amazonaws.com/synapse
Helm release:     synapse
```

The ECR publishing workflow currently pushes `latest` and the full Git commit
SHA. For the first manual deployment, prefer the full SHA so the running image
is immutable:

```text
161012475209.dkr.ecr.us-east-1.amazonaws.com/synapse:<successful-git-sha>
```

## 1. Create the EKS cluster in the AWS Console

Use the AWS Console in `us-east-1`:

1. Open **Amazon EKS → Clusters → Create**.
2. Choose **Custom configuration** and disable **EKS Auto Mode**. This project
   installs and uses the AWS Load Balancer Controller explicitly.
3. Set the cluster name to `synapse-dev`.
4. Select the latest Kubernetes version offered with standard support.
5. Use the console's **Create recommended role** option for the cluster IAM
   role if one does not already exist.
6. Use a VPC spanning at least two Availability Zones. The EKS console can
   create a recommended VPC for a development cluster.
7. Keep the default VPC CNI, CoreDNS, and kube-proxy add-ons enabled. Add the
   **Amazon EBS CSI Driver** add-on because the Redis chart uses a persistent
   volume.
8. For cluster access, enable **EKS API and ConfigMap** authentication and keep
   bootstrap cluster administrator access enabled for the cluster creator.
9. Create the cluster and wait until its status is **Active**.

AWS manages the control plane, but the application still needs worker capacity.
See the official [EKS cluster creation guide](https://docs.aws.amazon.com/eks/latest/userguide/getting-started-console.html).

## 2. Add a managed node group

After the cluster becomes **Active**:

1. Open the cluster's **Compute** tab and choose **Add node group**.
2. Name it `synapse-dev-nodes`.
3. Use the console's **Create recommended role** option for the node IAM role.
4. Use the default EKS-optimized Linux AMI. The current development cluster
   uses an `m7i-flex.large` node because the initial `t3.medium` node group
   could not be created successfully.
5. For a small development environment, start with one `m7i-flex.large` node:
   - desired: `1`
   - minimum: `1`
   - maximum: `2`
6. Select the cluster subnets and create the node group.

Managed nodes are EC2 instances, so they continue to incur EC2 and EKS costs
while the environment is running. See the [managed node group guide](https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html).

## 3. Connect to the cluster from CloudShell

The AWS Console creates the cluster, but Helm and Kubernetes resources are
applied from AWS CloudShell or a local terminal with `aws`, `kubectl`, and
`helm` installed:

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name synapse-dev

kubectl get nodes
```

The node should report `Ready` before continuing.

## 4. Configure EBS storage

The Redis StatefulSet uses the EBS CSI driver and an explicit `gp3` storage
class. Apply it before installing the Helm release:

```bash
kubectl apply -f deploy/eks/storageclass-gp3.yaml
```

## 5. Install the AWS Load Balancer Controller

Create the controller IAM role using the current AWS EKS guide, then install
the controller with Helm. The controller is required for the chart's `alb`
Ingress to create an Application Load Balancer. AWS recommends Helm for this
installation:

- [Create the controller IAM role](https://docs.aws.amazon.com/eks/latest/userguide/lbc-helm.html)
- [Install the AWS Load Balancer Controller](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html)

Verify it before deploying Synapse:

```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
```

## 6. Create the application Secret

Create this Secret in CloudShell or a trusted local terminal. Substitute the
real values locally; never commit this command with real values or paste the
values into GitHub:

```bash
kubectl create namespace synapse-dev

kubectl create secret generic synapse-secrets \
  --namespace synapse-dev \
  --from-literal=DATABASE_URL='<neon-database-url>' \
  --from-literal=OPENROUTER_API_KEY='<openrouter-api-key>' \
  --from-literal=LLM_API_KEY='' \
  --from-literal=EMBEDDING_API_KEY=''
```

The chart reads the Secret through `secrets.existingSecret`; it does not store
these values in Git.

## 7. Install the Synapse Helm release

Replace `<successful-git-sha>` with the commit SHA from the successful ECR
workflow run:

```bash
helm upgrade --install synapse deploy/helm/synapse \
  --namespace synapse-dev \
  --create-namespace \
  -f deploy/helm/synapse/values-dev.yaml \
  --set image.tag=<successful-git-sha> \
  --set secrets.existingSecret=synapse-secrets
```

Check the rollout and the ALB address:

```bash
kubectl get pods -n synapse-dev
kubectl get ingress -n synapse-dev
kubectl get events -n synapse-dev --sort-by=.lastTimestamp
```

The ALB may take a few minutes to provision. Once this manual deployment is
healthy, the GitHub Actions workflow can safely gain an EKS deployment job.
