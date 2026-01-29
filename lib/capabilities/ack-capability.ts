import { CapabilityProps, Capability } from "./capability";
import { CapabilityType } from "../spi";

/**
 * Properties for ACK capability, excluding namespace, type, and identityCenterArn
 * which are not applicable for ACK capabilities.
 */
export type AckCapabilityProps = Omit<CapabilityProps, "namespace" | "type" | "identityCenterArn">;

/**
 * AWS Controllers for Kubernetes (ACK) capability for EKS clusters.
 * Enables direct management of AWS services from Kubernetes using custom resources.
 * Uses AdministratorAccess policy by default for broad AWS service management.
 * ```
 */
export class AckCapability extends Capability {
  /** Default AWS managed policy providing full administrative access */
  readonly DEFAULT_POLICY_NAME = "AdministratorAccess";
  
  /** Default configuration for ACK capabilities */
  static readonly defaultProps: AckCapabilityProps= {
    useDefaultPolicy: true,
    capabilityName: "blueprints-ack-capability"
  };

  /**
   * Creates a new ACK capability instance.
   * 
   * @param options - Configuration options for the ACK capability
   */
  constructor(readonly options: AckCapabilityProps) {
    super({...AckCapability.defaultProps, ...options, type: CapabilityType.ACK});
  }
}
