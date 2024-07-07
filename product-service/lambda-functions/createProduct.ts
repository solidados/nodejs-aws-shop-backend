import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ProductInfo } from "./product.interface";
import { createProduct } from "./helpers/createProduct";
import { BadRequestError, handleAPIGatewayError } from "./errorHandler";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}") as ProductInfo;
    const { title, description, price, count } = body;

    if (!body) {
      throw new BadRequestError();
    }

    if (!title || !description || !price) {
      throw new BadRequestError("Requires: Title, Description, Price");
    }

    await createProduct(body);

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
