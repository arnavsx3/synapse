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

The node group's minimum, desired, and maximum values are not autoscaling by
themselves. The Cluster Autoscaler deployment below watches for unscheduled
pods and changes the node group's desired count between 1 and 2. The managed
node group's autoscaling tags are already present on the AWS Auto Scaling
Group; do not remove them.

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

The Redis StatefulSet uses the EBS CSI driver. This manifest installs `gp3` as
the cluster's default storage class. Apply it before installing the Helm
release:

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

## 8. Enable workload and node autoscaling

The Helm chart enables CPU-based Horizontal Pod Autoscalers for the stateless
Nginx, app, and BullMQ worker Deployments in `values-dev.yaml`. Redis remains a
single StatefulSet because it owns persistent state and should not be scaled by
duplicating pods. Metrics Server supplies the CPU data used by these HPAs.

Create the dedicated Pod Identity role and policy once:

```bash
aws iam create-policy \
  --policy-name AmazonEKSClusterAutoscalerPolicy \
  --policy-document file://deploy/eks/cluster-autoscaler-policy.json

aws iam create-role \
  --role-name AmazonEKSClusterAutoscalerRole \
  --assume-role-policy-document file://deploy/eks/cluster-autoscaler-trust-policy.json

aws iam attach-role-policy \
  --role-name AmazonEKSClusterAutoscalerRole \
  --policy-arn arn:aws:iam::161012475209:policy/AmazonEKSClusterAutoscalerPolicy

aws eks create-pod-identity-association \
  --cluster-name synapse-dev \
  --region us-east-1 \
  --role-arn arn:aws:iam::161012475209:role/AmazonEKSClusterAutoscalerRole \
  --namespace kube-system \
  --service-account cluster-autoscaler
```

Install the official Cluster Autoscaler chart. The values file pins the image
to the Kubernetes 1.36-compatible upstream image and discovers the managed node
group from its AWS tags:

```bash
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm repo update

helm upgrade --install cluster-autoscaler autoscaler/cluster-autoscaler \
  --version 9.59.0 \
  --namespace kube-system \
  -f deploy/eks/cluster-autoscaler-values.yaml \
  --wait
```

Verify both layers:

```bash
kubectl get hpa -n synapse-dev
kubectl get deployment cluster-autoscaler -n kube-system
kubectl logs deployment/cluster-autoscaler -n kube-system --tail=100
aws eks describe-nodegroup --cluster-name synapse-dev \
  --nodegroup-name synapse-dev-nodes --region us-east-1 \
  --query 'nodegroup.scalingConfig'
```

The current low-traffic environment should stay at one app replica and one
node. During load, HPA adds pods; if those pods cannot fit, Cluster Autoscaler
raises the node group's desired count up to two. If the node group is replaced,
refresh the Auto Scaling Group ARN in `cluster-autoscaler-policy.json` and the
IAM policy before relying on node scale-up again.
