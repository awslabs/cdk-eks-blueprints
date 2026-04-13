# EKS Capabilities

[EKS Capabilities](https://docs.aws.amazon.com/eks/latest/userguide/capabilities.html) are fully managed cluster features that eliminate the need to install, maintain, and scale foundational cluster services. Each capability is an AWS resource that runs in EKS and is managed by AWS.

Available capabilities:

- **[ACK](ack-capability.md)** — Manage AWS resources using Kubernetes APIs
- **[ArgoCD](argocd-capability.md)** — GitOps-based continuous deployment with AWS Identity Center integration
- **[kro](kro-capability.md)** — Create custom Kubernetes APIs that compose multiple resources into higher-level abstractions

## Capabilities vs Addons

Capabilities are the AWS-managed equivalent of self-managed addons. They differ in that AWS handles installation, upgrades, scaling, and security patching. The blueprints framework automatically detects conflicts — if you add both a capability and its corresponding addon (e.g. `AckCapability` and `AckAddOn`), the build will fail with a conflict error.

## Prerequisites

EKS Capabilities require the cluster authentication mode to be set to `API` or `API_AND_CONFIG_MAP`. The legacy `CONFIG_MAP` mode is not supported. If using `GenericClusterProvider`, set this explicitly:

```typescript
import { AuthenticationMode } from 'aws-cdk-lib/aws-eks';

const clusterProvider = new blueprints.GenericClusterProvider({
  authenticationMode: AuthenticationMode.API_AND_CONFIG_MAP,
});
```

## Usage

```typescript
import * as blueprints from '@aws-quickstart/eks-blueprints';

const stack = blueprints.EksBlueprint.builder()
  .version("auto")
  .capabilities({
    ack: new blueprints.capabilities.AckCapability(),
    kro: new blueprints.capabilities.KroCapability(),
  })
  .build(app, 'my-cluster');
```

Each capability key (`ack`, `argocd`, `kro`) can only appear once — the type system enforces this at compile time.

## IAM Roles

Each capability requires an IAM role with the `capabilities.eks.amazonaws.com` service principal. By default, the framework creates a role with the capability's default managed policy. You can customize this:

```typescript
// Use a custom existing role
new blueprints.capabilities.AckCapability({
  roleArn: "arn:aws:iam::123456789:role/my-custom-role",
})

// Use a custom managed policy
new blueprints.capabilities.AckCapability({
  policyName: "MyCustomAckPolicy",
})

// Use an inline policy document
new blueprints.capabilities.AckCapability({
  policyDocument: new iam.PolicyDocument({ ... }),
})
```
