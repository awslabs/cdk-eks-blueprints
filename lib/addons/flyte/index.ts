import { Construct } from "constructs";
import { ClusterInfo, Values } from "../../spi";
import { HelmAddOn, HelmAddOnProps, HelmAddOnUserProps } from "../helm-addon";
import { merge } from "ts-deepmerge";

/**
 * User provided options for the Helm Chart
 */
export interface FlyteAddOnProps extends HelmAddOnUserProps {
  /**
   * To Create Namespace using CDK
   */    
  createNamespace?: boolean;

}

/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps: HelmAddOnProps & FlyteAddOnProps = {
    name: "flyte",
    namespace: "flyte",
    chart: "flyte",
    version: "v0.1.10",
    release: "flyte",
    repository:  "https://flyteorg.github.io/flyte",
    createNamespace: true,
    values: {}
};


export class FlyteAddOn extends HelmAddOn {
  readonly options: FlyteAddOnProps;

  constructor(props?: FlyteAddOnProps) {
    super({...defaultProps, ...props});
    this.options = this.props as FlyteAddOnProps;
  }

  deploy(clusterInfo: ClusterInfo): Promise<Construct> {
    const cluster = clusterInfo.cluster;
    let values: Values = this.options.values ?? {};
    values = merge(values, this.props.values ?? {});
    const chart = this.addHelmChart(clusterInfo, values, this.options?.createNamespace);

    return Promise.resolve(chart);
  }

}
