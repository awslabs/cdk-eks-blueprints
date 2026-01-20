import { AutomodeClusterProvider, AutomodeClusterProviderProps } from "../cluster-providers";
import { BlueprintBuilder } from "../stacks";
import * as addons from '../addons';

const defaultOptions: Partial<AutomodeClusterProviderProps> = {
  nodePools: ['system', 'general-purpose']
};

export class AutomodeBuilder extends BlueprintBuilder {

  public static builder(options?: Partial<AutomodeClusterProviderProps>): AutomodeBuilder {
    const builder = new AutomodeBuilder();
    const mergedOptions = { ...defaultOptions, ...options };

    builder
      .clusterProvider(new AutomodeClusterProvider(mergedOptions))
      .addOns(new addons.UsageTrackingAddOn({ tags: ["automode-builder"] }));

    return builder;
  }

  /**
   * Adds a default ingress class to the cluster for the AWS Load Balancer Controller
   */
  public addALBIngressClass(): AutomodeBuilder {
    this.addOns(new addons.ALBDefaultIngressClassAddOn());
    return this;
  }

  /**
   * Adds a default storage class to the cluster for the AWS EBS CSI
   */
  public addEBSStorageClass(): AutomodeBuilder {
    this.addOns(new addons.EbsCsiDefaultStorageClassAddOn());
    return this;
  }
}

