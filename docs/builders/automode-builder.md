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
            nodePools: ['system', 'general-purpose']
        };

        AutomodeBuilder.builder(options)
            .account(account)
            .region(region)
            .resourceProvider(
                blueprints.GlobalResources.Vpc,
                new blueprints.VpcProvider()
            )
            .addOns(
              new IngressNginxAddOn({
                crossZoneEnabled: true,
                internetFacing: true,
                targetType: "ip",
              })
            )
            .build(scope, stackID);
    }
}
```
