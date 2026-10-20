import { getEbsDriverPolicyDocument } from '../lib/addons/ebs-csi-driver/iam-policy';
import { getEfsDriverPolicyStatements } from '../lib/addons/efs-csi-driver/iam-policy';

// Action sets from the drivers' published example policies:
// https://github.com/kubernetes-sigs/aws-ebs-csi-driver/blob/master/docs/example-iam-policy.json
// https://github.com/kubernetes-sigs/aws-efs-csi-driver/blob/master/docs/iam-policy-example.json
const upstreamEbsActions = [
    'ec2:AttachVolume',
    'ec2:CopyVolumes',
    'ec2:CreateSnapshot',
    'ec2:CreateTags',
    'ec2:CreateVolume',
    'ec2:DeleteSnapshot',
    'ec2:DeleteTags',
    'ec2:DeleteVolume',
    'ec2:DescribeAvailabilityZones',
    'ec2:DescribeInstanceTypes',
    'ec2:DescribeInstances',
    'ec2:DescribeSnapshots',
    'ec2:DescribeTags',
    'ec2:DescribeVolumeStatus',
    'ec2:DescribeVolumes',
    'ec2:DescribeVolumesModifications',
    'ec2:DetachVolume',
    'ec2:EnableFastSnapshotRestores',
    'ec2:LockSnapshot',
    'ec2:ModifyVolume',
];

const upstreamEfsActions = [
    'ec2:DescribeAvailabilityZones',
    'elasticfilesystem:CreateAccessPoint',
    'elasticfilesystem:DeleteAccessPoint',
    'elasticfilesystem:DescribeAccessPoints',
    'elasticfilesystem:DescribeFileSystems',
    'elasticfilesystem:DescribeMountTargets',
    'elasticfilesystem:TagResource',
    's3files:CreateAccessPoint',
    's3files:DeleteAccessPoint',
    's3files:ListAccessPoints',
    's3files:ListFileSystems',
    's3files:TagResource',
];

function actionsOf(statements: { Action: string | string[] }[]): Set<string> {
    return new Set(statements.flatMap(s => (Array.isArray(s.Action) ? s.Action : [s.Action])));
}

test('EBS CSI driver policy grants every action in the upstream example policy', () => {
    const doc = getEbsDriverPolicyDocument('aws').toJSON();
    const actions = actionsOf(doc.Statement);
    expect(upstreamEbsActions.filter(a => !actions.has(a))).toEqual([]);
});

test('EBS CSI driver policy lets the driver tag volumes it creates with CopyVolumes', () => {
    const doc = getEbsDriverPolicyDocument('aws').toJSON();
    const createTags = doc.Statement.find((s: { Action: string | string[] }) => [s.Action].flat().includes('ec2:CreateTags'));
    expect(createTags.Condition.StringEquals['ec2:CreateAction']).toContain('CopyVolumes');
});

test('EFS CSI driver policy grants every action in the upstream example policy', () => {
    const actions = actionsOf(getEfsDriverPolicyStatements());
    expect(upstreamEfsActions.filter(a => !actions.has(a))).toEqual([]);
});
