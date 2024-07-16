import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { IQueue } from "aws-cdk-lib/aws-sqs";

export class CatalogItemsQueueClass extends Construct {
  catalogItemsQueue: IQueue;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const catalogItemsQueueArn: string = cdk.Fn.importValue(
      "CatalogItemsQueueServiceOne",
    );
    this.catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      "catalogItemsQueue",
      catalogItemsQueueArn,
    );
  }
}
