import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ImportS3Bucket } from "./utils/importS3Bucket.class";
import { ImportProductsFile } from "./utils/importProductsFile.class";
import { ImportFileParser } from "./utils/importFileParser.class";
import { ApiGateway } from "./utils/apiGateway.class";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucketName: string = "import-service-s3-vedro";
    const importS3Bucket = new ImportS3Bucket(
      this,
      "ImportS3Bucket",
      bucketName,
    );

    const importProductsFile = new ImportProductsFile(
      this,
      "ImportProductsFile",
      importS3Bucket,
    );

    const importFileParser = new ImportFileParser(
      this,
      "ImportFileParser",
      importS3Bucket,
    );

    new ApiGateway(this, "ApiGateway", importProductsFile);
  }
}
