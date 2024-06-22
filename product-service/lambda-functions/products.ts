import { IProduct } from "./handlers/product.interface";
import { uuid } from "uuidv4";

export const products: IProduct[] = [
  {
    id: uuid(),
    title: "Product 1",
    description: "Product 1 description",
    price: 99.79,
  },
  {
    id: uuid(),
    title: "Product 2",
    description: "Product 2 description",
    price: 120.89,
  },
  {
    id: uuid(),
    title: "Product 3",
    description: "Product 3 description",
    price: 250.99,
  },
];
