import { APIGatewayAuthorizerResult } from "aws-lambda";
import { StatementEffect } from "aws-lambda/trigger/api-gateway-authorizer";

export const authorizationResponse = (
  effect: StatementEffect,
  methodArn: string,
): APIGatewayAuthorizerResult => {
  return {
    principalId: process.env.LOGIN || "",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: ["execute-api:Invoke"],
          Effect: effect,
          Resource: methodArn,
        },
      ],
    },
  };
};
