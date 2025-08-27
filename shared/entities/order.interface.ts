import { IOrderItem } from './order-item.interface';
import { IShippingAddress, IAddress } from './address.interface';
import { OrderStatus, PaymentStatus, PaymentMethod } from './types';

export { OrderStatus, PaymentStatus, PaymentMethod } from './types';

export interface IOrder {
  id: string;
  orderNumber: string;
  sessionId?: string;
  status: OrderStatus;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  billingAddress?: IAddress;
  emailHash: string;
  phone?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}