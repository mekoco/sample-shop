import { ISession } from '../../../shared/entities/session.interface';
import { randomBytes } from 'crypto';

export class Session implements ISession {
  id: string;
  cartId?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(data?: Partial<Session>) {
    this.id = data?.id || this.generateSessionId();
    this.cartId = data?.cartId;
    this.ipAddress = data?.ipAddress;
    this.userAgent = data?.userAgent;
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
  }

  private generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  toJSON(): any {
    return {
      id: this.id,
      cartId: this.cartId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      expiresAt: this.expiresAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  static fromJSON(data: any): Session {
    return new Session({
      id: data.id,
      cartId: data.cartId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt: new Date(data.expiresAt),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }
}