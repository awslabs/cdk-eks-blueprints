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

[kro](https://kro.run) lets you turn a set of Kubernetes resources into a reusable API. You define the API schema, describe the resources behind it in YAML, and connect them with [CEL expressions](https://kro.run/docs/concepts/rgd/cel-expressions). kro turns that definition into a CRD, watches for instances of that API, and reconciles the underlying resources for each one.

A **ResourceGraphDefinition (RGD)** is the blueprint for a custom API: it describes the interface users work with and the resources each instance should produce. kro validates that definition before it ever reconciles an instance, catching schema errors, invalid expressions, and broken references before they become runtime failures.

Key capabilities:
- **SimpleSchema** — Define your API schema inline with types, defaults, and constraints. No OpenAPI boilerplate.
- **Automatic dependency ordering** — kro reads your CEL expressions and builds the dependency graph automatically. You never declare resource order.
- **Data wiring** — Reference status fields from resources that haven't been created yet. kro waits for the data to exist, then wires it into dependent resources.
- **Conditional resources** — Include or exclude entire subgraphs based on any CEL expression.
- **Collections** — `forEach` expands a single resource template into multiple resources from a list or range.

## Usage

### Example: Pod with RDS DBInstance

This example uses kro with [ACK](https://aws-controllers-k8s.github.io/docs/) to create a custom `DeploymentAndAWSPostgres` API that provisions an RDS instance and a Pod wired to its endpoint. Database credentials are stored in a Kubernetes Secret and referenced via kro's `externalRef` — keeping secrets out of the schema and managed separately.

#### Prerequisites

Create a Kubernetes Secret with the database credentials. This should be created out-of-band (e.g. via [External Secrets Operator](https://external-secrets.io/) or manually):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-app-db-credentials
  namespace: default
type: Opaque
stringData:
  password: <your-secure-password>
```

#### ResourceGraphDefinition

The RGD uses ACK's native `SecretKeyReference` to read credentials directly from the pre-existing Secret. ACK handles decoding the base64 Secret data automatically:

```yaml
apiVersion: kro.run/v1alpha1
kind: ResourceGraphDefinition
metadata:
  name: deploymentandawspostgres
spec:
  schema:
    apiVersion: v1alpha1
    kind: DeploymentAndAWSPostgres
    spec:
      applicationName: string
      image: string
      location: string
      dbUsername: string | default=postgres

  resources:
    - id: dbinstance
      template:
        apiVersion: rds.services.k8s.aws/v1alpha1
        kind: DBInstance
        metadata:
          name: ${schema.spec.applicationName}-dbinstance
        spec:
          engine: postgres
          dbInstanceIdentifier: ${schema.spec.applicationName}-dbinstance
          allocatedStorage: 20
          dbInstanceClass: db.t3.micro
          masterUsername: ${schema.spec.dbUsername}
          masterUserPassword:
            name: ${schema.spec.applicationName}-db-credentials
            key: password

    - id: pod
      template:
        apiVersion: v1
        kind: Pod
        metadata:
          name: ${schema.spec.applicationName}-pod
        spec:
          containers:
            - name: container1
              image: ${schema.spec.image}
              env:
                - name: POSTGRES_ENDPOINT
                  value: ${dbinstance.status.?endpoint.?address}
```

#### Create an instance

```yaml
apiVersion: kro.run/v1alpha1
kind: DeploymentAndAWSPostgres
metadata:
  name: my-app
spec:
  applicationName: my-app
  image: nginx
  location: us-east-2
```

kro automatically infers the dependency order: it creates the RDS instance with credentials read by ACK from the Secret, waits for the endpoint to become available, then creates the Pod with the connection string injected. The Secret is not managed by kro or ACK — it must exist before creating an instance.

For more examples, see the [kro examples gallery](https://kro.run/examples/).
