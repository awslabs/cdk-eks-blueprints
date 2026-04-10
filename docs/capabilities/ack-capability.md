# ACK Capability

The [ACK capability](https://docs.aws.amazon.com/eks/latest/userguide/capabilities.html) enables management of AWS resources using Kubernetes APIs. It continuously reconciles the desired state with the actual state in AWS, correcting any drift. ACK supports cross-account and cross-region resource management.

This is the AWS-managed alternative to the self-managed [AckAddOn](../addons/ack.md). Using both on the same cluster will result in a conflict error.

## Usage

```typescript
import * as blueprints from '@aws-quickstart/eks-blueprints';

const stack = blueprints.EksBlueprint.builder()
  .version("auto")
  .capabilities({
    ack: new blueprints.capabilities.AckCapability(),
  })
  .build(app, 'my-cluster');
```

## Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `capabilityName` | `string` | `blueprints-ack-capability` | Name for the capability resource |
| `roleArn` | `string` | Auto-created | Existing IAM role ARN to use |
| `policyName` | `string` | - | Custom managed policy name |
| `policyDocument` | `iam.PolicyDocument` | - | Custom inline policy |
| `tags` | `CfnTag[]` | - | CloudFormation tags |

The default IAM policy is `AdministratorAccess`. For production, scope this down to only the AWS services you need:

```typescript
new blueprints.capabilities.AckCapability({
  policyName: "AmazonRDSFullAccess",
})
```
