import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

// Custom VPC provider that tags secondary subnets
class TaggedVpcProvider extends blueprints.VpcProvider {
  provide(context: blueprints.ResourceContext): ec2.IVpc {
    const vpc = super.provide(context);

    // Tag secondary subnets after creation
    if (this.secondaryCidr) {
      for (let i = 0; i < 3; i++) {
        const subnet = context.get(`secondary-cidr-subnet-${i}`);
        if (subnet) {
          cdk.Tags.of(subnet).add("pod-subnet", "secondary");
        }
      }
    }

    return vpc;
  }
}

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT!;
const region = process.env.CDK_DEFAULT_REGION!;

// Create a resource provider for the node role
class CustomRoleProvider implements blueprints.ResourceProvider<Role> {
  provide(context: blueprints.ResourceContext): Role {
    const role = new Role(context.scope, "node-role", {
      roleName: "auto-advanced-networking-node-role",
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSWorkerNodePolicy"),
        ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryPullOnly")
      ]
    });

    return role;
  }
}

// Addon to create access entry for the custom node role
class NodeRoleAccessEntryAddOn implements blueprints.ClusterAddOn {
  deploy(clusterInfo: blueprints.ClusterInfo): Promise<Construct> {
    const role = clusterInfo.getResourceContext().get("node-role") as Role;


    const accessEntry = new cdk.aws_eks.CfnAccessEntry(clusterInfo.cluster, "NodeRoleAccessEntry", {
      clusterName: clusterInfo.cluster.clusterName,
      principalArn: role.roleArn,
      type: "EC2",
      accessPolicies: [{
        accessScope: {
          type: "cluster"
        },
        policyArn: "arn:aws:eks::aws:cluster-access-policy/AmazonEKSAutoNodePolicy"
      }]
    });

    accessEntry.node.addDependency(role)
    accessEntry.node.addDependency(clusterInfo.cluster)

    return Promise.resolve(accessEntry);
  }
}

const nodeRoleProvider = new CustomRoleProvider();

// VPC with advanced networking configuration for EKS Auto Mode
const vpcProvider = new TaggedVpcProvider(undefined, {
  primaryCidr: "10.0.0.0/16",
  secondaryCidr: "100.64.0.0/16", // Secondary CIDR for advanced networking
  secondarySubnetCidrs: ["100.64.0.0/24", "100.64.1.0/24", "100.64.2.0/24"] // Pod subnets in secondary CIDR
});

// Node pool for EKS Auto Mode with advanced networking
const nodePool: blueprints.AutoModeNodePoolSpec = {
  nodeClassName: "networking-class",
  requirements: [
    {
      key: "karpenter.sh/capacity-type",
      operator: "In",
      values: ["on-demand"]
    },
    {
      key: "node.kubernetes.io/instance-type",
      operator: "In",
      values: ["m5.large", "m5.xlarge"]
    }
  ],
  limits: {
    cpu: 1000,
    memory: "1000Gi"
  },
  disruption: {
    consolidationPolicy: "WhenEmpty",
    consolidateAfter: "30s"
  }
};

// Node class for advanced networking
const nodeClass: blueprints.AutoModeNodeClassSpec = {
  role: "auto-advanced-networking-node-role",
  subnetSelectorTerms: [
    {
      tags: {
        "aws-cdk:subnet-type": "Private"
      }
    }
  ],
  securityGroupSelectorTerms: [
    {
      tags: {
        "aws:eks:cluster-name": "auto-advanced-networking-debug-stack"
      }
    }
  ],
  podSubnetSelectorTerms: [
    {
      tags: {
        "pod-subnet": "secondary"  // Use custom tag for secondary subnets
      }
    }
  ],
  podSecurityGroupSelectorTerms: [
    {
      tags: {
        "aws:eks:cluster-name": "auto-advanced-networking-debug-stack"
      }
    }
  ],
  ephemeralStorage: {
    size: "120Gi",
  },
};

// Example customer issue reproduction:
const addOns: Array<blueprints.ClusterAddOn> = [
  new blueprints.addons.ArgoCDAddOn,
  new NodeRoleAccessEntryAddOn()
];

const stack = blueprints.AutomodeBuilder.builder({
  nodePools: ['system'],
  extraNodePools: {
    'networking-pool': nodePool
  },
  extraNodeClasses: {
    'networking-class': nodeClass
  },
})
  .account(account)
  .region(region)
  .version("auto")
  .addOns(...addOns)
  .resourceProvider(blueprints.GlobalResources.Vpc, vpcProvider)
  .resourceProvider("node-role", nodeRoleProvider)
  .build(app, 'auto-advanced-networking-debug-stack');

void stack; // Keep for debugging
