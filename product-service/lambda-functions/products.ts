import { IProduct } from "./product.interface";
import { v4 } from "uuid";

export const products: IProduct[] = [
  {
    id: v4(),
    title: "Product 1",
    description: "Product 1 description",
    price: 99.79,
    // count: 10
  },
  {
    id: v4(),
    title: "Product 2",
    description: "Product 2 description",
    price: 120.89,
    // count: 14
  },
  {
    id: v4(),
    title: "Product 3",
    description: "Product 3 description",
    price: 250.99,
    // count: 3
  },
];
