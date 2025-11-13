import { Construct } from "constructs";
import { ClusterInfo } from "../../spi";
import { HelmAddOn, HelmAddOnProps, HelmAddOnUserProps } from "../helm-addon";

const defaultProps: HelmAddOnProps = {
  name: "unionai-dataplane-crds",
  chart: "dataplane-crds",
  release: "blueprints-addon-union-dataplane-crds",
  version: "2025.6.3",
  repository: "https://unionai.github.io/helm-charts",
  namespace: "default",
  values: {}
};

export class UnionDataplaneCRDsAddOn extends HelmAddOn {

  constructor(props?: HelmAddOnUserProps) {
    super({...defaultProps, ...props});
  }

  deploy(clusterInfo: ClusterInfo): void | Promise<Construct> {
    const chart = this.addHelmChart(clusterInfo, {}, false);
    return Promise.resolve(chart);
  }

}
