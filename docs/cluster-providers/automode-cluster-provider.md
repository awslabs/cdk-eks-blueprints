# Auto Mode Cluster Provider

The `AutomodeClusterProvider` allows you to provision an EKS cluster which runs on [EKS Auto Mode](https://docs.aws.amazon.com/eks/latest/userguide/automode.html). For Auto Mode, you can enable (default) or disable the `system` and `general-purpose` node pools, as well as pass your own through the `extraNodePools` field.
## Usage

```typescript
const clusterProvider = new blueprints.AutomodeClusterProvider({
  version: version,
  vpcSubnets: [{ subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS }],
  nodePools: ["system", "general-purpose"],
  extraNodePools: {
    "automode-test": {
      labels: { type: "automode-test" },
      annotations: { "eks-blueprints/owner": "young" },
      requirements: [
        { key: "node.kubernetes.io/instance-type", operator: "In", values: ["m5.2xlarge"] },
        {
          key: "topology.kubernetes.io/zone",
          operator: "In",
          values: [`${props?.env?.region}a`, `${props?.env?.region}b`],
        },
        { key: "kubernetes.io/arch", operator: "In", values: ["amd64", "arm64"] },
        { key: "karpenter.sh/capacity-type", operator: "In", values: ["spot"] },
      ],
      expireAfter: "20m",
      disruption: { consolidationPolicy: "WhenEmpty", consolidateAfter: "30s" },


    }
  }

});

EksBlueprint.builder().clusterProvider(clusterProvider).build(app, 'automode-cluster');
```

## Configuration

`AutomodeClusterProvider` supports the following configuration options.

| Prop                  | Description |
|-----------------------|-------------|
| name                  | The name for the cluster. 
| version               | Kubernetes version for the control plane. Required in cluster props or blueprint props.
| nodePools             | `["system", "general-purpose"]`, disable by removing from the array
| nodeRole | The IAM role for the Node Pools, will be automatically generated if not specified
| extraNodePools        | Extra Karpenter Node Pools to be added to the cluster
| vpcSubnets            | The subnets for the cluster.
| tags                  | Tags to propagate to Cluster.
| privateCluster        | Public cluster, you will need to provide a list of subnets. There should be public and private subnets
for EKS cluster to work. For more information see [Cluster VPC Considerations](https://docs.aws.amazon.com/eks/latest/userguide/network_reqs.html)

You can find more details on the supported configuration options in the API documentation for the [AutomodeClusterProviderProps](../api/interfaces/clusters.AutomodeClusterProviderProps.html).
