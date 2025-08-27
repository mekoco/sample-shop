import { ICart } from '../../../shared/entities/cart.interface';
import { ICartItem } from '../../../shared/entities/cart-item.interface';
import { randomBytes } from 'crypto';

export class Cart implements ICart {
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

  constructor(data?: Partial<Cart>) {
    this.id = data?.id || this.generateCartId();
    this.sessionId = data?.sessionId || '';
    this.items = data?.items || [];
    this.currency = data?.currency || 'USD';
    this.createdAt = data?.createdAt || new Date();
    this.updatedAt = data?.updatedAt || new Date();
    
    // Set expiration to 7 days from creation
    if (data?.expiresAt) {
      this.expiresAt = data.expiresAt;
    } else {
      const expirationDate = new Date(this.createdAt);
      expirationDate.setDate(expirationDate.getDate() + 7);
      this.expiresAt = expirationDate;
    }

    // Calculate totals
    this.calculateTotals();
    
    // Override with provided values if any
    if (data?.subtotal !== undefined) this.subtotal = data.subtotal;
    if (data?.tax !== undefined) this.tax = data.tax;
    if (data?.shipping !== undefined) this.shipping = data.shipping;
    if (data?.total !== undefined) this.total = data.total;
  }

  private generateCartId(): string {
    return 'cart_' + randomBytes(16).toString('hex');
  }

  calculateTotals(): void {
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    this.tax = this.subtotal * 0.08; // 8% tax rate
    this.shipping = this.subtotal > 50 ? 0 : 10; // Free shipping over $50
    this.total = this.subtotal + this.tax + this.shipping;
  }

  addItem(item: ICartItem): void {
    const existingItem = this.items.find(i => i.productId === item.productId);
    if (existingItem) {
      existingItem.quantity += item.quantity;
      existingItem.subtotal = existingItem.priceAtTime * existingItem.quantity;
    } else {
      this.items.push(item);
    }
    this.calculateTotals();
    this.updatedAt = new Date();
  }

  removeItem(productId: string): void {
    this.items = this.items.filter(item => item.productId !== productId);
    this.calculateTotals();
    this.updatedAt = new Date();
  }

  updateItemQuantity(productId: string, quantity: number): void {
    const item = this.items.find(i => i.productId === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        item.subtotal = item.priceAtTime * quantity;
        this.calculateTotals();
        this.updatedAt = new Date();
      }
    }
  }

  clearCart(): void {
    this.items = [];
    this.calculateTotals();
    this.updatedAt = new Date();
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  toJSON(): any {
    return {
      id: this.id,
      sessionId: this.sessionId,
      items: this.items,
      subtotal: this.subtotal,
      tax: this.tax,
      shipping: this.shipping,
      total: this.total,
      currency: this.currency,
      expiresAt: this.expiresAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  static fromJSON(data: any): Cart {
    return new Cart({
      id: data.id,
      sessionId: data.sessionId,
      items: data.items,
      subtotal: data.subtotal,
      tax: data.tax,
      shipping: data.shipping,
      total: data.total,
      currency: data.currency,
      expiresAt: new Date(data.expiresAt),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }
}