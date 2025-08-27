import { IProduct } from './product.interface';

export interface IOrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: IProduct;
  productName: string;
  productSku: string;
  quantity: number;
  priceAtTime: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}