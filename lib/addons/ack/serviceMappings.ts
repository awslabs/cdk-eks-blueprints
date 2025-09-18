import {PolicyStatement} from "aws-cdk-lib/aws-iam";

/**
 * Chart Mapping for fields such as chart, version, managed IAM policy.
 */
export interface AckChartMapping {
    chart: string,
    version: string,
    managedPolicyName?: string
    inlinePolicyStatements?: PolicyStatement[]
}

/**
 * List of all supported supported AWS services by ACK Addon.
 */
export enum AckServiceName {
  ACM = "acm",
  ACMPCA = "acmpca",
  APIGATEWAYV2 = "apigatewayv2",
  APPLICATIONAUTOSCALING = "applicationautoscaling",
  ATHENA = "athena",
  BEDROCKAGENT = "bedrockagent",
  CLOUDFRONT = "cloudfront",
  CLOUDTRAIL = "cloudtrail",
  CLOUDWATCH = "cloudwatch",
  CLOUDWATCHLOGS = "cloudwatchlogs",
  CODEARTIFACT = "codeartifact",
  COGNITOIDENTITYPROVIDER = "cognitoidentityprovider",
  DOCUMENTDB = "documentdb",
  DYNAMODB = "dynamodb",
  EC2 = "ec2",
  ECR = "ecr",
  ECRPUBLIC = "ecrpublic",
  ECS = "ecs",
  EFS = "efs",
  EKS = "eks",
  ELASTICACHE = "elasticache",
  ELASTICSEARCHSERVICE = "elasticsearchservice",
  ELBV2 = "elbv2",
  EMRCONTAINERS = "emrcontainers",
  EVENTBRIDGE = "eventbridge",
  GLUE = "glue",
  IAM = "iam",
  KAFKA = "kafka",
  KEYSPACES = "keyspaces",
  KINESIS = "kinesis",
  KMS = "kms",
  LAMBDA = "lambda",
  MEMORYDB = "memorydb",
  MQ = "mq",
  NETWORKFIREWALL = "networkfirewall",
  OPENSEARCHSERVERLESS = "opensearchserverless",
  OPENSEARCHSERVICE = "opensearchservice",
  ORGANIZATIONS = "organizations",
  PIPES = "pipes",
  PROMETHEUSSERVICE = "prometheusservice",
  RAM = "ram",
  RDS = "rds",  
  RECYCLEBIN = "recyclebin",
  ROUTE53 = "route53",
  ROUTE53RESOLVER = "route53resolver",
  S3 = "s3",
  S3CONTROL = "s3control",
  SAGEMAKER = "sagemaker",
  SECRETSMANAGER = "secretsmanager",
  SES = "ses",
  SFN = "sfn",
  SNS = "sns",
  SQS = "sqs",
  SSM = "ssm",
  WAFV2 = "wafv2"
}

/**
 * List of all Service Mappings such as chart, version, managed IAM policy 
 * for all supported AWS services by ACK Addon.
 */
