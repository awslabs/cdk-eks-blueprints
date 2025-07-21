import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';

const account = "1234567891"
const region = "us-west-1"

describe('Unit tests for AWS ALB Default Ingress Classaddon', () => {
    test("Stack creation fails due to conflict with AwsLoadBalancerController AddOn", () => {
        const app = new cdk.App();

        const blueprint = blueprints.AutomodeBuilder.builder({});

        blueprint.account(account).region(region)
            .version("auto")
            .addOns(new blueprints.AwsLoadBalancerControllerAddOn())
            .addALBIngressClass()

        expect(() => {
            blueprint.build(app, 'aws-lbc-addon-conflict');
        }).toThrow("Deploying aws-lbc-addon-conflict failed due to conflicting add-on: AwsLoadBalancerControllerAddOn.");
    });

    test("Kubernetes stack creation succeeds with default ALB IngressClass", () => {
        const app = new cdk.App();

        const blueprint = blueprints.AutomodeBuilder.builder({});


        blueprint.account(account).region(region)
            .version("auto")
            .addALBIngressClass()
            .build(app, 'alb-ingressclass-stack-succeeds');

        expect(blueprint).toBeDefined();
    });
});
