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
            .addOns(new blueprints.EbsCsiDriverAddOn({version: "v1.48.0-eksbuild.2"}))
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

describe('Unit tests for Auto Mode conflicting addons', () => {
  test("Stack creation succeeds for ALB LoadBalancer Controller on AutoMode", () => {
    const app = new cdk.App();

    const blueprint = blueprints.AutomodeBuilder.builder({});

    blueprint.account(account).region(region)
      .version("auto")
      .addOns(new blueprints.AwsLoadBalancerControllerAddOn());

    expect(() => {
        blueprint.build(app, 'aws-lbc-auto');
    }).toBeDefined();

  });

  test("Stack creation succeeds for CoreDnsAddOn on AutoMode", () => {
    const app = new cdk.App();

    const blueprint = blueprints.AutomodeBuilder.builder({});

    blueprint.account(account).region(region)
      .version("auto")
      .addOns(new blueprints.CoreDnsAddOn("v1.12.1-eksbuild.2"));

    expect(() => {
        blueprint.build(app, 'cdns-auto');
    }).toBeDefined();

  });

  test("Stack creation fails for EbsCsiDriverAddOn with old version on AutoMode", () => {
    const app = new cdk.App();

    const blueprint = blueprints.AutomodeBuilder.builder({});

    blueprint.account(account).region(region)
      .version("auto")
      .addOns(new blueprints.EbsCsiDriverAddOn({version: "v1.30.0-eksbuild.1"}));

    expect(() => {
        blueprint.build(app, 'aws-ebscsi-auto');
    }).toThrow("Add-on EbsCsiDriverAddOn version v1.30.0-eksbuild.1 is incompatible. Minimum required version: v1.37.0-eksbuild.1");
  });

  test("Stack creation fails for EksPodIdentityAgentAddOn with old version on AutoMode", () => {
    const app = new cdk.App();

    const blueprint = blueprints.AutomodeBuilder.builder({});

    blueprint.account(account).region(region)
      .version("auto")
      .addOns(new blueprints.EksPodIdentityAgentAddOn("v1.3.0-eksbuild.1"));

    expect(() => {
        blueprint.build(app, 'eks-podidentity-auto');
    }).toThrow("Add-on EksPodIdentityAgentAddOn version v1.3.0-eksbuild.1 is incompatible. Minimum required version: v1.3.4-eksbuild.1");
  });

  test("Stack creation fails for KubeProxyAddOn with old version on AutoMode", () => {
    const app = new cdk.App();

    const blueprint = blueprints.AutomodeBuilder.builder({});

    blueprint.account(account).region(region)
      .version("auto")
      .addOns(new blueprints.KubeProxyAddOn("v1.10.0-eksbuild.1"));

    expect(() => {
        blueprint.build(app, 'kubeproxy-auto');
    }).toThrow("Add-on KubeProxyAddOn version v1.10.0-eksbuild.1 is incompatible. Minimum required version: v1.29.10-eksbuild.3");

  });

  test("Stack creation fails for VpcCniAddOn with old version on AutoMode", () => {
    const app = new cdk.App();

    const blueprint = blueprints.AutomodeBuilder.builder({});

    blueprint.account(account).region(region)
      .version("auto")
      .addOns(new blueprints.VpcCniAddOn({version: "v1.10.0-eksbuild.1"}));

    expect(() => {
        blueprint.build(app, 'vpccni-auto');
    }).toThrow("Add-on VpcCniAddOn version v1.10.0-eksbuild.1 is incompatible. Minimum required version: v1.19.0-eksbuild.1");

  });

  test("Stack creation fails for KarpenterV1AddOn on AutoMode", () => {
    const app = new cdk.App();

    const blueprint = blueprints.AutomodeBuilder.builder({});

    blueprint.account(account).region(region)
      .version("auto")
      .addOns(new blueprints.KarpenterV1AddOn());

    expect(() => {
        blueprint.build(app, 'karpenter-auto');
    }).toThrow("Add-on KarpenterV1AddOn is already available on the cluster with EKS Auto Mode");

  });

  test("Stack creation fails for SSMAgentAddOn on AutoMode", () => {
    const app = new cdk.App();

    const blueprint = blueprints.AutomodeBuilder.builder({});

    blueprint.account(account).region(region)
      .version("auto")
      .addOns(new blueprints.SSMAgentAddOn());

    expect(() => {
        blueprint.build(app, 'ssm-auto');
    }).toThrow("Add-on SSMAgentAddOn is not supported on EKS Auto Mode");

  });

});
