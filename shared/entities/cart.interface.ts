import { ICartItem } from './cart-item.interface';

export interface ICart {
  id: string;
  sessionId: string;
  items: ICartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}