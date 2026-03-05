import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';

const app = new cdk.App();

// Copy customer code here
// Replace XXXXXXXXXXXXX with your account
// Replace us-east-2 with your region


const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

// Example customer issue reproduction:
const addOns: Array<blueprints.ClusterAddOn> = [
    // Add customer's addons here
];
addOns.push(
  new blueprints.addons.AckAddOn({
    id: "ack-iam-controller",
    serviceName: blueprints.AckServiceName.IAM,
    managedPolicyName: "IAMFullAccess",
    createNamespace: true,
    namespace: "ack-system",
  })
);

addOns.push(
  new blueprints.addons.AckAddOn({
    id: "ack-s3-controller",
    serviceName: blueprints.AckServiceName.S3,
    managedPolicyName: "AmazonS3FullAccess",
    createNamespace: false,
    namespace: "ack-system",
  })
);

addOns.push(
  new blueprints.addons.AckAddOn({
    id: "ack-sqs-controller",
    serviceName: blueprints.AckServiceName.SQS,
    createNamespace: false,
    namespace: "ack-system",
  })
);

const stack = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .addOns(...addOns)
    .version("auto")
    .build(app, 'ack-fails-debug-stack');

void stack; // Keep for debugging

