import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const identityCenterArn = process.env.AWS_IDENTITY_CENTER_ARN;

// Example customer issue reproduction:
const addOns: Array<blueprints.ClusterAddOn> = [
    new blueprints.addons.EksPodIdentityAgentAddOn(),
    new blueprints.addons.AwsNetworkFlowMonitorAddOn()
];

const capabilities: Array<blueprints.ClusterCapability> = [
    new blueprints.capabilities.AckCapability(),
    new blueprints.capabilities.ArgoCapability({
        identityCenterArn: identityCenterArn!
    }),
    new blueprints.capabilities.KroCapability(),
]

const stack = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .capabilities(...capabilities)
    .addOns(...addOns)
    .version("auto")
    .build(app, 'capabilities-debug-stack');

void stack; // Keep for debugging
