import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';

const account = "1234567891";
const region = "us-west-1";

describe('Unit tests for AWS ALB Default Ingress Class addon', () => {
    test("Stack creation fails due to conflict with AwsLoadBalancerController AddOn", () => {
        const app = new cdk.App();

        const blueprint = blueprints.AutomodeBuilder.builder({});

        blueprint.account(account).region(region)
            .version("auto")
            .addOns(new blueprints.AwsLoadBalancerControllerAddOn())
            .addALBIngressClass();

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

describe('Unit tests for EBS CSI Default Storage Class addon', () => {
    test("Stack creation fails due to conflict with EbsCsiDriverAddOn", () => {
        const app = new cdk.App();

        const blueprint = blueprints.AutomodeBuilder.builder({});

        blueprint.account(account).region(region)
            .version("auto")
            .addOns(new blueprints.EbsCsiDriverAddOn())
            .addEBSStorageClass();

        expect(() => {
            blueprint.build(app, 'ebs-sc-addon-conflict');
        }).toThrow("Deploying ebs-sc-addon-conflict failed due to conflicting add-on: EbsCsiDriverAddOn.");
    });

    test("Kubernetes stack creation succeeds with default EBS StorageClass", () => {
        const app = new cdk.App();

        const blueprint = blueprints.AutomodeBuilder.builder({});


        blueprint.account(account).region(region)
            .version("auto")
            .addEBSStorageClass()
            .build(app, 'ebs-storageclass-stack-succeeds');

        expect(blueprint).toBeDefined();
    });
});

describe('Unit tests for Auto Mode only addons', () => {
  test("Stack creation fails due to ALB Default IngressClass on non Auto Mode Cluster", () => {
    const app = new cdk.App();

    const blueprint = new blueprints.BlueprintBuilder();

    blueprint.account(account).region(region)
      .version("auto")
      .clusterProvider(new blueprints.MngClusterProvider())
      .addOns(new blueprints.ALBDefaultIngressClassAddOn());

    expect(() => {
        blueprint.build(app, 'alb-ingressclass-non-auto');
    }).toThrow("Deploying alb-ingressclass-non-auto failed. Add-on ALBDefaultIngressClassAddOn can only be run on EKS Auto Mode clusters.");

  });

  test("Stack creation fails due to EBS Default StorageClass on non Auto Mode Cluster", () => {
    const app = new cdk.App();

    const blueprint = new blueprints.BlueprintBuilder();

    blueprint.account(account).region(region)
      .version("auto")
      .clusterProvider(new blueprints.MngClusterProvider())
      .addOns(new blueprints.EbsCsiDefaultStorageClassAddOn());

    expect(() => {
        blueprint.build(app, 'ebs-storageclass-non-auto');
    }).toThrow("Deploying ebs-storageclass-non-auto failed. Add-on EbsCsiDefaultStorageClassAddOn can only be run on EKS Auto Mode clusters.");

  });

});
