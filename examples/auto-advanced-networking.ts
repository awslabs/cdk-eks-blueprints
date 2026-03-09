import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

// Custom VPC provider that tags secondary subnets
class TaggedVpcProvider extends blueprints.VpcProvider {
  provide(context: blueprints.ResourceContext): blueprints.MultiConstruct<ec2.IVpc, ec2.ISubnet> {
    const vpc = super.provide(context);

    // Tag secondary subnets after creation
    if (vpc.subResources) {
      vpc.subResources.forEach((subnet) => {
          cdk.Tags.of(subnet).add("pod-subnet", "secondary");
      });
    }
    return vpc;
  }
}

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT!;
const region = process.env.CDK_DEFAULT_REGION!;

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
  role: blueprints.getNamedResource<iam.IRole>("custom-node-role"),
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
  new blueprints.addons.ArgoCDAddOn
];

const stack = blueprints.AutomodeBuilder.builder({
  nodePools: ['system'],
  nodeRole: blueprints.getNamedResource<iam.IRole>("custom-node-role"),
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
  .resourceProvider("custom-node-role", 
    new blueprints.CreateRoleProvider("custom-node-role", 
      new iam.ServicePrincipal('ec2.amazonaws.com'), 
      [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodeMinimalPolicy'), 
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPullOnly')
      ],
    )
  )
  .build(app, 'auto-advanced-networking-debug-stack');

void stack; // Keep for debugging
