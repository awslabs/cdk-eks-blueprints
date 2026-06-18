import * as eks from "aws-cdk-lib/aws-eks-v2";
import * as utils from "../utils";
import { AutoscalingNodeGroup, ManagedNodeGroup } from "./types";

export class ManagedNodeGroupConstraints implements utils.ConstraintsType<ManagedNodeGroup> {
    /**
     * id can be no less than 1 character long, and no greater than 63 characters long due to DNS system limitations.
     * https://kubernetes.io/docs/concepts/overview/working-with-objects/names/
     */
    id = new utils.StringConstraint(1, 63);

    /**
    * nodes per node group has a soft limit of 450 nodes, and as little as 0. But we multiply that by a factor of 5 to 2250 in case
    * of situations of a hard limit request being accepted, and as a result the limit would be raised
    * https://docs.aws.amazon.com/eks/latest/userguide/service-quotas.html
    */
    minSize = new utils.NumberConstraint(0, 2250);

    /**
     * nodes per node group has a soft limit of 450 nodes, and as little as 0. But we multiply that by a factor of 5 to 2250 in case
     * of situations of a hard limit request being accepted, and as a result the limit would be raised
     * https://docs.aws.amazon.com/eks/latest/userguide/service-quotas.html
     */
    maxSize = new utils.NumberConstraint(0, 2250);

    /**
     * Nodes per node group has a soft limit of 450 nodes, and as little as 0. But we multiply that by a factor of 5 to 2250 in case
     * of situations of a hard limit request being accepted, and as a result the limit would be raised
     * https://docs.aws.amazon.com/eks/latest/userguide/service-quotas.html
     */
    desiredSize = new utils.NumberConstraint(0, 2250);

    /**
     * amiReleaseVersion can be no less than 1 character long, and no greater than 1024 characters long.
     * https://docs.aws.amazon.com/imagebuilder/latest/APIReference/API_Ami.html
     */
    amiReleaseVersion = new utils.StringConstraint(1, 1024);
}

export class AutoscalingNodeGroupConstraints implements utils.ConstraintsType<AutoscalingNodeGroup> {
    /**
    * id can be no less than 1 character long, and no greater than 63 characters long due to DNS system limitations.
    * https://kubernetes.io/docs/concepts/overview/working-with-objects/names/
    */
    id = new utils.StringConstraint(1, 63);

    /**
    * Allowed range is 0 to 5000 inclusive.
    * https://kubernetes.io/docs/setup/best-practices/cluster-large/
    */
    minSize = new utils.NumberConstraint(0, 5000);

    /**
    * Allowed range is 0 to 5000 inclusive.
    * https://kubernetes.io/docs/setup/best-practices/cluster-large/
    */
    maxSize = new utils.NumberConstraint(0, 5000);

    /**
    * Allowed range is 0 to 5000 inclusive.
    * https://kubernetes.io/docs/setup/best-practices/cluster-large/
    */
    desiredSize = new utils.NumberConstraint(0, 5000);
}

export class FargateProfileConstraints implements utils.ConstraintsType<eks.FargateProfileOptions> {
    /**
    * fargateProfileNames can be no less than 1 character long, and no greater than 63 characters long due to DNS system limitations.
    * https://kubernetes.io/docs/concepts/overview/working-with-objects/names/
    */
    fargateProfileName = new utils.StringConstraint(1, 63);
}

