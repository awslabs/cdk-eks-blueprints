# Auto Mode Builder

The `AutomodeBuilder` allows you to get started with a builder class with required setup as you prepare a blueprint for setting up EKS cluster with EKS Auto Mode.

The `AutomodeBuilder` creates the following:

- An EKS Cluster with passed k8s version and cluster tags.
- The specified NodePools and EKS Auto Mode storage and networking configurations.

## Input Parameters

`Partial<AutomodeClusterProviderProps>` parameters can be used as inputs to `AutomodeBuilder`. Few parameters shown below:

- `version` : Kubernetes version to use for the cluster
- `nodePools`: The Auto Mode node pools to provision for the cluster

### Demonstration - Running EKS Auto Mode

The below usage demonstrates how to use `AutomodeBuilder` to set up EKS Auto Mode on a new EKS cluster.

```typescript
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { AutomodeBuilder } from "@aws-quickstart/eks-blueprints";
import { CfnWorkspace } from "aws-cdk-lib/aws-aps";
import * as eks from "aws-cdk-lib/aws-eks";
import { Construct } from "constructs";

export default class AutomodeConstruct {
  build(scope: Construct, id: string) {
    const account = process.env.CDK_DEFAULT_ACCOUNT!;
    const region = process.env.CDK_DEFAULT_REGION!;
    const stackID = `${id}-blueprint`;

    const options: Partial<blueprints.AutomodeClusterProviderProps> = {
      version: eks.KubernetesVersion.of("1.31"),
      nodePools: ["system", "general-purpose"],
    };

    AutomodeBuilder.builder(options)
      .account(account)
      .region(region)
      .resourceProvider(
        blueprints.GlobalResources.Vpc,
        new blueprints.VpcProvider(),
      )
      .addOns(new blueprints.addons.ArgoCDAddOn())
      .addALBIngressClass()
      .addEBSStorageClass()
      .build(scope, stackID);
  }
}
```

## Using ALBDefaultIngressClassAddOn with Auto Mode

EKS Auto Mode comes with the AWS Load Balancer Controller pre-installed, but it doesn't create a default `IngressClass` resource. The `ALBDefaultIngressClassAddOn` complements the Auto Mode setup by creating a default `IngressClass` named `alb` that's configured to work with the AWS Load Balancer Controller.

To add this AddOn to your cluster, use the `addALBIngressClass()` function of the `AutomodeBuilder`.

Adding this addon to your Auto Mode cluster enables you to:

1. Use the ALB `IngressClass` without having to manually create it
2. Standardize Ingress configurations across your applications
3. Simplify Ingress resource definitions by referencing the default `IngressClass`

For more details on the `ALBDefaultIngressClassAddOn`, see the [AWS ALB Default IngressClass Add-on documentation](../addons/aws-alb-default-ingress-class.md).

## Using EbsCsiDefaultStorageClassAddOn with Auto Mode

EKS Auto Mode comes with the EBS CSI Driver pre-installed, but it doesn't create a default `gp3` `StorageClass` resource. The `EbsCsiDefaultStorageClassAddon` complements the Auto Mode setup by creating a default `StorageClass` named `auto-ebs-sc` that's configured to work with the EBS CSI Driver

To add this AddOn to your cluster, use the `addEBSStorageClass()` function of the `AutomodeBuilder`.

For more details on the `EbsCsiDefaultStorageClassAddOn`, see the [EBS CSI Default StorageClass Add-on documentation](../addons/ebs-csi-default-storage-class.md).
