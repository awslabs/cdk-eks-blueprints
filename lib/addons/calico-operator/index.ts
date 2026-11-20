import { merge } from "ts-deepmerge";
import { ClusterInfo } from "../../spi";
import { HelmAddOn, HelmAddOnUserProps } from "../helm-addon";
import { supportsALL } from "../../utils";

/**
 * Configuration options for the add-on.
 */
export interface CalicoOperatorAddOnProps extends HelmAddOnUserProps {

    /**
     * Namespace where Calico will be installed
     * @default kube-system
     */
    namespace?: string;

    /**
     * Helm chart version to use to install.
     * @default 3.30.3
     */
    version?: string;

    /**
     * Values for the Helm chart.
     */
    values?: any;
}

/**
 * Defaults options for the add-on
 */
const defaultProps = {
    name: 'calico-operator',
    namespace: 'calico-operator',
    version: 'v3.31.7', // v3.27.2' latest is causing issues on cdk destroy
    chart: "tigera-operator",
    release: "bp-addon-calico-operator",
    repository: "https://docs.tigera.io/calico/charts"
};

@supportsALL
export class CalicoOperatorAddOn extends HelmAddOn {

    private options: CalicoOperatorAddOnProps;

    constructor(props?: CalicoOperatorAddOnProps) {
        super({...defaultProps, ...props });
        this.options = this.props;
    }

    deploy(clusterInfo: ClusterInfo): void {
        const values = this.options.values ?? {};
        // The operator sets Installation.spec.kubernetesProvider to "EKS" on EKS clusters and owns that field.
        // The chart default is "", so Helm 4 (server-side apply) hits a field-ownership conflict on every upgrade.
        // Setting the same value the operator writes (as in the Calico EKS install guide) avoids the conflict.
        const defaultValues = { installation: { kubernetesProvider: "EKS" } };

        const merged = merge(defaultValues, values);

        this.addHelmChart(clusterInfo, merged);
    }
}
