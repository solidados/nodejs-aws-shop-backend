import { SQSEvent, SQSRecord } from 'aws-lambda';
import { handler } from '../lambda-functions/catalogBatchProcess';
import { createProduct } from '../lambda-functions/helpers/createProduct';
import { createSNS } from '../lambda-functions/helpers/createSNS';
import { BadRequestError } from '../lambda-functions/errorHandler';

jest.mock('../lambda-functions/helpers/createProduct');
jest.mock('../lambda-functions/helpers/createSNS');

const mockedCreateProduct = createProduct as jest.MockedFunction<typeof createProduct>;
const mockedCreateSNS = createSNS as jest.MockedFunction<typeof createSNS>;

describe('catalogBatchProcess', (): void => {
  beforeEach((): void => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation((): void => { });
  });

  it('should process valid products from SQS event', async (): Promise<void> => {
    const mockProduct = { title: 'Test Product', description: 'A great product', price: 100, count: 10 };
    const record: SQSRecord = {
      messageId: '1',
      receiptHandle: 'handle',
      body: JSON.stringify(mockProduct),
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1',
        SequenceNumber: '1',
        MessageGroupId: 'group-id',
        MessageDeduplicationId: 'deduplication-id',
        SenderId: 'sender-id',
        ApproximateFirstReceiveTimestamp: '1',
      },
      messageAttributes: {},
      md5OfBody: 'md5',
      eventSource: 'aws:sqs',
      eventSourceARN: 'source-arn',
      awsRegion: 'us-east-1',
    };

    const event: SQSEvent = {
      Records: [record],
    };

    mockedCreateProduct.mockResolvedValue({ id: '1', ...mockProduct, count: 10 });
    mockedCreateSNS.mockResolvedValue(undefined);

    await handler(event);

    expect(mockedCreateProduct).toHaveBeenCalledWith(mockProduct);
    expect(mockedCreateSNS).toHaveBeenCalledWith({ id: '1', ...mockProduct, count: 10 });
  });

  it('should throw BadRequestError if product is missing required fields', async (): Promise<void> => {
    const invalidProduct = { title: 'Invalid Product' };
    const record: SQSRecord = {
      messageId: '1',
      receiptHandle: 'handle',
      body: JSON.stringify(invalidProduct),
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1',
        SequenceNumber: '1',
        MessageGroupId: 'group-id',
        MessageDeduplicationId: 'deduplication-id',
        SenderId: 'sender-id',
        ApproximateFirstReceiveTimestamp: '1',
      },
      messageAttributes: {},
      md5OfBody: 'md5',
      eventSource: 'aws:sqs',
      eventSourceARN: 'source-arn',
      awsRegion: 'us-east-1',
    };

    const event: SQSEvent = {
      Records: [record],
    };

    await expect(handler(event)).resolves.not.toThrow();

    expect(console.error).toHaveBeenCalledWith("Error creating product:", expect.any(BadRequestError));
  });

  it('should handle errors when createProduct fails', async (): Promise<void> => {
    const validProduct = { title: 'Valid Product', description: 'Valid description', price: 50 };
    const record: SQSRecord = {
      messageId: '1',
      receiptHandle: 'handle',
      body: JSON.stringify(validProduct),
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1',
        SequenceNumber: '1',
        MessageGroupId: 'group-id',
        MessageDeduplicationId: 'deduplication-id',
        SenderId: 'sender-id',
        ApproximateFirstReceiveTimestamp: '1',
      },
      messageAttributes: {},
      md5OfBody: 'md5',
      eventSource: 'aws:sqs',
      eventSourceARN: 'source-arn',
      awsRegion: 'us-east-1',
    };

    const event: SQSEvent = {
      Records: [record],
    };

    mockedCreateProduct.mockRejectedValue(new Error('DynamoDB Error'));

    await handler(event);

    expect(console.error).toHaveBeenCalledWith("Error creating product:", expect.any(Error));
  });

  it('should handle errors when createSNS fails', async (): Promise<void> => {
    const validProduct = { title: 'Valid Product', description: 'Valid description', price: 50 };
    const record: SQSRecord = {
      messageId: '1',
      receiptHandle: 'handle',
      body: JSON.stringify(validProduct),
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1',
        SequenceNumber: '1',
        MessageGroupId: 'group-id',
        MessageDeduplicationId: 'deduplication-id',
        SenderId: 'sender-id',
        ApproximateFirstReceiveTimestamp: '1',
      },
      messageAttributes: {},
      md5OfBody: 'md5',
      eventSource: 'aws:sqs',
      eventSourceARN: 'source-arn',
      awsRegion: 'us-east-1',
    };

    const event: SQSEvent = {
      Records: [record],
    };

    mockedCreateProduct.mockResolvedValue({ id: '1', ...validProduct, count: 0 });
    mockedCreateSNS.mockRejectedValue(new Error('SNS Error'));

    await handler(event);

    expect(console.error).toHaveBeenCalledWith("Error creating product:", expect.any(Error));
  });
});
