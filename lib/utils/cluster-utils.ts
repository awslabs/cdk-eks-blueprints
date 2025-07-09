import { Construct } from "constructs";
import * as customResource from 'aws-cdk-lib/custom-resources';
import { ClusterInfo } from "../spi";
import { KubernetesVersion } from "@aws-cdk/aws-eks-v2-alpha";


interface Tag {
  Key: string;
  Value: string;
}

/**
 * Creates the node termination tag for the ASG
 * @param scope
 * @param autoScalingGroup 
 */
 export function tagAsg(scope: Construct, autoScalingGroup: string, tags: Tag[]): void {
  let tagList: {
    Key: string;
    Value: string;
    PropagateAtLaunch: boolean;
    ResourceId: string;
    ResourceType: string;
  }[] = [];

  tags.forEach((tag) => {
    tagList.push({
      Key: tag.Key,
      Value: tag.Value,
      PropagateAtLaunch : true,
      ResourceId: autoScalingGroup,
      ResourceType: 'auto-scaling-group'
    });
  });

  const callProps: customResource.AwsSdkCall = {
    service: 'AutoScaling',
    action: 'createOrUpdateTags',
    parameters: {
      Tags: tagList
    },
    physicalResourceId: customResource.PhysicalResourceId.of(
      `${autoScalingGroup}-asg-tag`
    )
  };

  new customResource.AwsCustomResource(scope, 'asg-tag', {
    onCreate: callProps,
    onUpdate: callProps,
    policy: customResource.AwsCustomResourcePolicy.fromSdkCalls({
      resources: customResource.AwsCustomResourcePolicy.ANY_RESOURCE
    })
  });
}

export function checkEKSVersion(minVersion: KubernetesVersion, clusterVersion: KubernetesVersion): boolean {
  const minVersionMatch = minVersion.version.match(/(\d+)\.(\d+)/);
  let targetMajor = 0;
  let targetMinor = 0;
  if (minVersionMatch) {
    targetMajor = parseInt(minVersionMatch[1], 10);
    targetMinor = parseInt(minVersionMatch[2], 10);
  }

  const versionMatch = clusterVersion.version.match(/(\d+)\.(\d+)/);

  let major = 0;
  let minor = 0;
  if (versionMatch) {
    major = parseInt(versionMatch[1], 10);
    minor = parseInt(versionMatch[2], 10);
  }

  return (major > targetMajor) || (major === targetMajor && minor >= targetMinor);
}

/**
 * Makes the provided construct run before any capacity (worker nodes) is provisioned on the cluster.
 * Useful for control plane add-ons, such as VPC-CNI that must be provisioned before EC2 (or Fargate) capacity is added.
 * @param construct identifies construct (such as core add-on) that should be provisioned before capacity
 * @param clusterInfo cluster provisioning context
 */
export function deployBeforeCapacity(construct: Construct, clusterInfo: ClusterInfo) {
    let allCapacity : Construct[]  = [];
    allCapacity = allCapacity.concat(clusterInfo.nodeGroups ?? [])
        .concat(clusterInfo.autoscalingGroups ?? [])
        .concat(clusterInfo.fargateProfiles ?? []);
    allCapacity.forEach(v => v.node.addDependency(construct));
}
