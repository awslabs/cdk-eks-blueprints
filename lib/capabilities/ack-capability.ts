import { CapabilityProps, CapabilityType, Capability } from "."

export type AckCapabilityProps = Omit<CapabilityProps, "namespace" | "type" | "identityCenterArn">;

export class AckCapability extends Capability {
  static readonly DEFAULT_POLICY_NAME = "AdministratorAccess";
  static readonly defaultProps: AckCapabilityProps= {
    useDefaultPolicy: true,
    capabilityName: "blueprints-ack-cap"
  };

  constructor(readonly options: AckCapabilityProps) {
    super({...AckCapability.defaultProps, ...options, type: CapabilityType.ACK});
  }
}
