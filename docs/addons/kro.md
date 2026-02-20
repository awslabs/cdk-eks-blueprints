# kro Add-on for EKS Blueprints

[kro](https://kro.run) (Kube Resource Orchestrator) is an open-source, Kubernetes-native project that allows you to define custom Kubernetes APIs using simple and straightforward configuration. With kro, you can easily configure new custom APIs that create a group of Kubernetes objects and the logical operations between them. 

kro leverages CEL (Common Expression Language), the same language used by Kubernetes webhooks, for logical operations. Using CEL expressions, you can easily pass values from one object to another and incorporate conditionals into your custom API definitions. Based on the CEL expressions, kro automatically calculates the order in which objects should be created. You can define default values for fields in the API specification, streamlining the process for end users who can then effortlessly invoke these custom APIs to create grouped resources.

## Installation

```typescript
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';

const app = new cdk.App();

const addOn = new blueprints.addons.KroAddOn();

const blueprint = blueprints.EksBlueprint.builder()
  .version("auto")
  .addOns(addOn)
  .build(app, 'my-stack-name');
```

## Validation

Run this command to validate that kro is running on the cluster.
```bash
kubectl get all -n kro
```

The output should be similar to below:
```bash
NAME                     READY   STATUS    RESTARTS   AGE
pod/kro-bf6d6f6c-bth2c   1/1     Running   0          38m

NAME                  READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/kro   1/1     1            1           38m

NAME                           DESIRED   CURRENT   READY   AGE
replicaset.apps/kro-bf6d6f6c   1         1         1       38m
```

## Functionality

## Usage
