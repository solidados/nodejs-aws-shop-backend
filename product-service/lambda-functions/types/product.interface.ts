export interface IProduct {
  id: string;
  title: string;
  description: string;
  price: number;
}

export type ProductInfo = Omit<IProduct, "id">;
