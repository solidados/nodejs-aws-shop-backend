import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { HttpMethod } from "../lambda-functions/httpMethods.enum";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";

import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getTable = (
      tableName: string,
      tableProps: dynamodb.TableProps,
    ): dynamodb.ITable => {
      try {
        return dynamodb.Table.fromTableName(this, `${tableName}Ref`, tableName);
      } catch {
        return new dynamodb.Table(this, tableName, tableProps);
      }
    };

    const productsTable = getTable("products", {
      tableName: "products",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "title", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stocksTable = getTable("stocks", {
      tableName: "stocks",
      partitionKey: {
        name: "products_id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const dynamoPolicy = new iam.PolicyStatement({
      actions: [
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
      ],
      resources: [productsTable.tableArn, stocksTable.tableArn],
    });

    const productsEnvironment = {
      PRODUCTS_TABLE_NAME: productsTable.tableName,
      STOCKS_TABLE_NAME: stocksTable.tableName,
    };

    /** -- SQS -- */
    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "CatalogItemsQueueServiceOne",
    });

    new cdk.CfnOutput(this, "CatalogItemsQueueUrl", {
      value: catalogItemsQueue.queueArn,
      exportName: "CatalogItemsQueueServiceOne",
    });

    /** -- SNS -- */
    const snsCreateProductTopic = new sns.Topic(this, "snsCreateProductTopic", {
      topicName: "CreateProduct-SNSTopic",
    });

    /** -- SNS Subscriptions -- */
    snsCreateProductTopic.addSubscription(
      new subscriptions.EmailSubscription("pashauph75@gmail.com", {
        filterPolicy: {
          count: sns.SubscriptionFilter.numericFilter({ lessThanOrEqualTo: 5 }),
        },
      }),
    );

    snsCreateProductTopic.addSubscription(
      new subscriptions.EmailSubscription("pashauph@me.com", {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({ greaterThan: 1000 }),
        },
      }),
    );

    /** -- Lambda Functions Creators -- */
    const getProductsListFunction = new lambda.Function(
      this,
      "GetProductsListHandler",
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "getProductsList.handler",
        environment: productsEnvironment,
      },
    );
    getProductsListFunction.addToRolePolicy(dynamoPolicy);

    const getProductByIdFunction = new lambda.Function(
      this,
      "GetProductByIdHandler",
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "getProductById.handler",
        environment: productsEnvironment,
      },
    );
    getProductByIdFunction.addToRolePolicy(dynamoPolicy);

    const createProductFunction = new lambda.Function(
      this,
      "CreateProductHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "createProduct.handler",
        environment: productsEnvironment,
      },
    );
    createProductFunction.addToRolePolicy(dynamoPolicy);

    /** -- SQS Catalog Batch Process -- */
    const catalogBatchProcessFunction = new lambda.Function(
      this,
      "CreateCatalogBatchProcessHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda-functions"),
        handler: "catalogBatchProcess.handler",
        environment: {
          ...productsEnvironment,
          SQS_CATALOG_URL: catalogItemsQueue.queueUrl,
          SNS_EVENT_ARN: snsCreateProductTopic.topicArn,
        },
      },
    );
    catalogBatchProcessFunction.addToRolePolicy(dynamoPolicy);
    catalogItemsQueue.grantConsumeMessages(catalogBatchProcessFunction);
    catalogBatchProcessFunction.addEventSource(
      new SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      }),
    );
    snsCreateProductTopic.grantPublish(catalogBatchProcessFunction);

    const api = new apigateway.RestApi(this, "ProductsApi", {
      restApiName: "Products Service",
      description: "This service serves products",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const productsResource = api.root.addResource("products");
    productsResource.addMethod(
      HttpMethod.GET,
      new apigateway.LambdaIntegration(getProductsListFunction),
    );

    const productResource = productsResource.addResource("{id}");
    productResource.addMethod(
      HttpMethod.GET,
      new apigateway.LambdaIntegration(getProductByIdFunction),
    );

    productsResource.addMethod(
      HttpMethod.POST,
      new apigateway.LambdaIntegration(createProductFunction),
    );
  }
}
