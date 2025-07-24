import { ClusterAddOn, ClusterInfo } from '../../spi';
import { KubernetesManifest } from 'aws-cdk-lib/aws-eks';
import { conflictsWith, mustRunOnAutoMode, supportsALL } from '../../utils';


@supportsALL
export class ALBDefaultIngressClassAddOn implements ClusterAddOn {

  @conflictsWith('AwsLoadBalancerControllerAddOn')
  @mustRunOnAutoMode()
  deploy(clusterInfo: ClusterInfo): void {
    const cluster = clusterInfo.cluster;
    const ingressClassManifest = {
      apiVersion: "networking.k8s.io/v1",
      kind: "IngressClass",
      metadata: {
        labels:
          { "app.kubernetes.io/name": "LoadBalancerController" },
        name: "alb"
      },
      spec: {
        controller: "eks.amazonaws.com/alb"
      }
    };
    const ingressClass = new KubernetesManifest(cluster.stack, 'alb-ingress-class', {
      cluster,
      manifest: [ingressClassManifest],
      overwrite: true
    });
  }
}

