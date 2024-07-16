import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { ImportProductsFile } from "./importProductsFile.class";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { AUTH_NAME_ARN } from "../../../constants/constants";

export class ApiGateway extends Construct {
  constructor(
    scope: Construct,
    id: string,
    importProductsFile: ImportProductsFile,
  ) {
    super(scope, id);

    const lambdaArn: string = cdk.Fn.importValue(AUTH_NAME_ARN);
    const authorizerLambdaFn = lambda.Function.fromFunctionArn(
      this,
      "authorizerLambdaFn",
      lambdaArn,
    );

    const api = new apigateway.RestApi(this, id, {
      restApiName: "Import Service API",
      cloudWatchRole: true,
      cloudWatchRoleRemovalPolicy: RemovalPolicy.DESTROY,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const importProductsFileResource = api.root.addResource("import");

    const importProductsFileFunctionIntegration =
      new apigateway.LambdaIntegration(importProductsFile.lambdaFunction);

    const authorizer = new apigateway.TokenAuthorizer(this, "ApiGwAuthorizer", {
      identitySource: "method.request.header.Authorization",
      handler: authorizerLambdaFn,
    });

    importProductsFileResource.addMethod(
      "GET",
      importProductsFileFunctionIntegration,
      {
        requestParameters: { "method.request.querystring.name": true },
        authorizationType: apigateway.AuthorizationType.CUSTOM,
        authorizer,
      },
    );

    const deployment = new apigateway.Deployment(this, "Deployment", { api });

    api.deploymentStage = new apigateway.Stage(this, "devStage", {
      stageName: "dev",
      deployment,
    });

    const responseHeaders = {
      "Access-Control-Allow-Origin": "'*'",
      "Access-Control-Allow-Headers":
        "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
      "Access-Control-Allow-Methods": "'OPTIONS,GET,PUT,POST,DELETE'",
    };

    api.addGatewayResponse("GatewayResponseUnauthorized", {
      type: apigateway.ResponseType.UNAUTHORIZED,
      responseHeaders,
      statusCode: "401",
    });

    api.addGatewayResponse("GatewayResponseAccessDenied", {
      type: apigateway.ResponseType.ACCESS_DENIED,
      responseHeaders,
      statusCode: "403",
    });
  }
}
