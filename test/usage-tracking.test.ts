import * as cdk from "aws-cdk-lib";
import { ClusterInfo } from "../lib/spi";
import { UsageTrackingAddOn } from "../lib";

describe('Unit tests for UsageTrackingAddOn', () => {

  test("UsageTrackingAddOn adds tags to stack description", async () => {
    // Create a CDK app and stack
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', {
      description: 'Original description'
    });

    // Create mock cluster info
    const mockClusterInfo = {
      cluster: {
        stack: stack
      }
    } as ClusterInfo;

    // Create and deploy the addon
    const addon = new UsageTrackingAddOn({ tags: ['tag1', 'tag2'] });
    addon.deploy(mockClusterInfo);

    // Verify the description was updated
    expect(stack.templateOptions.description).toBe('Original description (tag: tag1, tag2)');
  });

  test("UsageTrackingAddOn updates existing tags in description", async () => {
    // Create a CDK app and stack with existing tags
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', {
      description: 'Original description (tag: existing1)'
    });

    // Create mock cluster info
    const mockClusterInfo = {
      cluster: {
        stack: stack
      }
    } as ClusterInfo;

    // Create and deploy the addon
    const addon = new UsageTrackingAddOn({ tags: ['tag2'] });
    addon.deploy(mockClusterInfo);

    // Verify the description was updated with combined tags
    expect(stack.templateOptions.description).toBe('Original description (tag: existing1, tag2)');
  });

  test("UsageTrackingAddOn handles empty tags array", async () => {
    // Create a CDK app and stack
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack', {
      description: 'Original description'
    });

    // Create mock cluster info
    const mockClusterInfo = {
      cluster: {
        stack: stack
      }
    } as ClusterInfo;

    // Create and deploy the addon with empty tags
    const addon = new UsageTrackingAddOn({ tags: [] });
    addon.deploy(mockClusterInfo);

    // Verify the description was not changed
    expect(stack.templateOptions.description).toBe('Original description');
  });

  test("UsageTrackingAddOn does not updatedescription when it would be too long", async () => {
    // Create a CDK app and stack with a long description
    const app = new cdk.App();
    const longDescription = 'a'.repeat(512);
    const stack = new cdk.Stack(app, 'TestStack', {
      description: longDescription
    });

    // Create mock cluster info
    const mockClusterInfo = {
      cluster: {
        stack: stack
      }
    } as ClusterInfo;

    // Create and deploy the addon
    const addon = new UsageTrackingAddOn({ tags: ['tag10000000000000000000000000000', 'tag2000000000000000000000000000000000000000000000000', 'tag300000000000000000000000000000000000000000000000000000000000000000'] });
    addon.deploy(mockClusterInfo);

    expect(stack.templateOptions.description).toBe(longDescription);
  });
});

