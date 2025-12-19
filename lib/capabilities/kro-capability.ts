import { Capability, CapabilityProps, CapabilityType } from ".";

export type KroCapabilityProps = Omit<CapabilityProps, "namespace" | "type" | "identityCenterArn">;


export class KroCapability extends Capability {
  static readonly DEFAULT_POLICY_NAME = undefined;
  static readonly defaultProps: KroCapabilityProps = {
    useDefaultPolicy: true,
    capabilityName: "blueprints-kro-cap"
  }

  constructor(readonly options: KroCapabilityProps){
    super({...KroCapability.defaultProps, ...options, type: CapabilityType.KRO});
  }

}
