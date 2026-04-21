import { CapabilityProps, Capability } from "./capability";
import { CapabilityType, ClusterInfo } from "../spi";
import { CfnCapability } from "aws-cdk-lib/aws-eks";
import * as iam from "aws-cdk-lib/aws-iam";

/**
 * Scopes an IAMRoleSelector to specific Kubernetes resource types.
 */
export interface AckResourceTypeSelector {
  group: string;
  version: string;
  kind: string;
}

/**
 * Properties for ACK capability.
 */
export interface AckCapabilityProps extends Omit<CapabilityProps, "type"> {
  /** IAM Role Selectors for granular permission control */
  roleSelectors?: Record<string, any>[];
}

/**
 * Builder for constructing AckRoleSelector instances.
 */
export class AckRoleSelectorBuilder {
  private _name: string;
  private _roleArn: string;
  private _namespaceNames?: string[];
  private _namespaceLabelSelector?: Record<string, string>;
  private _resourceTypeSelector?: AckResourceTypeSelector[];

  constructor(name: string, roleArn: string) {
    this._name = name;
    this._roleArn = roleArn;
  }

  /** Scope to specific namespace names */
  namespaces(...namespaces: string[]): this {
    this._namespaceNames = namespaces;
    return this;
  }

  /** Scope to namespaces matching labels */
  namespaceLabels(labels: Record<string, string>): this {
    this._namespaceLabelSelector = labels;
    return this;
  }

  /** Scope to specific resource types */
  resourceTypes(...types: AckResourceTypeSelector[]): this {
    this._resourceTypeSelector = types;
    return this;
  }

  /** Builds k8s manifest for IAMRoleSelector */
  build(): Record<string, any>{
    const hasNsSelector = this._namespaceNames || this._namespaceLabelSelector;

    return {
      apiVersion: "services.k8s.aws/v1alpha1",
      kind: "IAMRoleSelector",
      metadata: { name: this._name },
      spec: {
        arn: this._roleArn,
        ...(hasNsSelector && {
          namespaceSelector: {
            ...(this._namespaceNames && { names: this._namespaceNames }),
            ...(this._namespaceLabelSelector && { labelSelector: { matchLabels: this._namespaceLabelSelector } }),
          },
        }),
        ...(this._resourceTypeSelector?.length && { resourceTypeSelector: this._resourceTypeSelector }),
      },
    };
  }
}

/**
 * AWS Controllers for Kubernetes (ACK) capability for EKS clusters.
 * Requires either direct IAM permissions or roleSelectors to be provided.
 *
 * @example
 * ```typescript
 * // Namespace-scoped with resource type filtering
 * new AckCapability({
 *   roleSelectors: [
 *     new AckRoleSelectorBuilder("s3-prod", "arn:aws:iam::123:role/S3Role")
 *       .namespaces("production")
 *       .resourceTypes({ group: "s3.services.k8s.aws", version: "v1alpha1", kind: "Bucket" })
 *       .build(),
 *   ],
 * })
 *
 * // Cluster-wide
 * new AckCapability({
 *   roleSelectors: [
 *     new AckRoleSelectorBuilder("admin", "arn:aws:iam::123:role/AdminRole").build(),
 *   ],
 * })
 * ```
 */
export class AckCapability extends Capability {
  readonly DEFAULT_POLICY_NAME = undefined;

  static readonly defaultProps: Partial<AckCapabilityProps> = {
    capabilityName: "blueprints-ack-capability"
  };

  constructor(readonly options: AckCapabilityProps) {
    super({ ...AckCapability.defaultProps, ...options, type: CapabilityType.ACK });
    if (!options.roleArn && !options.policyName && !options.policyDocument && !options.roleSelectors?.length) {
      throw new Error("AckCapability requires one of: roleArn, policyName, policyDocument, or roleSelectors.");
    }
  }

  create(clusterInfo: ClusterInfo): CfnCapability {
    if (this.options.roleSelectors?.length) {
      this.props.policyDocument = new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: ["sts:AssumeRole", "sts:TagSession"],
            resources: this.options.roleSelectors.map(s => s.spec.arn),
          }),
        ],
      });
    }

    const capability = super.create(clusterInfo);

    if (this.options.roleSelectors?.length) {
      for (const selector of this.options.roleSelectors) {
        clusterInfo.cluster.addManifest(`ack-role-selector-${selector.metadata.name}`, selector);
      }
    }
    return capability;
  }
}
