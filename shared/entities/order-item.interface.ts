import { IProduct } from './product.interface';

export interface IOrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: IProduct;  // For populated queries
  productName: string;  // Snapshot of product name
  productSku: string;   // Snapshot of SKU
  quantity: number;
  priceAtTime: number;  // Price snapshot at order time
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}