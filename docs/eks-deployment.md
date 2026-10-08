# EKS deployment guide

This guide describes the manual first deployment of Synapse. The detailed
command sequence is also available in [`deploy/eks/README.md`](../deploy/eks/README.md).

## Cluster configuration

The development cluster is configured in `us-east-1` with:

- name: `synapse-dev`;
- Kubernetes `1.36`, standard support;
- EKS Auto Mode disabled;
- IPv4 networking in the default VPC across the selected subnets;
- public and private API endpoint access;
- EKS API and ConfigMap authentication;
- bootstrap cluster administrator access enabled;
- standard control-plane scaling;
- deletion protection disabled for development cleanup.

The public API allowlist is currently `0.0.0.0/0` for bootstrap convenience.
Restrict it when the cluster moves beyond this development setup.

## Installed add-ons

| Add-on | Why it is enabled |
| --- | --- |
| VPC CNI | IPv4 pod networking |
| CoreDNS | Kubernetes service discovery |
| kube-proxy | Service networking on nodes |
| EKS Pod Identity Agent | IAM roles for add-ons and workloads |
| Metrics Server | CPU metrics for the workload HPAs |
| EBS CSI Driver | Persistent EBS volume for Redis |

The development workload also uses the official Kubernetes Cluster Autoscaler
to adjust the managed node group between one and two nodes when HPA-created
pods cannot fit on the current node. See the autoscaling section in the
[EKS runbook](../deploy/eks/README.md).

The EBS CSI driver uses the Pod Identity role attached to
`ebs-csi-controller-sa` with `AmazonEBSCSIDriverPolicyV2`. The VPC CNI uses the
Pod Identity role attached to `aws-node` with `AmazonEKS_CNI_Policy`.

## Bootstrap sequence

### 1. Create the cluster

Create the cluster from the AWS Console and wait for status **Active**. Do not
create application workloads until worker capacity is available.

### 2. Add a managed node group

Create a managed node group named `synapse-dev-nodes` using the recommended
node IAM role and an EKS-optimised Linux AMI. For a small development cluster,
start with:

```text
instance type: t3.medium
desired:       1
minimum:       1
maximum:       2
```

### 3. Connect to the cluster

Use AWS CloudShell or a trusted local terminal with AWS CLI, `kubectl`, and
Helm installed:

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name synapse-dev

kubectl get nodes
```

Continue only when the node reports `Ready`.

### 4. Install the AWS Load Balancer Controller

Create its dedicated IAM role using the official EKS guide, then install the
controller with Helm. The controller watches the chart's `Ingress` resource and
creates the internet-facing Application Load Balancer.

Verify it with:

```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
```

Use the official [AWS Load Balancer Controller guide](https://docs.aws.amazon.com/eks/latest/userguide/lbc-helm.html)
for the current controller policy and Helm commands.

### 5. Create the application Secret

Create the Secret outside Git. Substitute values only in your local terminal or
CloudShell session:

```bash
kubectl create namespace synapse-dev

kubectl create secret generic synapse-secrets \
  --namespace synapse-dev \
  --from-literal=DATABASE_URL='<neon-database-url>' \
  --from-literal=OPENROUTER_API_KEY='<openrouter-api-key>' \
  --from-literal=LLM_API_KEY='' \
  --from-literal=EMBEDDING_API_KEY=''
```

The Helm chart references this Secret through
`secrets.existingSecret=synapse-secrets`.

### 6. Deploy the Helm release

Use the full commit SHA published by the successful GitHub Actions run. This
keeps the deployment tied to one immutable image rather than moving `latest`:

```bash
helm upgrade --install synapse deploy/helm/synapse \
  --namespace synapse-dev \
  --create-namespace \
  -f deploy/helm/synapse/values-dev.yaml \
  --set image.tag='<successful-git-sha>' \
  --set secrets.existingSecret=synapse-secrets
```

Check the rollout and ingress:

```bash
kubectl get pods -n synapse-dev
kubectl get services -n synapse-dev
kubectl get ingress -n synapse-dev
kubectl get events -n synapse-dev --sort-by=.lastTimestamp
```

The ALB hostname may take several minutes to appear.

### 7. Add Route 53 DNS

After the ALB is healthy:

1. Create or use a Route 53 hosted zone for the domain.
2. Create an alias `A` record such as `dev.<domain>` pointing to the ALB.
3. Set the Helm Ingress host to the same DNS name.
4. Re-run the Helm upgrade if the host value changed.

Route 53 is the DNS layer; the ALB remains the public entry point for the EKS
workload.

## Follow-up automation

After the manual deployment is verified, add an EKS deployment job to GitHub
Actions. It should deploy the successful commit SHA, not rebuild a different
image and not place secrets in the workflow file. ArgoCD/GitOps is intentionally
outside the current scope.
