import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks'
import * as blueprints from '../lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2'

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const identityCenterArn = process.env.AWS_IDENTITY_CENTER_ARN;
const identityCenterUserId = process.env.AWS_IDENTITY_CENTER_USER_ID;

// Example customer issue reproduction:
const addOns: Array<blueprints.ClusterAddOn> = [
    new blueprints.addons.EksPodIdentityAgentAddOn(),
    new blueprints.addons.AwsNetworkFlowMonitorAddOn()
];

const capabilities: Array<blueprints.ClusterCapability> = [
    new blueprints.capabilities.AckCapability(),
    new blueprints.capabilities.ArgoCapability({
        idcInstanceArn: identityCenterArn!,
        roleMappings: {
            "ADMIN": [{
                identityId: identityCenterUserId!,
                identityType: blueprints.SsoIdentityType.SSO_USER
            }],

        }
    }),
    new blueprints.capabilities.KroCapability(),
]

const clusterProvider = new blueprints.GenericClusterProvider({
  authenticationMode: eks.AuthenticationMode.API_AND_CONFIG_MAP,
  managedNodeGroups: [{
    id: "capabilities-node-group",
    instanceTypes: [new ec2.InstanceType("m5.large")],
    amiType: eks.NodegroupAmiType.AL2023_X86_64_STANDARD,
  }]
})

const stack = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .clusterProvider(clusterProvider)
    .capabilities(...capabilities)
    .addOns(...addOns)
    .version("auto")
    .build(app, 'capabilities-debug-stack');

void stack; // Keep for debugging
