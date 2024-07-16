import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { IProduct } from "../product.interface";

const snsClient = new SNSClient({});

type CombinedProduct = IProduct & { count: number };

export const createSNS = async ({ title, price, description, count, id }: CombinedProduct) => {
  const messageBody = `New product created:\nProduct: ${title}\nPrice: ${price},\nDescription: ${description},\nCount: ${count || 0}`;
  
  const publishCommand = new PublishCommand({
    TopicArn: process.env.SNS_EVENT_ARN || '',
    Message: messageBody,
    MessageAttributes: {
      count: {
        DataType: 'Number',
        StringValue: count.toString(),
      },
      price: {
        DataType: 'Number',
        StringValue: price.toString(),
      },
    },
  });
  
  await snsClient.send(publishCommand);
  console.log(`Product ${title} from SQS was created to DB`);
};
