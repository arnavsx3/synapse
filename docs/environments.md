# Environment values

The chart has separate values files for development and staging:

- [`values-dev.yaml`](../deploy/helm/synapse/values-dev.yaml)
- [`values-staging.yaml`](../deploy/helm/synapse/values-staging.yaml)

Both environments use the same ECR repository but should deploy an immutable
commit SHA selected by the release process. The checked-in `latest` tag is a
convenient development default; override it during deployment with
`--set image.tag=<commit-sha>`.

## Development

```text
namespace: synapse-dev
host: synapes-dev.online
app replicas: 1 (HPA min 1, max 3)
worker replicas: 1 (HPA min 1, max 2)
nginx replicas: 1 (HPA min 1, max 2)
```

Development is intended for the first manual EKS deployment and cost-conscious
testing. CPU-based HPAs are enabled for the stateless workloads; the EKS node
group can scale from one to two nodes through Cluster Autoscaler.

## Staging

```text
host: staging.synapse.example.com
app replicas: 2
worker replicas: 2
nginx replicas: 2
```

Staging values demonstrate a larger workload shape. Production security
hardening, multi-node high availability, and a staging autoscaling policy still
need separate decisions.

## Shared configuration

The chart configures the OpenRouter endpoints, model names, RAG chunking
settings, Redis connection, and embedding dimension. The embedding dimension
is `2048`, matching `nvidia/nemotron-3-embed-1b:free`.

Secrets are deliberately not represented in these files. Supply them through a
Kubernetes Secret created outside Git and reference it with
`secrets.existingSecret`.
