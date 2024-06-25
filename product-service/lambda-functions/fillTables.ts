import * as AWS from "aws-sdk";
import { products } from "./products";

AWS.config.update({ region: "eu-central-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: "eu-central-1" });
const PRODUCTS_TABLE_NAME: string = "products";
const STOCKS_TABLE_NAME: string = "stocks";

export const fillTables = async (): Promise<void> => {
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

fillTables();
