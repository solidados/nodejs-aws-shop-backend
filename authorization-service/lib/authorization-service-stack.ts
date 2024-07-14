import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { AuthorizationLambdaClass } from "./utils/AuthorizationLambda.class";

export class AuthorizationServiceStack extends cdk.Stack {
  handler: lambda.IFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new AuthorizationLambdaClass(this, 'AuthorizationHandler');
  }
}
