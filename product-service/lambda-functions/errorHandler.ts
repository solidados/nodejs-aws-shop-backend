import { APIGatewayProxyResult } from "aws-lambda";
import { ErrorResponse } from "./error.interface";

const errorMap: Record<string, ErrorResponse> = {
  NotFoundError: { statusCode: 404, message: "404 Not found" },
  BadRequestError: { statusCode: 400, message: "400 Bad request" },
  InternalServerError: {
    statusCode: 500,
    message: "500 Internal server error",
  },
};

export function handleAPIGatewayError(error: any): APIGatewayProxyResult {
  const defaultError: ErrorResponse = {
    statusCode: 500,
    message: `Error occurred: ${error}`,
  };

  if (error instanceof Error && error.name in errorMap) {
    const { statusCode, message } = errorMap[error.name];
    return createErrorResponse(statusCode, message);
  } else {
    return createErrorResponse(defaultError.statusCode, defaultError.message);
  }
}

function createErrorResponse(
  statusCode: number,
  message: string,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  };
}

export class NotFoundError extends Error {
  constructor() {
    super("Not found error");
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  constructor(message?: string) {
    super(message || "Bad request error");
    this.name = "BadRequestError";
  }
}
