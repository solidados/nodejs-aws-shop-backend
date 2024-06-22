import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { HttpMethod } from "../lambda-functions/types/httpMethods.enum";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, "ProductsTable", {
      tableName: "products_table",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "title", type: dynamodb.AttributeType.STRING },
    });

    const stocksTable = new dynamodb.Table(this, "StocksTable", {
      tableName: "stocks_table",
      partitionKey: {
        name: "products_id",
        type: dynamodb.AttributeType.STRING,
      },
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

    const getProductsListFunction = new lambda.Function(
      this,
      "GetProductsListHandler",
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        code: lambda.Code.fromAsset("lambda-types"),
        handler: "getProductsList.handler",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
        },
      },
    );
    getProductsListFunction.addToRolePolicy(dynamoPolicy);

    const getProductByIdFunction = new lambda.Function(
      this,
      "GetProductByIdHandler",
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        code: lambda.Code.fromAsset("lambda-types"),
        handler: "getProductById.handler",
        environment: {
          PRODUCTS_TABLE_NAME: stocksTable.tableName,
        },
      },
    );
    getProductByIdFunction.addToRolePolicy(dynamoPolicy);

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

    const fillTablesFunction = new lambda.Function(this, "FillTablesHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda-types"),
      handler: "fillTables.handler",
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });
    fillTablesFunction.addToRolePolicy(dynamoPolicy);
  }
}
