import { AutomodeClusterProvider, AutomodeClusterProviderProps } from "../cluster-providers";
import * as eks from "aws-cdk-lib/aws-eks";
import { merge } from "ts-deepmerge";
import { BlueprintBuilder } from "../stacks";
import * as addons from '../addons';

const defaultOptions: Partial<AutomodeClusterProviderProps> = {
    version: eks.KubernetesVersion.V1_31,
    nodePools: ['system','general-purpose']
};

export class AutomodeBuilder extends BlueprintBuilder {

    public static builder(options: Partial<AutomodeClusterProviderProps>): AutomodeBuilder {
        const builder = new AutomodeBuilder();
        const mergedOptions = merge(defaultOptions, options);

        builder
            .clusterProvider(new AutomodeClusterProvider(mergedOptions))
            .addOns(new addons.UsageTrackingAddOn({tags: ["automode-builder"]}));

        return builder; 
    }
}

