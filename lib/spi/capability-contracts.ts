import { CfnCapability } from "aws-cdk-lib/aws-eks";
import { ClusterInfo } from "./types";

export declare interface ClusterCapability {
  create(clusterInfo: ClusterInfo): CfnCapability
}