export const serviceMappings : {[key in AckServiceName]?: AckChartMapping } = {
    [AckServiceName.IAM]: {
      chart: "iam-chart",
      version:  "1.5.0",
      managedPolicyName: "IAMFullAccess"
    },
    [AckServiceName.RDS]: {
      chart: "rds-chart",
      version:  "1.6.0",
      managedPolicyName: "AmazonRDSFullAccess"
    },
    [AckServiceName.EC2]: {
      chart: "ec2-chart",
      version:  "1.6.1",
      managedPolicyName: "AmazonRDSFullAccess"
    },
    [AckServiceName.S3]: {
      chart: "s3-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonS3FullAccess"
    },
    [AckServiceName.DYNAMODB]: {
      chart: "dynamodb-chart",
      version:  "1.5.1",
      managedPolicyName: "AmazonDynamoDBFullAccess"
    },
    [AckServiceName.ECR]: {
      chart: "ecr-chart",
      version:  "1.3.0",
      managedPolicyName: "AmazonEC2ContainerRegistryFullAccess"
    },
    [AckServiceName.ECRPUBLIC]: {
      chart: "ecrpublic-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonElasticContainerRegistryPublicFullAccess"
    },
    [AckServiceName.SNS]: {
      chart: "sns-chart",
      version:  "1.2.0",
      managedPolicyName: "AmazonSNSFullAccess"
    },
    [AckServiceName.APIGATEWAYV2]: {
      chart: "apigatewayv2-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonAPIGatewayAdministrator"
    },
    [AckServiceName.ELASTICACHE]: {
      chart: "elasticache-chart",
      version:  "1.2.2",
      managedPolicyName: "AmazonElastiCacheFullAccess"
    },
    [AckServiceName.OPENSEARCHSERVICE]: {
      chart: "opensearchservice-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonOpenSearchServiceFullAccess"
    },
    [AckServiceName.OPENSEARCHSERVERLESS]: {
      chart: "opensearchserverless-chart",
      version:  "0.2.0",
      managedPolicyName: "AmazonOpenSearchServiceFullAccess"
    },
    [AckServiceName.MQ]: {
      chart: "mq-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonMQFullAccess"
    },
    [AckServiceName.LAMBDA]: {
      chart: "lambda-chart",
      version:  "1.9.0",
      managedPolicyName: "AWSLambda_FullAccess"
    },
    [AckServiceName.KMS]: {
      chart: "kms-chart",
      version:  "1.1.0",
      managedPolicyName: "AWSKeyManagementServicePowerUser"
    },
    [AckServiceName.MEMORYDB]: {
      chart: "memorydb-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonMemoryDBFullAccess"
    },
    [AckServiceName.EKS]: {
      chart: "eks-chart",
      version:  "1.9.1",
      inlinePolicyStatements: [PolicyStatement.fromJson({
        "Effect": "Allow",
        "Action": [
          "eks:*",
          "iam:GetRole",
          "iam:PassRole"
        ],
        "Resource": "*"
      })]
    },
    [AckServiceName.APPLICATIONAUTOSCALING]: {
      chart: "applicationautoscaling-chart",
      version:  "1.1.0",
      managedPolicyName: "AutoScalingFullAccess"
    },
    [AckServiceName.ELASTICSEARCHSERVICE]: {
      chart: "elasticsearchservice-chart",
      version:  "0.0.2",
      managedPolicyName: "AmazonElasticsearchServiceRolePolicy"
    },
    [AckServiceName.PROMETHEUSSERVICE]: {
      chart: "prometheusservice-chart",
      version:  "1.3.0",
      managedPolicyName: "AmazonPrometheusFullAccess"
    },
    [AckServiceName.EMRCONTAINERS]: {
      chart: "emrcontainers-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonEMRContainersServiceRolePolicy"
    },
    [AckServiceName.SFN]: {
      chart: "sfn-chart",
      version:  "1.1.0",
      managedPolicyName: "AWSStepFunctionsFullAccess"
    },
    [AckServiceName.KINESIS]: {
      chart: "kinesis-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonKinesisFullAccess"
    },
    [AckServiceName.CLOUDTRAIL]: {
      chart: "cloudtrail-chart",
      version:  "1.1.0",
      managedPolicyName: "AWSCloudTrail_FullAccess"
    },
    [AckServiceName.ACM]: {
      chart: "acm-chart",
      version:  "1.1.0",
      managedPolicyName: "AWSCertificateManagerFullAccess"
    },
    [AckServiceName.ROUTE53]: {
      chart: "route53-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonRoute53FullAccess"
    },
    [AckServiceName.SQS]: {
      chart: "sqs-chart",
      version:  "1.2.0",
      managedPolicyName: "AmazonSQSFullAccess"
    },
    [AckServiceName.SAGEMAKER]: {
      chart: "sagemaker-chart",
      version:  "1.4.0",
      managedPolicyName: "AmazonSageMakerFullAccess"
    },
    [AckServiceName.EVENTBRIDGE]: {
      chart: "eventbridge-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonEventBridgeFullAccess"
    },
    [AckServiceName.PIPES]: {
      chart: "pipes-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonEventBridgePipesFullAccess"
    },
    [AckServiceName.SECRETSMANAGER]: {
      chart: "secretsmanager-chart",
      version:  "1.1.0",
      managedPolicyName: "SecretsManagerReadWrite"
    },
    [AckServiceName.CLOUDWATCH]: {
      chart: "cloudwatch-chart",
      version:  "1.2.0",
      managedPolicyName: "CloudWatchFullAccess"
    },
    [AckServiceName.ROUTE53RESOLVER]: {
      chart: "route53resolver-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonRoute53ResolverFullAccess"
    },
    [AckServiceName.ACMPCA]: {
      chart: "acmpca-chart",
      version:  "1.1.0",
      managedPolicyName: "AWSCertificateManagerPrivateCAFullAccess"
    },
    [AckServiceName.CLOUDWATCHLOGS]: {
      chart: "cloudwatchlogs-chart",
      version:  "1.1.0",
      managedPolicyName: "CloudWatchLogsFullAccess"
    },
    [AckServiceName.KAFKA]: {
      chart: "kafka-chart",
      version:  "1.2.0",
      managedPolicyName: "AmazonMSKFullAccess"
    },
    [AckServiceName.ATHENA]: {
      chart: "athena-chart",
      version:  "1.1.0",
      managedPolicyName: "AmazonAthenaFullAccess"
    },
    [AckServiceName.BEDROCKAGENT]: {
      chart: "bedrockagent-chart",
      version: "0.1.0",
      managedPolicyName: "AmazonBedrockFullAccess"
    },
    [AckServiceName.CLOUDFRONT]: {
      chart: "cloudfront-chart",
      version: "1.2.0",
      managedPolicyName: "CloudFrontFullAccess"
    },
    [AckServiceName.CODEARTIFACT]: {
      chart: "codeartifact-chart",
      version: "1.1.0",
      managedPolicyName: "AWSCodeArtifactAdminAccess"
    },
    [AckServiceName.COGNITOIDENTITYPROVIDER]: {
      chart: "cognitoidentityprovider-chart",
      version: "1.1.0",
      managedPolicyName: "AmazonCognitoPowerUser"
    },
    [AckServiceName.DOCUMENTDB]: {
      chart: "documentdb-chart",
      version: "1.1.0",
      managedPolicyName: "AmazonDocDBFullAccess"
    },
    [AckServiceName.ECS]: {
      chart: "ecs-chart",
      version: "1.1.0",
      managedPolicyName: "AmazonECS_FullAccess"
    },
    [AckServiceName.EFS]: {
      chart: "efs-chart",
      version: "1.1.0",
      managedPolicyName: "AmazonElasticFileSystemFullAccess"
    },
    [AckServiceName.ELBV2]: {
      chart: "elbv2-chart",
      version: "1.1.0",
      managedPolicyName: "ElasticLoadBalancingFullAccess"
    },
    [AckServiceName.GLUE]: {
      chart: "glue-chart",
      version: "0.2.0",
      managedPolicyName: "AWSGlueConsoleFullAccess"
    },
    [AckServiceName.KEYSPACES]: {
      chart: "keyspaces-chart",
      version: "1.1.0",
      managedPolicyName: "AmazonKeyspacesFullAccess"
    },
    [AckServiceName.NETWORKFIREWALL]: {
      chart: "networkfirewall-chart",
      version: "1.1.0",
      managedPolicyName: "AWSNetworkFirewallFullAccess"
    },
    [AckServiceName.ORGANIZATIONS]: {
      chart: "organizations-chart",
      version: "1.1.0",
      managedPolicyName: "AWSOrganizationsFullAccess"
    },
    [AckServiceName.RAM]: {
      chart: "ram-chart",
      version: "1.1.0",
      managedPolicyName: "AWSResourceAccessManagerFullAccess"
    },
    [AckServiceName.RECYCLEBIN]: {
      chart: "recyclebin-chart",
      version: "1.1.0",
      inlinePolicyStatements: [PolicyStatement.fromJson({
        "Effect": "Allow",
        "Action": [
          "rbin:*",
          "tag:GetResources"
        ],
        "Resource": "*"
      })]
    },
    [AckServiceName.S3CONTROL]: {
      chart: "s3control-chart",
      version: "1.1.0",
      managedPolicyName: "AmazonS3FullAccess"
    },
    [AckServiceName.SES]: {
      chart: "ses-chart",
      version: "1.1.0",
      managedPolicyName: "AmazonSESFullAccess"
    },
    [AckServiceName.SSM]: {
      chart: "ssm-chart",
      version: "1.1.0",
      managedPolicyName: "AmazonSSMFullAccess"
    },
    [AckServiceName.WAFV2]: {
      chart: "wafv2-chart",
      version: "1.1.0",
      managedPolicyName: "AWSWAFFullAccess"
    },

};
