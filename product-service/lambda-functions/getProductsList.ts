import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import { IProduct, IStock } from "./product.interface";
import { handleAPIGatewayError, NotFoundError } from "./errorHandler";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE_NAME: string = process.env.PRODUCTS_TABLE_NAME!;
const STOCKS_TABLE_NAME: string = process.env.STOCKS_TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Received request:", event);

  try {
    const [productsItems, stocksItems] = await Promise.all([
      dynamoDb.scan({ TableName: PRODUCTS_TABLE_NAME! }).promise(),
      dynamoDb.scan({ TableName: STOCKS_TABLE_NAME! }).promise(),
    ]);

    const products = productsItems.Items as IProduct[];
    const stocks = stocksItems.Items as IStock[];

    if (!products.length || !stocks.length) {
      console.error("Products or stocks table not found");
      throw new NotFoundError();
    }

    const productsJointStocks = products.map((product: IProduct) => {
      const stock: IStock | undefined = stocks.find(
        (stock: IStock): boolean => stock.product_id === product.id,
      );
      return { ...product, count: stock ? stock.count : 0 };
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productsJointStocks),
    };
  } catch (error: any) {
    console.error("Error retrieving products list:", error);
    return handleAPIGatewayError(error);
  }
};
