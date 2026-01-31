import { Capability, CapabilityProps } from "./capability";
import { ArgoCDSsoRole, CapabilityType, ClusterInfo, SsoIdentityType } from "../spi";
import { CfnCapability, CfnCapabilityProps } from "aws-cdk-lib/aws-eks";
import { IVpcEndpoint } from "aws-cdk-lib/aws-ec2";

/**
 * Properties for ArgoCD capability configuration.
 * Extends base capability properties with required Identity Center ARN.
 */
export interface ArgoCapabilityProps extends Omit<CapabilityProps, "type" > {
  /** AWS Identity Center Instance ARN for ArgoCD integration */
  idcInstanceArn: string;

  idcManagedApplicationArn?: string;

  idcRegion?: string;

  serverUrl?: string;

  namespace?: string;

  networkAccessVpcEndpoints?: IVpcEndpoint[];

  roleMappings?: Partial<Record<ArgoCDSsoRole, {identityId: string, identityType: SsoIdentityType}[]>>;

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
    capabilityName: "blueprints-argocd-capability",
    namespace: "argocd"
  };


  create(clusterInfo: ClusterInfo): CfnCapability {
    const capability = super.create(clusterInfo)
    capability.configuration = {
      argoCd: {
        awsIdc: {
          idcInstanceArn: this.options.idcInstanceArn,
          idcManagedApplicationArn: this.options.idcManagedApplicationArn,
          idcRegion: this.options.idcRegion
        },
        namespace: this.options.namespace,
        networkAccess: {
          vpceIds: this.options.networkAccessVpcEndpoints?.map(endpoint => endpoint.vpcEndpointId)
        },
        rbacRoleMappings: Object.entries(this.options.roleMappings ?? {}).map(([ssoRole, ssoIdentities])=> ({
          role: ssoRole,
          identities: ssoIdentities.map(entry => ({
            id: entry.identityId,
            type: entry.identityType
          })),
        })),
        serverUrl: this.options.serverUrl
      }
    }
    return capability
  }
  /**
   * Creates a new ArgoCD capability instance.
   * 
   * @param options - Configuration options including required Identity Center ARN
   */
  constructor(readonly options: ArgoCapabilityProps) {
    super({...ArgoCapability.defaultProps, ...options, type: CapabilityType.ARGOCD});
  }
}
