# Union.ai Dataplane -- Amazon EKS Blueprints Addon

Union.ai empowers AI development teams to rapidly ship high-quality code to production by offering optimized performance, resource efficiency, and workflow authoring experience. With Union.ai your team can:

- Run complex AI workloads with performance, scale, and efficiency.
- Scale out to multiple regions, clusters, and clouds as needed for resource availability, scale, or compliance.

Union.ai’s modular architecture allows for flexibility and control. The customer can decide how many clusters to have, their shape, and who has access to what. All communication is encrypted.

<p align="center">
  <a href="https://www.union.ai">
    <img alt="Union Self-managed Architecture" src="https://www.union.ai/docs/v1/selfmanaged/_static/images/deployment/architecture.svg" width="600" />
  </a>
</p>

For more information, see [Union.ai](https://www.union.ai/).

## Deployment Process

### 1. Install `uctl`

On Mac:
```bash
brew tap unionai/homebrew-tap
brew install uctl
```

With cURL:
```bash
curl -sL https://raw.githubusercontent.com/unionai/uctl/main/install.sh | bash
```

### 2. Setup Union Credentials

Both the control plane URL and cluster name will be provided by Union.  Union will also provide authentication information for your account to access the hosted control plane.

```bash
export UNION_CONTROL_PLANE_URL=<YOUR_UNION_CONTROL_PLANE_URL>
export UNION_CLUSTER_NAME=<YOUR_SELECTED_CLUSTER_NAME>

uctl config init --host=$UNION_CONTROL_PLANE_URL
uctl selfserve provision-dataplane-resources --clusterName $UNION_CLUSTER_NAME --provider aws
```

This command will output the ID, name, and secret used by Union services to communicate with the control plane.

### 3. Create Union Secrets in AWS Secrets Manager

```bash
export UNION_SECRET_NAME=union-secret
export UNION_CLIENT_ID_SECRET_VALUE=<CLUSTERAUTHCLIENTID_FROM_SELFSERVE_COMMAND>
export UNION_SECRET_SECRET_VALUE=<CLUSTERAUTHCLIENTSECRET_FROM_SELFSERVE_COMMAND>

aws secretsmanager create-secret --name $UNION_SECRET_NAME \
  --secret-string "{\"clientId\":\"$UNION_CLIENT_ID_SECRET_VALUE\",\"clientSecret\":\"$UNION_SECRET_SECRET_VALUE\"}"
```

### 4. Install Union Add-on

```bash
npm i @unionai/union-eks-blueprints-addon
```

### 5. Create Union Blueprint

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as blueprints from "@aws-quickstart/eks-blueprints"
import * as union from "@unionai/union-eks-blueprints-addon"

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
let props = { env: { account, region } };

const unionBlueprint = blueprints.AutomodeBuilder.builder({})

.resourceProvider('union-bucket', new blueprints.CreateS3BucketProvider({name: 'my-union-bucket-123', id: 'union-bucket'})) // If you have an already existing bucket see @ImportS3BucketProvider
.addOns(
  new blueprints.addons.MetricsServerAddOn(),
  new union.UnionDataplaneCRDsAddOn,
  new union.UnionDataplaneAddOn({
    s3BucketProviderName: 'union-bucket',
    clusterName: process.env.UNION_CLUSTER_NAME!,
    unionSecretName: process.env.UNION_SECRET_NAME!,
    host: process.env.UNION_CONTROL_PLANE_URL!,
    orgName: "<YOUR_ORG_NAME>"
  })
).build(app, "union-blueprint", props)
```

### 6. Deploy the Blueprint

For a quick tutorial on EKS Blueprints, visit the [Getting Started guide](https://awslabs.github.io/cdk-eks-blueprints/getting-started/).

### 7. Validation

Run the command:
```bash
kubectl get deploy -A
```

Output should be:
```bash
NAMESPACE     NAME                                                  READY   UP-TO-DATE   AVAILABLE   AGE
kube-system   blueprints-addon-metrics-server                       1/1     1            1           57d
kube-system   blueprints-addon-union-dataplane-kube-state-metrics   1/1     1            1           57d
unionai       executor                                              1/1     1            1           57d
unionai       flytepropeller                                        1/1     1            1           57d
unionai       flytepropeller-webhook                                1/1     1            1           57d
unionai       opencost                                              1/1     1            1           57d
unionai       prometheus-operator                                   1/1     1            1           57d
unionai       syncresources                                         1/1     1            1           57d
unionai       union-operator                                        1/1     1            1           57d
unionai       union-operator-proxy                                  1/1     1            1           57d
```

To validate the cluster has been successfully registered to the Union control plane run the command:
```bash
uctl get cluster
```

Output should be:
```bash
 ----------- ------- --------------- -----------
| NAME      | ORG   | STATE         | HEALTH    |
 ----------- ------- --------------- -----------
| <cluster> | <org> | STATE_ENABLED | HEALTHY   |
 ----------- ------- --------------- -----------
1 rows
```

### 8. Register and run example workflows

```bash
uctl register examples --project=union-health-monitoring --domain=development
uctl validate snacks --project=union-health-monitoring --domain=development
 ---------------------- ----------------------------------- ---------- -------------------------------- -------------- ----------- ---------------
| NAME                 | LAUNCH PLAN NAME                  | VERSION  | STARTED AT                     | ELAPSED TIME | RESULT    | ERROR MESSAGE |
 ---------------------- ----------------------------------- ---------- -------------------------------- -------------- ----------- ---------------
| alskkhcd6wx5m6cqjlwm | basics.hello_world.hello_world_wf | v0.3.341 | 2025-05-09T18:30:02.968183352Z | 4.452440953s | SUCCEEDED |               |
 ---------------------- ----------------------------------- ---------- -------------------------------- -------------- ----------- ---------------
1 rows
```
