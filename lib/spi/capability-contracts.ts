import { CfnCapability } from "aws-cdk-lib/aws-eks";
import { CapabilityType, ClusterInfo } from "./types";
import { Construct } from "constructs";

/**
 * ClusterCapability is the interface to which all EKS Capabilities will conform.
 */
export declare interface ClusterCapability {
  /**
   * CapabilityType
   */
  type:  CapabilityType

  /**
   * Creates the capability on the cluster
   * @param clusterInfo
   * @returns cdk.Construct
   */
  create(clusterInfo: ClusterInfo): Construct
}
