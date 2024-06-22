import * as AWS from "aws-sdk";
import { products } from "../products";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const PRODUCTS_TABLE_NAME: string = process.env.PRODUCTS_TABLE_NAME!;
const STOCKS_TABLE_NAME: string = process.env.STOCKS_TABLE_NAME!;

export const handler = async (): Promise<void> => {
  try {
    for (const product of products) {
      await dynamoDb
        .put({
          TableName: PRODUCTS_TABLE_NAME,
          Item: product,
        })
        .promise();

      await dynamoDb
        .put({
          TableName: STOCKS_TABLE_NAME,
          Item: {
            products_id: product.id,
            count: 0,
          },
        })
        .promise();
    }
    console.log("Tables filled successfully");
  } catch (error: any) {
    console.error(error.message);
  }
};
