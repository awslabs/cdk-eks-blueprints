import { Construct } from "constructs";
import { ClusterAddOn, ClusterInfo } from "../../spi";
import * as eksv2 from "@aws-cdk/aws-eks-v2-alpha";
import * as cdk from "aws-cdk-lib";

/** 
 * Properties for UsageTracking
 */
export class UsageTrackingAddOnProps {
  /**
   * tags to add to stack description
  */
  readonly tags: string[];
}
export class UsageTrackingAddOn implements ClusterAddOn {

  readonly props: UsageTrackingAddOnProps;

  constructor(props: UsageTrackingAddOnProps) {
    this.props = props;
  }

  deploy(clusterInfo: ClusterInfo): Promise<Construct> | void {

    if (this.props.tags.length == 0) {
      return;
    }

    if (clusterInfo.clusterv2 instanceof eksv2.Cluster) {
      const stack = clusterInfo.clusterv2.stack;
      this.updateStackDescription(stack, this.props.tags);
    } else {
      const stack = clusterInfo.cluster.stack;
      this.updateStackDescription(stack, this.props.tags);
    }
  }

  private updateStackDescription(stack: cdk.Stack, tags: string[]): void {
    const currentDescription = stack.templateOptions.description || '';
    const tagsRegex = /\(tag: ([^)]+)\)$/;
    const tagsMatch = currentDescription.match(tagsRegex);

    let newDescription: string;

    // If tags exist, append tags
    if (tagsMatch) {
      const existingTagsString = tagsMatch[1].trim();
      const existingTags = existingTagsString.split(',').map(tag => tag.trim());

      const allTags = [...new Set([...existingTags, ...tags])];
 
      const updatedTagsString = allTags.join(', ');

      newDescription = currentDescription.replace(tagsRegex, `(tag: ${updatedTagsString})`);

      // otherwise add tags to description
    } else {
      const tagsString = tags.join(', ');
      newDescription = `${currentDescription} (tag: ${tagsString})`;
    }

    stack.templateOptions.description = newDescription;
  }
 

}
