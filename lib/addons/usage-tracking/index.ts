import { Construct } from "constructs";
import { ClusterAddOn, ClusterInfo } from "../../spi";
import * as eksv2 from "@aws-cdk/aws-eks-v2-alpha";

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
    let stack;

    if (clusterInfo.clusterv2 instanceof eksv2.Cluster) {
      stack = clusterInfo.clusterv2.stack;
    } else {
      stack = clusterInfo.cluster.stack;
    }
    const tracking = new TaggedUsageTracking(stack.templateOptions.description || '');
    tracking.addTags(this.props.tags);

    
    stack.templateOptions.description = tracking.buildDescription();
  }

}

class TaggedUsageTracking {

  static TAGS_REGEX = /\(tag: ([^)]+)\)$/;

  description: string;

  tags: string[] = [];

  constructor(description: string) {
    this.description = description;
    const tagsMatch = this.description.match(TaggedUsageTracking.TAGS_REGEX);
    if (tagsMatch) {
      const existingTagsString = tagsMatch[1].trim();
      this.tags = existingTagsString.split(',').map(tag => tag.trim());
    }
  }

  addTags(tags: string | string[]) {
    const newTags = Array.isArray(tags) ? tags : [tags];
    this.tags = [...new Set([...this.tags, ...newTags])];
  }

  buildDescription(): string {
    if (this.tags.length === 0) {
      return this.description.replace(TaggedUsageTracking.TAGS_REGEX, '').trim();
    }
    const tagsString = this.tags.join(', ');

    const tagsMatch = this.description.match(TaggedUsageTracking.TAGS_REGEX);

    let newDescription: string;
    // if tags section exists, replace, otherwise add new section
    if (tagsMatch) {
      newDescription = this.description.replace(TaggedUsageTracking.TAGS_REGEX, `(tag: ${tagsString})`);
    } else {
      newDescription = `${this.description} (tag: ${tagsString})`.trim();
    }

    // if length is too long, print to stderr and return old description
    if (newDescription.length > 1024) {
      console.error('Stack description is too long. Please remove some tags.');
      return this.description;
    } else {
      return newDescription;
    }
  }

  


}
