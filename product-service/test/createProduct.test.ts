// createProduct.test.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { handler } from "../lambda-functions/createProduct";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

jest.mock("aws-sdk");
jest.mock("uuid");

const dynamodb = new AWS.DynamoDB.DocumentClient();

describe("createProduct lambda function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PRODUCTS_TABLE_NAME = "products";
    process.env.STOCKS_TABLE_NAME = "stocks";
  });

  afterEach(() => {
    delete process.env.PRODUCTS_TABLE_NAME;
    delete process.env.STOCKS_TABLE_NAME;
  });

  it("should create a new product and return status 200", async () => {
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        title: "Product 1",
        description: "Description 1",
        price: 100,
        count: 10,
      }),
    } as APIGatewayProxyEvent;

    (uuidv4 as jest.Mock).mockReturnValue("uuid-1234");

    const transactWritePromiseMock = jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({}),
    });

    (dynamodb.transactWrite as jest.Mock).mockImplementation(() => ({
      promise: transactWritePromiseMock,
    }));

    const result: APIGatewayProxyResult = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(
      JSON.stringify({ message: "Product created successfully" })
    );

    expect(transactWritePromiseMock).toHaveBeenCalledWith();
    expect(dynamodb.transactWrite).toHaveBeenCalledWith({
      TransactItems: [
        {
          Put: {
            TableName: "products",
            Item: {
              id: "uuid-1234",
              title: "Product 1",
              description: "Description 1",
              price: 100,
            },
          },
        },
        {
          Put: {
            TableName: "stocks",
            Item: {
              product_id: "uuid-1234",
              count: 10,
            },
          },
        },
      ],
    });
  });

  it("should return status 400 if product data is invalid", async () => {
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        title: "",
        description: "Description 1",
        price: -100,
      }),
    } as APIGatewayProxyEvent;

    const result: APIGatewayProxyResult = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(JSON.stringify({ message: "Invalid product data" }));
  });

  it("should return an error if DynamoDB transaction fails", async () => {
    const event: APIGatewayProxyEvent = {
      body: JSON.stringify({
        title: "Product 1",
        description: "Description 1",
        price: 100,
        count: 10,
      }),
    } as APIGatewayProxyEvent;

    (uuidv4 as jest.Mock).mockReturnValue("uuid-1234");

    const transactWritePromiseMock = jest.fn().mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error("DynamoDB error")),
    });

    (dynamodb.transactWrite as jest.Mock).mockImplementation(() => ({
      promise: transactWritePromiseMock,
    }));

    const result: APIGatewayProxyResult = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(result.body).toBe(JSON.stringify({ message: "Internal server error" }));

    expect(transactWritePromiseMock).toHaveBeenCalledWith();
    expect(dynamodb.transactWrite).toHaveBeenCalledWith({
      TransactItems: [
        {
          Put: {
            TableName: "products",
            Item: {
              id: "uuid-1234",
              title: "Product 1",
              description: "Description 1",
              price: 100,
            },
          },
        },
        {
          Put: {
            TableName: "stocks",
            Item: {
              product_id: "uuid-1234",
              count: 10,
            },
          },
        },
      ],
    });
  });
});
