# AWS ALB Default IngressClass Add-on

> [!WARNING] > **This AddOn is for use specifically with EKS Auto Mode, and will not work with non-Auto Mode clusters. For non-Auto Mode clusters, please use [AwsLoadBalancerControllerAddOn](./aws-load-balancer-controller.md)**

The AWS ALB Default IngressClass Add-on creates a default IngressClass resource for the AWS Application Load Balancer (ALB) Controller in your EKS cluster. This add-on simplifies the process of using the AWS Load Balancer Controller on EKS Auto Mode with Kubernetes Ingress resources by providing a default IngressClass that's automatically configured.

> [!NOTE]
> AWS Load Balancer Controller is automatically deployed and managed on your cluster as a part of EKS Auto Mode

## Usage

```typescript
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import * as blueprints from "@aws-quickstart/eks-blueprints";

const app = new cdk.App();

const addOn = new blueprints.addons.ALBDefaultIngressClassAddOn();

const blueprint = blueprints.AutomodeBuilder.builder()
  .addOns(addOn)
  .build(app, "my-stack-name");
```

## Functionality

This add-on deploys a Kubernetes IngressClass resource with the following characteristics:

1. Creates an IngressClass named `alb` in the cluster
2. Configures the IngressClass to use the AWS ALB controller (`eks.amazonaws.com/alb`)
3. Adds appropriate labels for integration with the AWS Load Balancer Controller

## Validation

To verify that the IngressClass has been created successfully, run:

```bash
kubectl get ingressclass alb
```

You should see output similar to:

```
NAME   CONTROLLER              PARAMETERS   AGE
alb    eks.amazonaws.com/alb   <none>       1m
```

## Using the Default IngressClass

Once the IngressClass is created, you can use it in your Ingress resources by specifying the IngressClass name in the `ingressClassName` field:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
spec:
  ingressClassName: alb # Uses the default ALB IngressClass
  rules:
    - host: example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-service
                port:
                  number: 80
```

## Benefits of Using This Add-on

1. **Simplifies Ingress Configuration**: Provides a consistent IngressClass for all ALB-based Ingress resources
2. **Standardization**: Ensures all teams use the same IngressClass configuration
3. **Integration**: Works seamlessly with the AWS Load Balancer Controller that's pre-installed in EKS Auto Mode
4. **Declarative Setup**: Manages the IngressClass as part of your infrastructure as code

This add-on is particularly useful in multi-team environments where you want to standardize on a single ALB IngressClass configuration across all applications.
