import { Construct } from "constructs";
import { ClusterInfo, Values } from "../../spi";
import { HelmAddOn, HelmAddOnProps, HelmAddOnUserProps } from "../helm-addon";
import { dependable, getSecretValue, ReplaceServiceAccount, setPath } from "../../utils";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { CfnPodIdentityAssociation, IdentityType } from "aws-cdk-lib/aws-eks";
import { UnionDataplaneCRDsAddOn } from "./dataplane-crds";
import { UnionIAMPolicy } from "./iam-policy";
import * as iam from "aws-cdk-lib/aws-iam";
import { merge } from "ts-deepmerge";

export interface UnionDataplaneAddOnProps extends HelmAddOnUserProps {
  /*
   * Your Union control plane URL (should not include the "http://")
   */
  readonly host: string;

  /*
   * Name of your Union.ai organization
   */
  readonly orgName: string;

  /*
   * Name of the cluster registered with Union.ai
   */
  readonly clusterName: string;

  /*
   * Union S3 Bucket provider name - @see CreateS3BucketProvider
   */
  readonly s3BucketProviderName: string;

  /*
   * Name of Client ID Secret in Secrets Manager
   */
  readonly clientIdSecretName: string;

  /*
   * Name of Client Secret Secret in Secrets Manager
   */
  readonly clientSecretSecretName: string;

  /*
   * CDK Creates the Namespace for you
   */
  readonly createNamespace?: boolean;
}

const defaultProps: HelmAddOnProps & Partial<UnionDataplaneAddOnProps>= {
  name: "unionai-dataplane",
  chart: "dataplane",
  release: "blueprints-addon-union-dataplane",
  version: "2025.11.3",
  repository: "https://unionai.github.io/helm-charts",
  namespace: "unionai",
  createNamespace: true,
  values: {}
};


export class UnionDataplaneAddOn extends HelmAddOn {

  readonly options: UnionDataplaneAddOnProps;

  constructor(props?: UnionDataplaneAddOnProps) {
    super({ ...defaultProps, ...props });
    this.options = this.props as UnionDataplaneAddOnProps;
  }

  @dependable(UnionDataplaneCRDsAddOn.name)
  async deploy(clusterInfo: ClusterInfo): Promise<Construct> {
    const bucket = clusterInfo.getRequiredResource<IBucket>(this.options.s3BucketProviderName!);

    let values = await populateValues(this.options, clusterInfo, clusterInfo.cluster.stack.region, bucket);
    values = merge(values, this.options.values ?? {})
    const chart = this.addHelmChart(clusterInfo, values, this.options.createNamespace);

    const unionPolicyDocument = iam.PolicyDocument.fromJson(UnionIAMPolicy(bucket.bucketName));

    const unionPolicy = new iam.ManagedPolicy(clusterInfo.cluster, "UnionDataplanePolicy", {document: unionPolicyDocument});

    const opsServiceAccount = new ReplaceServiceAccount(clusterInfo.cluster,"operator-system", {
      cluster: clusterInfo.cluster,
      name: "operator-system",
      namespace: this.options.namespace,
      identityType: IdentityType.POD_IDENTITY
    });
    opsServiceAccount.role.addManagedPolicy(unionPolicy);
    opsServiceAccount.node.addDependency(chart);

    const proxyServiceAccount = new ReplaceServiceAccount(clusterInfo.cluster,"proxy-system", {
      cluster: clusterInfo.cluster,
      name: "proxy-system",
      namespace: this.options.namespace,
      identityType: IdentityType.POD_IDENTITY
    });
    proxyServiceAccount.role.addManagedPolicy(unionPolicy);
    proxyServiceAccount.node.addDependency(chart);

    const fluentbitServiceAccount = new ReplaceServiceAccount(clusterInfo.cluster,"fluentbit-system", {
      cluster: clusterInfo.cluster,
      name: "fluentbit-system",
      namespace: this.options.namespace,
      identityType: IdentityType.POD_IDENTITY
    });
    fluentbitServiceAccount.role.addManagedPolicy(unionPolicy);
    fluentbitServiceAccount.node.addDependency(chart);
    
    return Promise.resolve(chart);
  }

}

/**
* populateValues populates the appropriate values used to customize the Helm chart
* @param options User provided values to customize the chart
* @param clusterName Name of the EKS cluster
* @param region Region of the stack
*/
async function populateValues(options: UnionDataplaneAddOnProps, clusterInfo: ClusterInfo, region: string, bucket: IBucket): Promise<Values> {
  const [clientId, clientSecret] = await Promise.all([
    getSecretValue(options.clientIdSecretName, region),
    getSecretValue(options.clientSecretSecretName, region)
  ]);



  return {
    host: options.host,
    clusterName: options.clusterName,
    orgName: options.orgName,
    provider: "aws",
    storage: {
      provider: "aws",
      authType: "iam",
      bucketName: bucket.bucketName,
      fastRegistrationBucketName: bucket.bucketName,
      region,
      enableMultiContainer: true
    },
    secrets: {
      admin: {
        create: true,
        clientId,
        clientSecret
      }
    },
    prometheus: {
      namespaceOverride: options.namespace!

    }
  };
}

