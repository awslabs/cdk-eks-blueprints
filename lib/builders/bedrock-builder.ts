import { BlueprintBuilder } from '../stacks';
import * as addons from '../addons';
import * as teams from '../teams';
import { cloneDeep } from '../utils';

export class BedrockBuilder extends BlueprintBuilder {

    /* This method helps you add a bedrock team to the blueprint.
    */ 
    public addBedrockTeam(props: teams.BedrockTeamProps) : this {
        return this.teams(new teams.BedrockTeam(cloneDeep(props)));
    }

    /**
     * This method helps you prepare a blueprint for setting up EKS cluster with 
     * usage tracking addon
     */
    public static builder(): BedrockBuilder {
        const builder = new BedrockBuilder();

        builder.addOns(
            new addons.UsageTrackingAddOn({tags: ["bedrock-builder"]}),
            new addons.AwsLoadBalancerControllerAddOn(),
            new addons.CoreDnsAddOn(),
            new addons.CertManagerAddOn(),
            new addons.KubeStateMetricsAddOn(),
            new addons.KubeProxyAddOn(),
            new addons.MetricsServerAddOn(),
            new addons.SSMAgentAddOn(),
            new addons.VpcCniAddOn(),
        );
        return builder;
    }
}

