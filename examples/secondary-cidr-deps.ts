
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

const vpcProvider = new blueprints.VpcProvider(undefined, {
  primaryCidr: "10.0.0.0/16",
  secondaryCidr: "100.64.0.0/16",
  secondarySubnetCidrs: ["100.64.0.0/24", "100.64.1.0/24", "100.64.2.0/24"] // Pod subnets in secondary CIDR
});
// Example customer issue reproduction:
const addOns: Array<blueprints.ClusterAddOn> = [
  new blueprints.ArgoCDAddOn
];

const stack = blueprints.EksBlueprint.builder()
  .account(account)
  .region(region)
  .resourceProvider(blueprints.GlobalResources.Vpc, vpcProvider)
  .addOns(...addOns)
  .version("auto")
  .build(app, 'debug-stack');

void stack; // Keep for debugging
