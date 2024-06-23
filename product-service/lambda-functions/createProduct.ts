import * as AWS from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { ProductInfo } from "./product.interface";
import { v4 } from "uuid";

import { handleAPIGatewayError } from "./errorHandler";
import { BadRequestError } from "./errorHandler";

const dynamodb = new AWS.DynamoDB.DocumentClient();

const productsTableName: string = process.env.PRODUCTS_TABLE_NAME || "products";
const stocksTableName: string = process.env.STOCKS_TABLE_NAME || "stocks";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Received request:", event);
  
  try {
    const body = JSON.parse(event.body || "{}") as ProductInfo;
    const id: string = v4();
    const { title, description, price, count = 0 } = body;
    
    if (!title || !description || !price) {
      throw new BadRequestError();
    }
    console.log("Here code continue to work if no ERROR");

    const productParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: productsTableName,
      Item: { id, title, description, price },
    };

    const stockParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      TableName: stocksTableName,
      Item: { product_id: id, count },
    };

    const transactParams: AWS.DynamoDB.DocumentClient.TransactWriteItemsInput =
      {
        TransactItems: [{ Put: productParams }, { Put: stockParams }],
      };

    await dynamodb.transactWrite(transactParams).promise();

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
    console.error("Error creating product:", error);
    return handleAPIGatewayError(error);
  }
};
