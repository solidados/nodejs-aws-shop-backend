import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { ProductWithStockType } from "./types/productWithStock.interface";

const sqsClient = new SQSClient({});

export const noticeLambda = async (
  products: ProductWithStockType[],
): Promise<void> => {
  const messageCommand = new SendMessageCommand({
    QueueUrl: process.env.SQS_URL,
    MessageBody: JSON.stringify(products),
  });

  await sqsClient.send(messageCommand);
};
