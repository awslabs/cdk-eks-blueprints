import { Capability, CapabilityProps } from "./capability";
import { CapabilityType } from "../spi";

/**
 * Properties for ArgoCD capability configuration.
 * Extends base capability properties with required Identity Center ARN.
 */
export interface ArgoCapabilityProps extends Omit<CapabilityProps, "type" | "identityCenterArn"> {
  /** AWS Identity Center ARN for ArgoCD integration */
  identityCenterArn: string;
}

/**
 * ArgoCD capability for EKS clusters.
 * Enables GitOps workflows and continuous deployment through ArgoCD integration.
 * Requires AWS Identity Center for authentication and uses Secrets Manager for credential access.
 * 
 * @example
 * ```typescript
 * const argoCapability = new ArgoCapability({
 *   identityCenterArn: "arn:aws:sso:::instance/ssoins-1234567890abcdef",
 *   capabilityName: "my-argocd-capability",
 *   namespace: "argocd"
 * });
 * ```
 */
export class ArgoCapability extends Capability {
  /** Default AWS managed policy for Secrets Manager read access */
  readonly DEFAULT_POLICY_NAME = "AWSSecretsManagerClientReadOnlyAccess";

  /** Default configuration for ArgoCD capabilities */
  static readonly defaultProps: Partial<ArgoCapabilityProps>= {
    useDefaultPolicy: true,
    capabilityName: "blueprints-argocd-cap",
    namespace: "argocd"
  };

  /**
   * Creates a new ArgoCD capability instance.
   * 
   * @param options - Configuration options including required Identity Center ARN
   */
  constructor(readonly options: ArgoCapabilityProps) {
    super({...ArgoCapability.defaultProps, ...options, type: CapabilityType.ARGOCD});
  }
}
