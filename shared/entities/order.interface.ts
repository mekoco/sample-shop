import { IOrderItem } from './order-item.interface';
import { IShippingAddress, IAddress } from './address.interface';
import { OrderStatus, PaymentMethod, PaymentStatus } from './types';

export interface IOrder {
  id: string;
  orderNumber: string;  // Human-readable order number
  sessionId?: string;   // Link to guest session
  status: OrderStatus;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  billingAddress?: IAddress;  // Optional, may be same as shipping
  emailHash: string;    // Hashed email for privacy as per requirements
  phone?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;  // Stripe/payment provider reference
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}