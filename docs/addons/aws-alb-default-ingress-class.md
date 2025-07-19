# AWS ALB Default IngressClass Add-on

The AWS ALB Default IngressClass Add-on creates a default IngressClass resource for the AWS Application Load Balancer (ALB) Controller in your EKS cluster. This add-on simplifies the process of using the AWS Load Balancer Controller with Kubernetes Ingress resources by providing a default IngressClass that's automatically configured to work with the ALB controller.

## Usage

```typescript
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';

const app = new cdk.App();

const addOn = new blueprints.addons.ALBDefaultIngressClassAddOn();

const blueprint = blueprints.EksBlueprint.builder()
  .addOns(addOn)
  .build(app, 'my-stack-name');
```

## Functionality

This add-on deploys a Kubernetes IngressClass resource with the following characteristics:

1. Creates an IngressClass named `alb` in the cluster
2. Configures the IngressClass to use the AWS ALB controller (`eks.amazonaws.com/alb`)
3. Adds appropriate labels for integration with the AWS Load Balancer Controller

## EKS Auto Mode Compatibility

When using EKS Auto Mode, the AWS Load Balancer Controller is already installed by default, so this add-on complements the existing controller by providing a default IngressClass. You don't need to explicitly install the AWS Load Balancer Controller when using Auto Mode.

If you're not using EKS Auto Mode, you'll need to ensure the AWS Load Balancer Controller is installed separately using the `AwsLoadBalancerControllerAddOn`.

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
  ingressClassName: alb  # Uses the default ALB IngressClass
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
