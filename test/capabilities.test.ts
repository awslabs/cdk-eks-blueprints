import * as cdk from 'aws-cdk-lib';
import * as blueprints from '../lib';
import { Template } from 'aws-cdk-lib/assertions';

describe('Unit tests for EKS Capabilities', () => {

    test("ACK capability creates CfnCapability resource", () => {
        const app = new cdk.App();

        const stack = blueprints.EksBlueprint.builder()
            .account('123456789').region('us-west-1')
            .version("auto")
            .capabilities({ ack: new blueprints.capabilities.AckCapability() })
            .build(app, 'ack-capability-test');

        const template = Template.fromStack(stack);
        template.hasResourceProperties("AWS::EKS::Capability", {
            Type: "ACK",
        });
    });

    test("ACK capability creates IAM role with correct service principal", () => {
        const app = new cdk.App();

        const stack = blueprints.EksBlueprint.builder()
            .account('123456789').region('us-west-1')
            .version("auto")
            .capabilities({ ack: new blueprints.capabilities.AckCapability() })
            .build(app, 'ack-capability-role');

        const template = Template.fromStack(stack);
        template.hasResourceProperties("AWS::IAM::Role", {
            AssumeRolePolicyDocument: {
                Statement: [{
                    Action: ["sts:AssumeRole", "sts:TagSession"],
                    Effect: "Allow",
                    Principal: { Service: "capabilities.eks.amazonaws.com" },
                }],
            },
        });
    });

    test("ACK capability uses AdministratorAccess policy by default", () => {
        const app = new cdk.App();

        const stack = blueprints.EksBlueprint.builder()
            .account('123456789').region('us-west-1')
            .version("auto")
            .capabilities({ ack: new blueprints.capabilities.AckCapability() })
            .build(app, 'ack-capability-policy');

        const template = Template.fromStack(stack);
        template.hasResourceProperties("AWS::IAM::Role", {
            ManagedPolicyArns: [{
                "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" }, ":iam::aws:policy/AdministratorAccess"]],
            }],
        });
    });

    test("ACK capability uses custom role ARN when provided", () => {
        const app = new cdk.App();

        const stack = blueprints.EksBlueprint.builder()
            .account('123456789').region('us-west-1')
            .version("auto")
            .capabilities({ ack: new blueprints.capabilities.AckCapability({ roleArn: "arn:aws:iam::123456789:role/my-ack-role" }) })
            .build(app, 'ack-capability-custom-role');

        const template = Template.fromStack(stack);
        template.hasResourceProperties("AWS::EKS::Capability", {
            Type: "ACK",
            RoleArn: "arn:aws:iam::123456789:role/my-ack-role",
        });
    });

    test("KRO capability creates CfnCapability resource", () => {
        const app = new cdk.App();

        const stack = blueprints.EksBlueprint.builder()
            .account('123456789').region('us-west-1')
            .version("auto")
            .capabilities({ kro: new blueprints.capabilities.KroCapability() })
            .build(app, 'kro-capability-test');

        const template = Template.fromStack(stack);
        template.hasResourceProperties("AWS::EKS::Capability", {
            Type: "KRO",
        });
    });

    test("ArgoCD capability creates CfnCapability with IDC config", () => {
        const app = new cdk.App();

        const stack = blueprints.EksBlueprint.builder()
            .account('123456789').region('us-west-1')
            .version("auto")
            .capabilities({
                argocd: new blueprints.capabilities.ArgoCapability({
                    idcInstanceArn: "arn:aws:sso:::instance/ssoins-1234567890abcdef",
                }),
            })
            .build(app, 'argocd-capability-test');

        const template = Template.fromStack(stack);
        template.hasResourceProperties("AWS::EKS::Capability", {
            Type: "ARGOCD",
            Configuration: {
                ArgoCd: {
                    AwsIdc: {
                        IdcInstanceArn: "arn:aws:sso:::instance/ssoins-1234567890abcdef",
                    },
                },
            },
        });
    });

    test("ArgoCD capability includes role mappings via simplified props", () => {
        const app = new cdk.App();

        const stack = blueprints.EksBlueprint.builder()
            .account('123456789').region('us-west-1')
            .version("auto")
            .capabilities({
                argocd: new blueprints.capabilities.ArgoCapability({
                    idcInstanceArn: "arn:aws:sso:::instance/ssoins-1234567890abcdef",
                    roleMappings: {
                        adminUsers: ["user-id-123"],
                        viewerGroups: ["group-id-456"],
                    },
                }),
            })
            .build(app, 'argocd-capability-roles');

        const template = Template.fromStack(stack);
        template.hasResourceProperties("AWS::EKS::Capability", {
            Configuration: {
                ArgoCd: {
                    RbacRoleMappings: [
                        {
                            Role: "ADMIN",
                            Identities: [{ Id: "user-id-123", Type: "SSO_USER" }],
                        },
                        {
                            Role: "VIEWER",
                            Identities: [{ Id: "group-id-456", Type: "SSO_GROUP" }],
                        },
                    ],
                },
            },
        });
    });

    test("ArgoCD capability includes role mappings via builder methods", () => {
        const app = new cdk.App();

        const argo = new blueprints.capabilities.ArgoCapability({
            idcInstanceArn: "arn:aws:sso:::instance/ssoins-1234567890abcdef",
        })
        .addAdmin("user-id-123", blueprints.SsoIdentityType.SSO_USER)
        .addViewer("group-id-456", blueprints.SsoIdentityType.SSO_GROUP);

        const stack = blueprints.EksBlueprint.builder()
            .account('123456789').region('us-west-1')
            .version("auto")
            .capabilities({ argocd: argo })
            .build(app, 'argocd-capability-builder');

        const template = Template.fromStack(stack);
        template.hasResourceProperties("AWS::EKS::Capability", {
            Configuration: {
                ArgoCd: {
                    RbacRoleMappings: [
                        {
                            Role: "ADMIN",
                            Identities: [{ Id: "user-id-123", Type: "SSO_USER" }],
                        },
                        {
                            Role: "VIEWER",
                            Identities: [{ Id: "group-id-456", Type: "SSO_GROUP" }],
                        },
                    ],
                },
            },
        });
    });

    test("Multiple capabilities can be added to a cluster", () => {
        const app = new cdk.App();

        const stack = blueprints.EksBlueprint.builder()
            .account('123456789').region('us-west-1')
            .version("auto")
            .capabilities({
                ack: new blueprints.capabilities.AckCapability(),
                kro: new blueprints.capabilities.KroCapability(),
            })
            .build(app, 'multi-capability-test');

        const template = Template.fromStack(stack);
        const capabilities = template.findResources("AWS::EKS::Capability");
        expect(Object.keys(capabilities).length).toEqual(2);
    });
});

describe('Unit tests for Capability-AddOn conflict detection', () => {

    test("AckAddOn fails when ACK capability is present", () => {
        const app = new cdk.App();

        const builder = blueprints.EksBlueprint.builder()
            .account('123456789').region('us-west-1')
            .version("auto")
            .capabilities({ ack: new blueprints.capabilities.AckCapability() })
            .addOns(new blueprints.AckAddOn({ serviceName: blueprints.AckServiceName.RDS }));

        expect(() => {
            builder.build(app, 'ack-addon-conflict');
        }).toThrow(/conflicting EKS Capability/);
    });

    test("ArgoCDAddOn fails when ArgoCD capability is present", () => {
        const app = new cdk.App();

        const builder = blueprints.EksBlueprint.builder()
            .account('123456789').region('us-west-1')
            .version("auto")
            .capabilities({
                argocd: new blueprints.capabilities.ArgoCapability({
                    idcInstanceArn: "arn:aws:sso:::instance/ssoins-1234567890abcdef",
                }),
            })
            .addOns(new blueprints.ArgoCDAddOn());

        expect(() => {
            builder.build(app, 'argocd-addon-conflict');
        }).toThrow(/conflicting EKS Capability/);
    });
});
