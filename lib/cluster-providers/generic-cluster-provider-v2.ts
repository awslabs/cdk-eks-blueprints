import { Tags } from "aws-cdk-lib";
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as eks from "@aws-cdk/aws-eks-v2-alpha";
import * as eksv1 from 'aws-cdk-lib/aws-eks';
import { AccountRootPrincipal, ManagedPolicy, Role } from "aws-cdk-lib/aws-iam";
import { IKey } from "aws-cdk-lib/aws-kms";
import { ILayerVersion } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { ClusterInfo, ClusterProvider } from "../spi";
import * as utils from "../utils";
import * as constants from './constants';
import { AutoModeNodeClassSpec, AutoModeNodePoolSpec, AutoscalingNodeGroup, ManagedNodeGroup } from "./types";
import assert = require('assert');
import { selectKubectlLayer, AutoscalingNodeGroupConstraints, FargateProfileConstraints, ManagedNodeGroupConstraints} from "./generic-cluster-provider";
import * as semver from "semver";

export function clusterBuilderv2() {
    return new ClusterBuilderV2();
}

export interface ComputeConfig extends eks.ComputeConfig {
  
  /**
   * Extra node pools to be added to the Auto Mode Cluster
   */
  extraNodePools?: {
    [key: string]: AutoModeNodePoolSpec;
  };

  /**
   * Extra node classes to be added to the Auto Mode Cluster
   */
  extraNodeClasses?: {
    [key: string]: AutoModeNodeClassSpec;
  }

}


/**
 * Properties for the generic cluster provider, containing definitions of managed node groups,
 * auto-scaling groups, fargate profiles.
 */
export interface GenericClusterProviderV2Props extends Partial<eks.ClusterProps> {

    /**
     * Whether cluster has internet access.
     */
    isolatedCluster?: boolean,

    /**
     * Whether API server is private.
     */
    privateCluster?: boolean,

    /**
     * Array of managed node groups.
     */
    managedNodeGroups?: ManagedNodeGroup[];

    /**
     * Array of autoscaling node groups.
     */
    autoscalingNodeGroups?: AutoscalingNodeGroup[];

    /**
     * EKS Automode compute config
     */
    compute?: ComputeConfig;

    /**
     * Fargate profiles
     */
    fargateProfiles?: {
        [key: string]: eks.FargateProfileOptions;
    }

    /**
     * Tags for the cluster
     */
    tags?: {
        [key: string]: string;
    }
}


export class ComputeConfigConstraints implements utils.ConstraintsType<ComputeConfig> {
    nodePools = new utils.ArrayConstraint(0, 2);
}

export class GenericClusterPropsV2Constraints implements utils.ConstraintsType<GenericClusterProviderV2Props> {
    /**
    * managedNodeGroups per cluster have a soft limit of 30 managed node groups per EKS cluster, and as little as 0. But we multiply that
    * by a factor of 5 to 150 in case of situations of a hard limit request being accepted, and as a result the limit would be raised.
    * https://docs.aws.amazon.com/eks/latest/userguide/service-quotas.html
    */
    managedNodeGroups = new utils.ArrayConstraint(0, 150);
    /**
    * autoscalingNodeGroups per cluster have a soft limit of 500 autoscaling node groups per EKS cluster, and as little as 0. But we multiply that
    * by a factor of 5 to 2500 in case of situations of a hard limit request being accepted, and as a result the limit would be raised.
    * https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-quotas.html
    */
    autoscalingNodeGroups = new utils.ArrayConstraint(0, 5000);
}

export const defaultOptionsv2 = {
};

export class ClusterBuilderV2 {

    private props: Partial<GenericClusterProviderV2Props> = {};
    private privateCluster = false;
    private managedNodeGroups: ManagedNodeGroup[] = [];
    private autoscalingNodeGroups: AutoscalingNodeGroup[] = [];
    private compute: ComputeConfig;
    private fargateProfiles: {
        [key: string]: eks.FargateProfileOptions;
    } = {};

    constructor() {
        this.props = { ...this.props };
    }

    withCommonOptions(options: Partial<eks.ClusterProps>): this {
        this.props = { ...this.props, ...options };
        return this;
    }

    managedNodeGroup(...nodeGroups: ManagedNodeGroup[]): this {
        this.managedNodeGroups = this.managedNodeGroups.concat(nodeGroups);
        return this;
    }

    autoscalingGroup(...nodeGroups: AutoscalingNodeGroup[]): this {
        this.autoscalingNodeGroups = this.autoscalingNodeGroups.concat(nodeGroups);
        return this;
    }

    computeConfig(config: ComputeConfig): this {
        this.compute = config;
        return this;
    }

    fargateProfile(name: string, options: eks.FargateProfileOptions): this {
        this.fargateProfiles[name] = options;
        return this;
    }

