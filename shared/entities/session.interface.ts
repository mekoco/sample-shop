export interface ISession {
  id: string;  // Unique sessionId
  cartId?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;  // 7-day expiration as per requirements
  createdAt: Date;
  updatedAt: Date;
}