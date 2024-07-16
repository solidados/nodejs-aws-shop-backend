import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";
import { StatementEffect } from "aws-lambda/trigger/api-gateway-authorizer";
import { authorizationResponse } from "./helpers/authorizationResponse";

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  const auth = {
    login: process.env.LOGIN || "",
    password: process.env.PASSWORD || "",
  };

  let effect: StatementEffect = "Deny";
  const token = event.authorizationToken.split(" ")[1];

  if (!token) {
    console.log(`token`, token);
    return authorizationResponse(effect, event.methodArn);
  }

  const buf = Buffer.from(token, "base64").toString("utf-8");
  console.log(buf);
  const [user, pass] = buf.split(":");

  console.log("user", user, "pass", pass);

  if (user === auth.login || pass === auth.password) effect = "Allow";

  console.log("effect", effect);
  return authorizationResponse(effect, event.methodArn);
};

