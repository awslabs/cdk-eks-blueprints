import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as blueprints from '../lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

// Must have identity center set up for ArgoCD Capability
const identityCenterArn = process.env.AWS_IDENTITY_CENTER_ARN;
const idcRegion = process.env.AWS_IDENTITY_CENTER_REGION;
const identityCenterUserId = process.env.AWS_IDENTITY_CENTER_USER_ID;

const addOns: Array<blueprints.ClusterAddOn> = [
    new blueprints.addons.EksPodIdentityAgentAddOn(),
];

const clusterProvider = new blueprints.GenericClusterProvider({
    authenticationMode: eks.AuthenticationMode.API_AND_CONFIG_MAP,
    managedNodeGroups: [{
        id: "capabilities-node-group",
        instanceTypes: [new ec2.InstanceType("m5.large")],
        amiType: eks.NodegroupAmiType.AL2023_X86_64_STANDARD,
    }]
});

const stack = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .clusterProvider(clusterProvider)
    .capabilities({
        ack: new blueprints.capabilities.AckCapability({
            roleSelectors: [
                new blueprints.AckRoleSelectorBuilder("s3-role").withManagedPolicy("AmazonS3FullAccess").namespaces("s3-ns")]
        }),
        argocd: new blueprints.capabilities.ArgoCapability({
            idcInstanceArn: identityCenterArn!,
            idcRegion: idcRegion,
            roleMappings: {
                adminUsers: [identityCenterUserId!],
            },
            registerLocalCluster: true
        }),
        kro: new blueprints.capabilities.KroCapability(),
    })
    .addOns(...addOns)
    .version("auto")
    .build(app, 'capabilities-debug-stack');

void stack; // Keep for debugging
