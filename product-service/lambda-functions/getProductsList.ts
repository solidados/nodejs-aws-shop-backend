import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import { IProduct } from "./product.interface";
import { NotFoundError, handleAPIGatewayError } from "./errorHandler";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE_NAME: string = process.env.PRODUCTS_TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Received request:", event);

  try {
    const params = { TableName: PRODUCTS_TABLE_NAME };
    const result = await dynamoDb.scan(params).promise();
    const products: IProduct[] = result.Items as IProduct[];

    if (!products.length) {
      throw new NotFoundError();
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(products),
    };
  } catch (error: any) {
    console.error("Error retrieving products list:", error);
    return handleAPIGatewayError(error);
  }
};
