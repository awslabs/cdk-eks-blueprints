# Generic Cluster Provider V2

The `GenericClusterProviderV2` allows you to provision an EKS cluster which leverages one or more [EKS managed node groups](https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html)(MNGs), one or more autoscaling groups[EC2 Auto Scaling groups](https://docs.aws.amazon.com/autoscaling/ec2/userguide/AutoScalingGroup.html), or EKS AutoMode for its compute capacity. Users can also configure multiple Fargate profiles along with the EC2 based compute capacity.

This cluster provider uses the V2 of the EKS CDK to leverage native CFN constructs to provision the EKS cluster.  This reduces the number of customer resources and nested stacks, and enable you to use standard CFN guardrails to control resource usage and apply tagging.

The `GenericClusterProviderV2` maintains all of the same capabilities as the `GenericClusterProvider`, and enables using EKS Auto Mode Clusters.

Note: EKS Auto Mode is the default configuration.  If you want to use this cluster provider with Node Groups instead, set the `defaultCapacityType`.

# Configuration

Full list of configuration options:

- [Generic Cluster Provider V2](../api/interfaces/clusters.GenericClusterProviderPropsV2.html)
- [Managed Node Group](../api/interfaces/clusters.ManagedNodeGroup.html)
- [Autoscaling Group](../api/interfaces/clusters.AutoscalingNodeGroup.html)
- [Fargate Cluster](../api/interfaces/clusters.FargateClusterProviderProps.html)
- [Auto Mode Cluster](../api/interfaces/clusters.AutomodeClusterProviderProps.html)

## Usage

```typescript
const clusterProvider = new blueprints.GenericClusterProviderV2({
    version: KubernetesVersion.V1_31,
    tags: {
        "Name": "blueprints-example-cluster",
        "Type": "generic-cluster-v2"
    },
    serviceIpv4Cidr: "10.43.0.0/16",
    // if needed use this to register an auth role integrate with RBAC
    mastersRole: blueprints.getResource(context => {
        return new iam.Role(context.scope, 'AdminRole', { assumedBy: new AccountRootPrincipal() });
    }),
    compute: {
      nodePools: ["system", "general-purpose"],
      nodeRole: cdk.aws_iam.Role.fromRoleName(app, "generic-v2-node-role", "AmazonEKSNodeRole")
    },
    fargateProfiles: {
        "fp1": {
            fargateProfileName: "fp1",
            selectors:  [{ namespace: "serverless1" }]
        }
    }
});

EksBlueprint.builder()
    .clusterProvider(clusterProvider)
    .build(app, blueprintID);
```


The Cluster configuration and node group configuration exposes a number of options that require to supply an actual CDK resource.
For example cluster allows passing `mastersRole`, `securityGroup`, etc. to the cluster, while Auto Mode allows specifying `nodeRole`.

All of such cases can be solved with [Resource Providers](../resource-providers/index.md#using-resource-providers-with-cdk-constructs).

## Configuration

The `GenericClusterProviderV2` supports the following configuration options.

| Prop                  | Description |
|-----------------------|-------------|
| clusterName           | The name for the cluster.
| managedNodeGroups     | Zero or more managed node groups.
| autoscalingNodeGroups | Zero or more autoscaling node groups (mutually exclusive with managed node groups).
| compute               | Configuration for EKS Auto Mode (mutually exclusive with managed and autoscaling node groups)
| fargateProfiles       | Zero or more Fargate profiles.
| version               | Kubernetes version for the control plane. Required in cluster props or blueprint props.
| vpc                   | VPC for the cluster.
| vpcSubnets            | The subnets for control plane ENIs (subnet selection).
| privateCluster        | If `true` Kubernetes API server is private.
| tags                  | Tags to propagate to Cluster.

There should be public and private subnets for EKS cluster to work. For more information see [Cluster VPC Considerations](https://docs.aws.amazon.com/eks/latest/userguide/network_reqs.html).


Default configuration for managed and autoscaling node groups can also be supplied via context variables (specify in cdk.json, cdk.context.json, ~/.cdk.json or pass with -c command line option):

- `eks.default.min-size`
- `eks.default.max-size`
- `eks.default.desired-size`
- `eks.default.instance-type`
- `eks.default.private-cluster`
- `eks.default.isolated-cluster`

Configuration of the EC2 parameters through context parameters makes sense if you would like to apply default configuration to multiple clusters without the need to explicitly pass individual `GenericProviderClusterV2Props` to each cluster blueprint.

You can find more details on the supported configuration options in the API documentation for the [GenericClusterProviderV2Props](../api/interfaces/clusters.GenericClusterProviderV2Props.html).

