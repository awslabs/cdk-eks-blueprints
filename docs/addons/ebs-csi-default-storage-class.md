# EBS CSI Default StorageClass Add-on

> [!WARNING] > **This AddOn is for use specifically with EKS Auto Mode, and will not work with non-Auto Mode clusters. For non-Auto Mode clusters, please use [EbsCsiDriverAddOn](./ebs-csi-driver.md)**

The EBS CSI Default StorageClass Add-on creates a default gp3 StorageClass resource for the EBS CSI Driver in your EKS cluster. This add-on simplifies the process of using the EBS CSI Driver on EKS Auto Mode with Kubernetes PVC resources by providing a default StorageClass that's automatically configured.

> [!NOTE]
> EBS CSI Driver is automatically deployed and managed on your cluster as a part of EKS Auto Mode

## Usage

```typescript
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import * as blueprints from "@aws-quickstart/eks-blueprints";

const app = new cdk.App();

const addOn = new blueprints.addons.EbsCsiDefaultStorageClassAddOn();

const blueprint = blueprints.AutomodeBuilder.builder()
  .addOns(addOn)
  .build(app, "my-stack-name");
```

## Functionality

This add-on deploys a Kubernetes StorageClass resource with the following characteristics:

1. Creates a StorageClass named `auto-ebs-sc` in the cluster
2. Configures the StorageClass to use the EBS CSI Driver(`ebs.csi.eks.amazonaws.com`)

## Validation

To verify that the StorageClass has been created successfully, run:

```bash
kubectl get storageclass auto-ebs-sc
```

You should see output similar to:

```
NAME                    PROVISIONER                 RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
auto-ebs-sc (default)   ebs.csi.eks.amazonaws.com   Delete          WaitForFirstConsumer   false                  16m
```

## Using the Default StorageClass

Once the StorageClass is created, you can use it in your PVC resources by specifying the StorageClass name in the `storageClassName` field:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-ebs-claim
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: auto-ebs-sc # Uses the default EBS CSI StorageClass
  resources:
    requests:
      storage: 8Gi
```

## Benefits of Using This Add-on

1. **Simplifies PVC Configuration**: Provides a consistent gp3 StorageClass for all EBS-based PVC resources
2. **Standardization**: Ensures all teams use the same StorageClass configuration
3. **Integration**: Works seamlessly with the EBS CSI Driver that's pre-installed in EKS Auto Mode
4. **Declarative Setup**: Manages the StorageClass as part of your infrastructure as code

This add-on is particularly useful in multi-team environments where you want to standardize on a single EBS StorageClass configuration across all applications.
