import { SQSEvent } from "aws-lambda";
import { ProductInfo } from "./product.interface";
import { BadRequestError } from "./errorHandler";
import { createProduct } from "./helpers/createProduct";
import { createSNS } from "./helpers/createSNS";

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log("CatalogBatchProcess Lambda function was called...");

  const products: ProductInfo[] = event.Records.flatMap((item) =>
    JSON.parse(item.body || "{}"),
  );

  for (const product of products) {
    try {
      const isValidProduct: boolean = !!(
        product.title &&
        product.description &&
        product.price
      );

      if (!isValidProduct)
        throw new BadRequestError("Requires: Title, Description, Price");

      const createdProduct = await createProduct(product);
      await createSNS(createdProduct);
    } catch (error) {
      console.error("Error creating product:", error);
    }
  }
};
