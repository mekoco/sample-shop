import { IProduct } from './product.interface';

export interface ICartItem {
  id: string;
  cartId: string;
  productId: string;
  product?: IProduct;
  quantity: number;
  priceAtTime: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}