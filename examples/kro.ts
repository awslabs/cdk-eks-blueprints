import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';
import { AckServiceName } from '../lib/addons/ack/serviceMappings';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

const stack = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .version("auto")
    .addOns(
        new blueprints.addons.VpcCniAddOn(),
        new blueprints.addons.CoreDnsAddOn(),
        new blueprints.addons.KubeProxyAddOn(),
        new blueprints.addons.AckAddOn({ serviceName: AckServiceName.RDS }),
        new blueprints.addons.KroAddOn(),
    )
    .build(app, 'kro-example');

void stack;
