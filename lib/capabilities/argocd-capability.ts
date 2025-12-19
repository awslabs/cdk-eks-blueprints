import { Capability, CapabilityProps, CapabilityType } from "."

export interface ArgoCapabilityProps extends Omit<CapabilityProps, "type" | "identityCenterArn"> {

  identityCenterArn: string;

}

export class ArgoCapability extends Capability {
  static readonly DEFAULT_POLICY_NAME = "AWSSecretsManagerClientReadOnlyAccess";

  static readonly defaultProps: Partial<ArgoCapabilityProps>= {
    useDefaultPolicy: true,
    capabilityName: "blueprints-argocd-cap",
    namespace: "argocd"
  };

  constructor(readonly options: ArgoCapabilityProps) {
    super({...ArgoCapability.defaultProps, ...options, type: CapabilityType.ARGOCD});
  }
}
