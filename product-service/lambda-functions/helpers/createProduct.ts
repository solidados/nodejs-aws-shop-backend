import { IProduct, ProductInfo } from "../product.interface";
import { v4 } from "uuid";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const ddbClient = new DynamoDBClient({});
export const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const productsTableName = process.env.PRODUCTS_TABLE_NAME ?? "products";
const stocksTableName = process.env.STOCK_TABLE_NAME ?? "stocks";

export const createProduct = async (
  product: ProductInfo,
): Promise<IProduct & { count: number }> => {
  const id: string = v4();
  const { title, description, price, count } = product;

  const PriceNumber: number = Number(price);
  const CountNumber: number = Number(count) || 0;

  const transactCommand = new TransactWriteCommand({
    TransactItems: [
      {
        Put: {
          TableName: productsTableName,
          Item: {
            id,
            title,
            description,
            price: PriceNumber,
          },
        },
      },
      {
        Put: {
          TableName: stocksTableName,
          Item: {
            product_id: id,
            count: CountNumber,
          },
        },
      },
    ],
  });

  await ddbDocClient.send(transactCommand);

  return {
    id,
    ...product,
    count: count || 0,
  };
};
