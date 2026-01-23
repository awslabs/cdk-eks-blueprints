# AWS Network Flow Monitor Add-on

[Network Flow Monitor](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-NetworkFlowMonitor.html) is a feature of Amazon CloudWatch Network Monitoring. Network Flow Monitor uses fully-managed agents that you install in your AWS workloads to return performance and availability metrics about network flows. Using Network Flow Monitor, you can access near real-time metrics, including retransmissions and data transferred, for your actual workloads. You can also identify whether an underlying AWS network issue occurred for the network flows tracked by a monitor, by checking network health indicator (NHI) values.

## On EKS

When Network Flow Monitor gathers performance metrics for network flows between Amazon EKS components, it includes additional metadata information about the network path, to help you better understand how the network paths for your workload are performing.

You can view detailed information about Amazon EKS network flow performance by creating a monitor for the network flows that you're interested in, and then viewing details on the Historical explorer tab.

With Network Flow Monitor, you can measure network performance between the following Amazon EKS components, to better understand how your workload is performing with your Amazon EKS configuration and determine where there are bottlenecks or impairments.
- Pod to pod on the same node
- Node to node on the same cluster
- Pod to pod on a different cluster
- Node to node on different clusters
- With and without LoadBalancer

For information on the metadata returned by the Network Flow Monitor in each scenario, see the table here: [NFM Network Flow Scenario Table](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-NetworkFlowMonitor-work-with-eks.performance-metadata.html)
## Prerequisite
- This add-ons are only available with Amazon EKS clusters running Kubernetes version 1.25 and later.
- The EKS Pod Identity Agent add-on must be installed on the cluster

## Usage

```typescript
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';

const app = new cdk.App();

const addOns = [
  new blueprints.addons.EksPodIdentityAgentAddOn(),
  new blueprints.addons.AwsNetworkFlowMonitorAddOn()
];

const blueprint = blueprints.EksBlueprint.builder()
  .version("auto")
  .addOns(...addOns)
  .build(app, 'my-stack-name');
```

## Validation

To validate that the Network Flow Monitor add-on is installed properly, ensure that the pods are running in the cluster

```bash
kubectl get pods -n amazon-network-flow-monitor

# Output
NAME                                   READY   STATUS    RESTARTS   AGE
aws-network-flow-monitor-agent-p2rd7   1/1     Running   0          2m22s

```

Additionally, the `aws cli` can be used to determine which version of the add-on is installed in the cluster
```bash
# Assuming cluster-name is my-cluster, below command shows the version of coredns installed. Check if it is same as the version installed via EKS add-on
aws eks describe-addon \
    --cluster-name my-cluster \
    --addon-name aws-network-flow-monitoring-agent \
    --query "addon.addonVersion" \
    --output text

# Output
v1.1.2-eksbuild.1
```


