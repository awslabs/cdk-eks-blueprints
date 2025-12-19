import { CfnCapability, CfnCapabilityProps } from "aws-cdk-lib/aws-eks";
import { ClusterInfo, ClusterCapability } from "../spi";
import { CfnTag } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

export enum CapabilityType {
  ARGOCD,
  ACK,
  KRO
};

export interface CapabilityProps {
  capabilityName?: string;
  namespace?: string;
  roleArn?: string;
  useDefaultPolicy: boolean
  policyName?: string
  policyDocument?: iam.PolicyDocument;
  tags?: CfnTag[];
  type: CapabilityType;
  identityCenterArn?: string;
};


export class Capability implements ClusterCapability {
  readonly DEFAULT_POLICY_NAME: string | undefined = undefined;

  constructor(readonly props: CapabilityProps) {
    if (!props.useDefaultPolicy && !props.policyName && !props.policyDocument) {
      throw new Error("When useDefaultPolicy is false, either policyName or policyDocument must be provided");
    }
  }

  create(clusterInfo: ClusterInfo): CfnCapability {

    const capabilityProps: CfnCapabilityProps = {
      capabilityName: this.props.capabilityName || this.props.type.toString().toLowerCase(),
      clusterName: clusterInfo.cluster.clusterName,
      roleArn: this.props.roleArn || this.setupRole(clusterInfo, this.props.type, this.props.useDefaultPolicy, this.props.policyName, this.props.policyDocument),
      type: this.props.type.toString(),
      deletePropagationPolicy: "RETAIN",
      ...(this.props.type === CapabilityType.ARGOCD && {
        configuration: {
          argoCd: {
            awsIdc: {
              idcInstanceArn: this.props.identityCenterArn!
            },
            namespace: this.props.namespace
          }
        }
      }),
      tags: this.props.tags
    };
    return new CfnCapability(clusterInfo.cluster.stack, capabilityProps.capabilityName + "-capability", capabilityProps);
  }

  setupRole(clusterInfo: ClusterInfo, capabilityType: CapabilityType, useDefaultPolicy: boolean, policyName?: string, policyDocument?: iam.PolicyDocument): string {
    const role = new iam.Role(clusterInfo.cluster.stack, capabilityType.toString() + "-role", {
      assumedBy: new iam.ServicePrincipal("capabilities.eks.amazonaws.com").withSessionTags(),
    });

    // Priority: default > custom managed policy name > inline policy 
    if (useDefaultPolicy && this.DEFAULT_POLICY_NAME) {
      role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(this.DEFAULT_POLICY_NAME));
    } else if (policyName) {
      role.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyName(clusterInfo.cluster.stack, policyName + "-cap-pol", policyName));
    } else if (policyDocument) {
      role.attachInlinePolicy(new iam.Policy(clusterInfo.cluster.stack, capabilityType.toString() + "-cap-pol", { document: policyDocument }));
    }

    return role.roleArn;
  }

}
