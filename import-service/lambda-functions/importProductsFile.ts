import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createErrorResponse } from "./helpers/errorHandler";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { BUCKET_NAME, REGION } from "./helpers/constatns";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Received request:", event);

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization,X-Api-Key,X-Amz-Date,X-Amz-Security-Token",
  };

  const fileName: string | undefined = event.queryStringParameters?.name;

  if (!fileName) {
    return createErrorResponse(400, "File name is required");
  }

  const s3Client = new S3Client({ region: REGION });

  const putObjectCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `uploaded/${fileName}`,
  });

  try {
    const signedUrl: string = await getSignedUrl(s3Client, putObjectCommand);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(signedUrl),
    };
  } catch (error: any) {
    return createErrorResponse(
      500,
      `Could not get file from Bucket: ${error.message}`,
    );
  }
};
