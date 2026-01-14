# Auto Mode Cluster Provider

The `AutomodeClusterProvider` allows you to provision an EKS cluster which runs on [EKS Auto Mode](https://docs.aws.amazon.com/eks/latest/userguide/automode.html). For Auto Mode, you can enable (default) or disable the `system` and `general-purpose` node pools, as well as pass your own through the `extraNodePools` field.
## Usage

### Basic Configuration

```typescript
const clusterProvider = new blueprints.AutomodeClusterProvider({
  version: version,
  vpcSubnets: [{ subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS }],
  nodePools: ["system", "general-purpose"],
  extraNodePools: {
    "automode-test": {
      nodeClassName: "default",
      requirements: [
        { key: "node.kubernetes.io/instance-type", operator: "In", values: ["m5.2xlarge"] },
        { key: "karpenter.sh/capacity-type", operator: "In", values: ["spot"] }
      ],
      disruption: { consolidationPolicy: "WhenEmpty", consolidateAfter: "30s" }
    }
  }
});

EksBlueprint.builder().clusterProvider(clusterProvider).build(app, 'automode-cluster');
```

### Advanced Networking Configuration

For advanced networking scenarios with pod subnets and pod security groups:

```typescript
const clusterProvider = new blueprints.AutomodeClusterProvider({
  version: eks.KubernetesVersion.of("1.34"),
  nodePools: ["system"],
  extraNodePools: {
    "networking-pool": {
      nodeClassName: "networking-class",
      requirements: [
        { key: "karpenter.sh/capacity-type", operator: "In", values: ["on-demand"] },
        { key: "node.kubernetes.io/instance-type", operator: "In", values: ["m5.large"] }
      ],
      limits: { cpu: 1000, memory: "1000Gi" }
    }
  },
  extraNodeClasses: {
    "networking-class": {
      role: "my-node-role",
      subnetSelectorTerms: [{ tags: { "aws-cdk:subnet-type": "Private" } }],
      securityGroupSelectorTerms: [{ tags: { "aws:eks:cluster-name": "my-cluster" } }],
      podSubnetSelectorTerms: [{ tags: { "pod-subnet": "secondary" } }],
      podSecurityGroupSelectorTerms: [{ tags: { "aws:eks:cluster-name": "my-cluster" } }],
      ephemeralStorage: { size: "120Gi" }
    }
  }
});

EksBlueprint.builder().clusterProvider(clusterProvider).build(app, 'automode-cluster');
```

For a complete example with VPC secondary CIDR configuration and custom node roles, see [auto-advanced-networking.ts](https://github.com/awslabs/cdk-eks-blueprints/blob/main/examples/auto-advanced-networking.ts).

## Configuration

`AutomodeClusterProvider` supports the following configuration options.

| Prop                  | Description |
|-----------------------|-------------|
| name                  | The name for the cluster. 
| version               | Kubernetes version for the control plane. Required in cluster props or blueprint props.
| nodePools             | `["system", "general-purpose"]`, disable by removing from the array
| nodeRole | The IAM role for the Node Pools, will be automatically generated if not specified
| extraNodePools        | Extra Karpenter Node Pools to be added to the cluster (uses `AutoModeNodePoolSpec` type)
| extraNodeClasses      | Node class specifications for advanced networking features including pod subnets and pod security groups (uses `AutoModeNodeClassSpec` type)
| vpcSubnets            | The subnets for the cluster.
| tags                  | Tags to propagate to Cluster.
| privateCluster        | Public cluster, you will need to provide a list of subnets. There should be public and private subnets
for EKS cluster to work. For more information see [Cluster VPC Considerations](https://docs.aws.amazon.com/eks/latest/userguide/network_reqs.html)

You can find more details on the supported configuration options in the API documentation for the [AutomodeClusterProviderProps](../api/interfaces/clusters.AutomodeClusterProviderProps.html).
