import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importServiceS3Bucket: cdk.aws_s3.IBucket = s3.Bucket.fromBucketName(
      this,
      "ImportServiceS3Bucket",
      "import-service-s3-vedro",
    );

    const importProdFileFunction: cdk.aws_lambda.Function = new lambda.Function(
      this,
      "importProdFileFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "importProductsFile.handler",
        environment: {
          BUCKET_NAME: importServiceS3Bucket.bucketName,
        },
      },
    );

    importServiceS3Bucket.grantReadWrite(importProdFileFunction);

    const api = new apigateway.RestApi(this, "import-service-api", {
      restApiName: "Import Service API",
      cloudWatchRole: true,
      cloudWatchRoleRemovalPolicy: RemovalPolicy.DESTROY,
    });

    const importProductsFileResource = api.root.addResource("import");
    const importProdFileFunctionIntegration = new apigateway.LambdaIntegration(
      importProdFileFunction,
    );
    importProductsFileResource.addMethod(
      "GET",
      importProdFileFunctionIntegration,
      { requestParameters: { "method.request.querystring.name": true } },
    );

    const deployment = new apigateway.Deployment(this, "Deployment", { api });

    api.deploymentStage = new apigateway.Stage(this, "developmentStage", {
      stageName: "development",
      deployment,
    });
  }
}
