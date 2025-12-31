import { CfnCapability, CfnCapabilityProps } from "aws-cdk-lib/aws-eks";
import { ClusterInfo, ClusterCapability, CapabilityType } from "../spi";
import { CfnTag } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";


/**
 * Configuration properties for EKS capabilities
 */
export interface CapabilityProps {
  /** Custom name for the capability. Defaults to capability type if not provided */
  capabilityName?: string;
  /** Kubernetes namespace for the capability */
  namespace?: string;
  /** Existing IAM role ARN to use. If not provided, a new role will be created */
  roleArn?: string;
  /** Whether to use the default AWS managed policy for this capability type */
  useDefaultPolicy: boolean;
  /** Name of custom managed policy to attach (used when useDefaultPolicy is false) */
  policyName?: string;
  /** Custom inline policy document (used when useDefaultPolicy is false) */
  policyDocument?: iam.PolicyDocument;
  /** CloudFormation tags to apply */
  tags?: CfnTag[];
  /** The type of capability being created */
  type: CapabilityType;
  /** AWS Identity Center ARN (required for ArgoCD capabilities) */
  identityCenterArn?: string;
}

/**
 * Base class for EKS capabilities that provides common functionality for creating
 * and configuring EKS capabilities with proper IAM roles and policies.
 * 
 * This class handles the CDK v2.224.0+ compatibility by ensuring managed policies
 * are created within proper construct scope to avoid UnscopedValidationError.
 */
export class Capability implements ClusterCapability {
  /** 
   * Default AWS managed policy name for this capability type.
   * Set to undefined in base class for security - subclasses should override.
   */
  readonly DEFAULT_POLICY_NAME: string | undefined = undefined;
  readonly type: CapabilityType;

  /**
   * Creates a new capability instance with validation
   * @param props Configuration properties for the capability
   * @throws Error when useDefaultPolicy is false but no alternative policy is provided
   */
  constructor(readonly props: CapabilityProps) {
    this.type = props.type
    if (!props.useDefaultPolicy && !props.policyName && !props.policyDocument) {
      throw new Error("When useDefaultPolicy is false, either policyName or policyDocument must be provided");
    }
  }

  /**
   * Creates the EKS capability CloudFormation resource
   * @param clusterInfo Information about the target EKS cluster
   * @returns The created CfnCapability resource
   */
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

  /**
   * Sets up IAM role for the capability with appropriate policies.
   * Creates managed policy references within stack context to avoid CDK v2.224.0+ issues.
   * 
   * @param clusterInfo Information about the target EKS cluster
   * @param capabilityType Type of capability being created
   * @param useDefaultPolicy Whether to use the default AWS managed policy
   * @param policyName Optional custom managed policy name
   * @param policyDocument Optional inline policy document
   * @returns ARN of the created or configured IAM role
   */
  setupRole(clusterInfo: ClusterInfo, capabilityType: CapabilityType, useDefaultPolicy: boolean, policyName?: string, policyDocument?: iam.PolicyDocument): string {
    const role = new iam.Role(clusterInfo.cluster.stack, capabilityType.toString() + "-role", {
      assumedBy: new iam.ServicePrincipal("capabilities.eks.amazonaws.com").withSessionTags(),
    });

    // Policy attachment priority: default managed > custom managed > inline
    if (useDefaultPolicy && this.DEFAULT_POLICY_NAME) {
      // Create managed policy reference within stack context (CDK v2.224.0+ compatibility)
      role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(this.DEFAULT_POLICY_NAME));
    } else if (policyName) {
      role.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyName(clusterInfo.cluster.stack, policyName + "-cap-pol", policyName));
    } else if (policyDocument) {
      role.attachInlinePolicy(new iam.Policy(clusterInfo.cluster.stack, capabilityType.toString() + "-cap-pol", { document: policyDocument }));
    }

    return role.roleArn;
  }

}
