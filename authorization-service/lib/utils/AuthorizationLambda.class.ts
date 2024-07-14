import * as dotenv from "dotenv";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { AUTH_NAME_ARN } from "../../../constants/constants";

dotenv.config();

export class AuthorizationLambdaClass extends Construct {
  handler: lambda.IFunction;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const login: string = process.env.LOGIN ?? '';
    const password : string = process.env.PASSWORD ?? '';
    
    this.handler = new lambda.Function(this, "AuthorizationHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "basicAuthorizer.handler",
      code: lambda.Code.fromAsset("lambda-functions"),
      environment: { LOGIN: login, PASSWORD: password }
    });
    
    this.handler.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'))
    
    new cdk.CfnOutput(this, "AuthorizerLambdaArn", {
      value: this.handler.functionArn,
      exportName: AUTH_NAME_ARN,
    });
  }
}
