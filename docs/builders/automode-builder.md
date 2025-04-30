# Auto Mode Builder

The `AutomodeBuilder` allows you to get started with a builder class to configure with required setup as you prepare a blueprint for setting up EKS cluster with EKS Auto Mode.

The `AutomodeBuilder` creates the following:

- An EKS Cluster with passed k8s version and cluster tags.
- The specified NodePools and EKS Auto Mode storage and networking configurations.

## Input Parameters

`Partial<AutomodeClusterProviderProps>` parameters can be used as inputs to `AutomodeBuilder`. Few parameters shown below:

- `version` : Kubernetes version to use for the cluster
- `nodePools`: The Auto Mode node pools to provision for the cluster

### Demonstration - Running EKS Auto Mode

The below usage helps you with a demonstration to use `AutomodeBuilder` to configure a required setup as you prepare a blueprint for setting up EKS Auto Mode on a new EKS cluster.

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

        const ampWorkspaceName = "automode-amp-workspaces";
        const ampWorkspace: CfnWorkspace =
            blueprints.getNamedResource(ampWorkspaceName);

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
            .resourceProvider(
                "efs-file-system",
                new blueprints.CreateEfsFileSystemProvider({
                    name: "efs-file-systems",
                })
            )
            .resourceProvider(
                ampWorkspaceName,
                new blueprints.CreateAmpProvider(
                    ampWorkspaceName,
                    ampWorkspaceName
                )
            )
            .addOns(
                new blueprints.addons.IstioBaseAddOn(),
                new blueprints.addons.IstioControlPlaneAddOn(),
                new blueprints.addons.KubeStateMetricsAddOn(),
                new blueprints.addons.MetricsServerAddOn(),
                new blueprints.addons.PrometheusNodeExporterAddOn(),
                new blueprints.addons.ExternalsSecretsAddOn(),
                new blueprints.addons.SecretsStoreAddOn(),
                new blueprints.addons.CalicoOperatorAddOn(),
                new blueprints.addons.CertManagerAddOn(),
                new blueprints.addons.AdotCollectorAddOn(),
                new blueprints.addons.AmpAddOn({
                    ampPrometheusEndpoint: ampWorkspace.attrPrometheusEndpoint
                }),
                new blueprints.addons.CloudWatchLogsAddon({
                    logGroupPrefix: "/aws/eks/graviton-blueprint",
                }),
                new blueprints.addons.EfsCsiDriverAddOn(),
                new blueprints.addons.FluxCDAddOn(),
                new blueprints.addons.GrafanaOperatorAddon(),
                new blueprints.addons.XrayAdotAddOn()
            )
            .build(scope, stackID);
    }
}
```
