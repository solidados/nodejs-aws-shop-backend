export const REGION = "eu-central-1";
export const BUCKET_NAME = process.env.name;
export const BUCKET_URL = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com`;
