import { IProduct } from './product.interface';

export interface ICartItem {
  id: string;
  cartId: string;
  productId: string;
  product?: IProduct;  // For populated queries
  quantity: number;
  priceAtTime: number;  // Snapshot of price when added
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}