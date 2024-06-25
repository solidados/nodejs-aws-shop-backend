import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import { IProduct, IStock } from "./product.interface";
import { handleAPIGatewayError, NotFoundError } from "./errorHandler";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { PRODUCTS_TABLE_NAME, STOCKS_TABLE_NAME } = process.env;

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const productId: string | undefined = event.pathParameters?.productId;
  console.log("Received request:", event);

  const productParams = {
    TableName: PRODUCTS_TABLE_NAME!,
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: { ":id": productId },
  };

  const stockParams = {
    TableName: STOCKS_TABLE_NAME!,
    KeyConditionExpression: "product_id = :product_id",
    ExpressionAttributeValues: { ":product_id": productId },
  };

  try {
    const [productsItems, stocksItems] = await Promise.all([
      dynamoDb.query(productParams).promise(),
      dynamoDb.query(stockParams).promise(),
    ]);

    if (!productsItems.Items || !stocksItems.Items) {
      throw new NotFoundError();
    }

    if (!productsItems.Items.length || !stocksItems.Items.length) {
      throw new NotFoundError();
    }
    const product = productsItems.Items[0] as IProduct;
    const stock = stocksItems.Items[0] as IStock;

    const productJointStock = {
      ...product,
      counts: stock.count,
    } as IProduct;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productJointStock),
    };
  } catch (error: any) {
    console.error("Error retrieving product:", error);
    return handleAPIGatewayError(error);
  }
};
