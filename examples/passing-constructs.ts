import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as blueprints from '../lib';
import { Construct } from 'constructs';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

// Stack that creates a role
class RoleStack extends cdk.Stack {
    public readonly customRole: iam.Role;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        
        this.customRole = new iam.Role(this, 'CustomRole', {
            assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy')
            ]
        });
    }
}

// Contrived addon that takes role from another stack
class CustomRoleAddOn implements blueprints.ClusterAddOn {
    private role: iam.Role;

    constructor(role: iam.Role) {
        this.role = role;
    }

    deploy(clusterInfo: blueprints.ClusterInfo): Promise<Construct> {
        console.log(`Role ARN: ${this.role.roleArn}`);
        console.log(`Role Name: ${this.role.roleName}`);
        
        // Return a dummy construct
        return Promise.resolve(new Construct(clusterInfo.cluster, 'CustomRoleAddOn'));
    }
}

// Create role stack
const roleStack = new RoleStack(app, 'role-stack', {
    env: { account, region }
});

// Example customer issue reproduction:
const addOns: Array<blueprints.ClusterAddOn> = [
    new CustomRoleAddOn(roleStack.customRole)
];

const stack = blueprints.EksBlueprint.builder()
    .account(account)
    .region(region)
    .addOns(...addOns)
    .version("auto")
    .build(app, 'passing-constructs');

// Add dependency
stack.addDependency(roleStack);

void stack; // Keep for debugging