    version(version: eks.KubernetesVersion): this {
        this.props = { ...this.props, version };
        return this;
    }

    build() {
        return new GenericClusterProviderV2({
            ...this.props,
            privateCluster: this.privateCluster,
            managedNodeGroups: this.managedNodeGroups,
            autoscalingNodeGroups: this.autoscalingNodeGroups,
            compute: this.compute,
            fargateProfiles: this.fargateProfiles
        });
    }
}

/**
 * Cluster provider implementation that supports multiple node groups.
 */
export class GenericClusterProviderV2 implements ClusterProvider {

    constructor(readonly props: GenericClusterProviderV2Props) {

        this.validateInput(props);

        const computeTypesEnabled = [
            props.managedNodeGroups && props.managedNodeGroups.length > 0,
            props.autoscalingNodeGroups && props.autoscalingNodeGroups.length > 0,
            props.compute != undefined
        ].filter(Boolean).length;

        // Assert that only one compute type is enabled
        assert(
            computeTypesEnabled <= 1,
            'Only one compute type can be enabled: managed node groups, autoscaling node groups, or automode configuration.  Mixing these is not supported. Please file a request on GitHub to add this support if needed.'
        );
    }

    /**
     * @override
     */
    createCluster(scope: Construct, vpc: ec2.IVpc, secretsEncryptionKey?: IKey, kubernetesVersion?: eks.KubernetesVersion, clusterLogging?: eks.ClusterLoggingTypes[], ipFamily?: eks.IpFamily): ClusterInfo {
        const id = scope.node.id;

        // Props for the cluster.
        const clusterName = this.props.clusterName ?? id;
        if (!kubernetesVersion && !this.props.version) {
            throw new Error("Version was not specified by cluster builder or in cluster provider props, must be specified in one of these");
        }
        const version: eks.KubernetesVersion = kubernetesVersion || this.props.version || eks.KubernetesVersion.V1_30;

        let privateCluster = this.props.privateCluster ?? utils.valueFromContext(scope, constants.PRIVATE_CLUSTER, false);
        privateCluster = privateCluster ? privateCluster === 'true' : false;
        let isolatedCluster = this.props.isolatedCluster ?? utils.valueFromContext(scope, constants.ISOLATED_CLUSTER, false);
        isolatedCluster = isolatedCluster ? isolatedCluster === 'true' : false;

        const endpointAccess = (privateCluster === true) ? eks.EndpointAccess.PRIVATE : eks.EndpointAccess.PUBLIC_AND_PRIVATE;
        const vpcSubnets = this.props.vpcSubnets ?? (isolatedCluster === true ? [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }] : privateCluster === true ? [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }] : undefined);
        const mastersRole = this.props.mastersRole ?? new Role(scope, `${clusterName}-AccessRole`, {
            assumedBy: new AccountRootPrincipal()
        });


        const kubectlLayer = this.getKubectlLayer(scope, version);
        const kubectlProviderOptions = kubectlLayer && {kubectlLayer};
        const tags = this.props.tags;

        const defaultOptionsv2: Partial<eks.ClusterProps> = {
            vpc,
            secretsEncryptionKey,
            clusterName,
            clusterLogging,
            version,
            vpcSubnets,
            endpointAccess,
            kubectlProviderOptions,
            tags,
            mastersRole,
            defaultCapacityType: eks.DefaultCapacityType.AUTOMODE
        };

        const clusterOptions = { ...defaultOptionsv2, ...this.props, version, ipFamily };

        // Create an EKS Cluster
        const cluster = this.internalCreateCluster(scope, id, clusterOptions);
        cluster.node.addDependency(vpc);

        const nodeGroups: (eks.Nodegroup | eksv1.Nodegroup)[] = [];

        this.props.managedNodeGroups?.forEach(n => {
            const nodeGroup = this.addManagedNodeGroup(cluster as eks.Cluster, n);
            nodeGroups.push(nodeGroup);
        });

        const autoscalingGroups: autoscaling.AutoScalingGroup[] = [];
        this.props.autoscalingNodeGroups?.forEach(n => {
            const autoscalingGroup = this.addAutoScalingGroup(cluster as eks.Cluster, n);
            autoscalingGroups.push(autoscalingGroup);
        });

        const autoMode = clusterOptions.defaultCapacityType != undefined && (clusterOptions.defaultCapacityType as eks.DefaultCapacityType) == eks.DefaultCapacityType.AUTOMODE;
        if (autoMode && semver.lt(semver.coerce(version.version)!,"1.29.0")) {
          throw new Error("EKS Auto Mode is only supported for cluster versions of 1.29 or higher.");
        }

        const fargateProfiles = Object.entries(this.props.fargateProfiles ?? {});
        const fargateConstructs: eks.FargateProfile[] = [];
        fargateProfiles?.forEach(([key, options]) => fargateConstructs.push(this.addFargateProfile(cluster as eks.Cluster, key, options)));

        const nodePools = Object.entries(this.props.compute?.extraNodePools ?? {});
        const nodePoolConstructs: eks.KubernetesManifest[] = [];
        nodePools.forEach(([key, options]) => nodePoolConstructs.push(this.addNodePool(cluster as eks.Cluster, key, options)));

        const nodeClasses = Object.entries(this.props.compute?.extraNodeClasses ?? {});
        const nodeClassConstructs: eks.KubernetesManifest[] = [];
        nodeClasses.forEach(([key, options]) => nodeClassConstructs.push(this.addNodeClass(cluster as eks.Cluster, key, options)));

        return new ClusterInfo(cluster as eksv1.Cluster, version, nodeGroups as eksv1.Nodegroup[], autoscalingGroups, autoMode, fargateConstructs, cluster as eks.Cluster, nodeGroups as eks.Nodegroup[]);
    }

    /**
     * Template method that may be overridden by subclasses to create a specific cluster flavor (e.g. FargateCluster vs eks.Cluster)
     * @param scope
     * @param id
     * @param clusterOptions
     * @returns
     */
    protected internalCreateCluster(scope: Construct, id: string, clusterOptions: any): eks.Cluster | eksv1.Cluster {
        return new eks.Cluster(scope, id, clusterOptions);
    }

    /**
     * Can be overridden to provide a custom kubectl layer.
     * @param scope
     * @param version
     * @returns
     */
    protected getKubectlLayer(scope: Construct, version: eks.KubernetesVersion): ILayerVersion | undefined {
        return selectKubectlLayer(scope, version);
    }

    /**
     * Adds an autoscaling group to the cluster.
     * @param cluster
     * @param nodeGroup
     * @returns
     */
    addAutoScalingGroup(cluster: eks.Cluster, nodeGroup: AutoscalingNodeGroup): autoscaling.AutoScalingGroup {
        const machineImageType = nodeGroup.machineImageType ?? eks.MachineImageType.AMAZON_LINUX_2;
        const instanceTypeContext = utils.valueFromContext(cluster, constants.INSTANCE_TYPE_KEY, constants.DEFAULT_INSTANCE_TYPE);
        const instanceType = nodeGroup.instanceType ?? (typeof instanceTypeContext === 'string' ? new ec2.InstanceType(instanceTypeContext) : instanceTypeContext);
        const minSize = nodeGroup.minSize ?? utils.valueFromContext(cluster, constants.MIN_SIZE_KEY, constants.DEFAULT_NG_MINSIZE);
        const maxSize = nodeGroup.maxSize ?? utils.valueFromContext(cluster, constants.MAX_SIZE_KEY, constants.DEFAULT_NG_MAXSIZE);
        const desiredSize = nodeGroup.desiredSize ?? utils.valueFromContext(cluster, constants.DESIRED_SIZE_KEY, minSize);
        const updatePolicy = nodeGroup.updatePolicy ?? autoscaling.UpdatePolicy.rollingUpdate();

        // Create an autoscaling group
        return cluster.addAutoScalingGroupCapacity(nodeGroup.id, {
            ...nodeGroup,
            ... {
                autoScalingGroupName: nodeGroup.autoScalingGroupName ?? nodeGroup.id,
                machineImageType,
                instanceType,
                minCapacity: minSize,
                maxCapacity: maxSize,
                desiredCapacity: desiredSize,
                updatePolicy,
                vpcSubnets: nodeGroup.nodeGroupSubnets,
            }
        });
    }

    /**
     * Adds a fargate profile to the cluster
     */
    addFargateProfile(cluster: eks.Cluster, name: string, profileOptions: eks.FargateProfileOptions): eks.FargateProfile {
        return cluster.addFargateProfile(name, profileOptions);
    }

    /**
     * Add a node pool to the cluster
     */
    addNodePool(cluster: eks.Cluster, name: string, pool: AutoModeNodePoolSpec) {
      const labels =  pool.labels || {};
      const annotations = pool.annotations || {};
      const taints = pool.taints || [];
      const startupTaints = pool.startupTaints || [];
      const requirements = pool.requirements || [];
      const disruption = pool.disruption || null;
      const limits = pool.limits || null;
      const weight = pool.weight || null;
      const poolManifest = {
        apiVersion: "karpenter.sh/v1",
        kind: "NodePool",
        metadata: {name: name},
        spec: {
          template: {
            metadata: {labels: labels, annotations: annotations},
            spec: {
              nodeClassRef: {
                  name: pool.nodeClassName || "default",
                  group: "eks.amazonaws.com",
                  kind: "NodeClass"
              },
              taints: taints,
              startupTaints: startupTaints,
              requirements: utils.convertKeyPair(requirements),
              expireAfter: pool.expireAfter
            },
          },
          disruption: disruption,
          limits: limits,
          weight: weight,
        },
      };
      return cluster.addManifest(name, poolManifest);
    }
    
    addNodeClass(cluster: eks.Cluster, name: string, nodeClass: AutoModeNodeClassSpec) {
      const classManifest = {
        apiVersion: "eks.amazonaws.com/v1",
        kind: "NodeClass",
        metadata: {name: name},
        spec: nodeClass
      }

      return cluster.addManifest(name, classManifest);
    }

    /**
     * Adds a managed node group to the cluster.
     * @param cluster
     * @param nodeGroup
     * @returns
     */
    addManagedNodeGroup(cluster: eks.Cluster, nodeGroup: ManagedNodeGroup): eks.Nodegroup {
        const capacityType = nodeGroup.nodeGroupCapacityType;
        const releaseVersion = nodeGroup.amiReleaseVersion;
        const instanceTypeContext = utils.valueFromContext(cluster, constants.INSTANCE_TYPE_KEY, constants.DEFAULT_INSTANCE_TYPE);
        const instanceTypes = nodeGroup.instanceTypes ?? ([typeof instanceTypeContext === 'string' ? new ec2.InstanceType(instanceTypeContext) : instanceTypeContext]);
        const minSize = nodeGroup.minSize ?? utils.valueFromContext(cluster, constants.MIN_SIZE_KEY, constants.DEFAULT_NG_MINSIZE);
        const maxSize = nodeGroup.maxSize ?? utils.valueFromContext(cluster, constants.MAX_SIZE_KEY, constants.DEFAULT_NG_MAXSIZE);
        const desiredSize = nodeGroup.desiredSize ?? utils.valueFromContext(cluster, constants.DESIRED_SIZE_KEY, minSize);

        // Create a managed node group.
        const nodegroupOptions: utils.Writeable<eks.NodegroupOptions> = {
            ...nodeGroup,
            amiType: nodeGroup.amiType as eks.NodegroupAmiType,
            ...{
                nodegroupName: nodeGroup.nodegroupName ?? nodeGroup.id,
                capacityType,
                instanceTypes,
                minSize,
                maxSize,
                desiredSize,
                releaseVersion,
                subnets: nodeGroup.nodeGroupSubnets
            }
        };

        if (nodeGroup.launchTemplate) {
            // Create launch template with provided launch template properties
            const lt = new ec2.LaunchTemplate(cluster, `${nodeGroup.id}-lt`, {
                blockDevices: nodeGroup.launchTemplate.blockDevices,
                machineImage: nodeGroup.launchTemplate?.machineImage,
                securityGroup: nodeGroup.launchTemplate.securityGroup,
                userData: nodeGroup.launchTemplate?.userData,
                requireImdsv2: nodeGroup.launchTemplate?.requireImdsv2,
                httpPutResponseHopLimit: nodeGroup.launchTemplate?.httpPutResponseHopLimit,
            });
            utils.setPath(nodegroupOptions, "launchTemplateSpec", {
                id: lt.launchTemplateId!,
                version: lt.latestVersionNumber,
            });
            const tags = Object.entries(nodeGroup.launchTemplate.tags ?? {});
            tags.forEach(([key, options]) => Tags.of(lt).add(key, options));
            if (nodeGroup.launchTemplate?.machineImage) {
                delete nodegroupOptions.amiType;
                delete nodegroupOptions.releaseVersion;
                delete nodeGroup.amiReleaseVersion;
            }
        }

        const result = cluster.addNodegroupCapacity(nodeGroup.id + "-ng", nodegroupOptions);

        if (nodeGroup.enableSsmPermissions) {
            result.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
        }

        return result;
    }

    private validateInput(props: GenericClusterProviderV2Props) {

        utils.validateConstraints(new GenericClusterPropsV2Constraints, GenericClusterProviderV2.name, props);
        if (props.managedNodeGroups != undefined)
            utils.validateConstraints(new ManagedNodeGroupConstraints, "ManagedNodeGroup", ...props.managedNodeGroups);
        if (props.autoscalingNodeGroups != undefined)
            utils.validateConstraints(new AutoscalingNodeGroupConstraints, "AutoscalingNodeGroups", ...props.autoscalingNodeGroups);
        if (props.compute != undefined)
            utils.validateConstraints(new ComputeConfigConstraints, "ComputeConfigConstraints", props.compute);
        if (props.fargateProfiles as any != undefined)
            utils.validateConstraints(new FargateProfileConstraints, "FargateProfiles", ...Object.values(props.fargateProfiles as any));
    }
}
