import * as AWS from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
// import { handleAPIGatewayError } from "./errorHandler";
import { ProductInfo } from "./product.interface";
import { v4 } from "uuid";

const dynamodb = new AWS.DynamoDB.DocumentClient();

const productsTableName = process.env.PRODUCTS_TABLE_NAME || "products";
const stocksTableName = process.env.STOCKS_TABLE_NAME || "stocks";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}") as ProductInfo;
    const id = v4();
    const { title, description, price, count } = body;

    const productParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: productsTableName,
      Item: { id, title, description, price },
    };

    const stockParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: stocksTableName,
      Item: { product_id: id, count },
    };

    await dynamodb.put(productParams).promise();
    await dynamodb.put(stockParams).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Product created successfully" }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: error.message }),
    };
  }
};
