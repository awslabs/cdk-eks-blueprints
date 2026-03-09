import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';

// Reproduces: karpenter-crd CRD lifecycle management
// Validates that karpenter-crd Helm chart is deployed before the main karpenter chart,
// ensuring CRDs are updated on every helm upgrade (not just initial install).

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

const stack = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .addOns(
        new blueprints.addons.VpcCniAddOn(),
        new blueprints.addons.CoreDnsAddOn(),
        new blueprints.addons.KubeProxyAddOn(),
        new blueprints.addons.KarpenterV1AddOn({
            installCRDs: true, // default — deploys karpenter-crd chart before main chart
        })
    )
    .version("auto")
    .build(app, 'karpenter-crd-debug-stack');

void stack;
