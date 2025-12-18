import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

// Example customer issue reproduction:
const addOns: Array<blueprints.ClusterAddOn> = [
    // Add customer's addons here
];

const stack = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .addOns(...addOns)
    .version("auto")
    .build(app, 'debug-stack');

void stack; // Keep for debugging