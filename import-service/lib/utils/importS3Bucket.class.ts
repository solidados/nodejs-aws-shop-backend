import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cr from "aws-cdk-lib/custom-resources";

type CorsPolicy = {
  AllowedHeaders: string[];
  AllowedMethods: string[];
  AllowedOrigins: string[];
};

export class ImportS3Bucket {
  public static readonly CORS_POLICY: CorsPolicy = {
    AllowedHeaders: ["*"],
    AllowedMethods: ["PUT"],
    AllowedOrigins: ["*"],
  };
  public readonly bucket: s3.IBucket;

  constructor(scope: Construct, bucketName: string) {
    this.bucket = s3.Bucket.fromBucketName(
      scope,
      "ImportServiceS3Bucket",
      bucketName,
    );

    new cr.AwsCustomResource(scope, "PutCorsConfig", {
      onCreate: {
        service: "S3",
        action: "putBucketCors",
        parameters: {
          Bucket: this.bucket.bucketName,
          CORSConfiguration: {
            CORSRules: [ImportS3Bucket.CORS_POLICY],
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          `PutCorsConfiguration-${this.bucket.bucketName}`,
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
  }
}
