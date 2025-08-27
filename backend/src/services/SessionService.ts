import { createClient, RedisClientType } from 'redis';
import { Session } from '../entities/Session';
import crypto from 'crypto';

export class SessionService {
  private redisClient: RedisClientType;
  private connected: boolean = false;

  constructor(redisClient?: RedisClientType) {
    this.redisClient = redisClient || createClient();
  }

  async connect(): Promise<void> {
    if (!this.connected && !this.redisClient.isOpen) {
      await this.redisClient.connect();
      this.connected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.redisClient.quit();
      this.connected = false;
    }
  }

  generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async createSession(ipAddress?: string, userAgent?: string): Promise<Session> {
    await this.connect();
    
    const session = new Session({
      id: this.generateSessionId(),
      ipAddress,
      userAgent,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const key = `session:${session.id}`;
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds

    await this.redisClient.setEx(
      key,
      ttl,
      JSON.stringify(session.toJSON())
    );

    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    await this.connect();
    
    const key = `session:${sessionId}`;
    const data = await this.redisClient.get(key);

    if (!data) {
      return null;
    }

    const session = Session.fromJSON(JSON.parse(data));
    
    if (session.isExpired()) {
      await this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  async updateSession(session: Session): Promise<void> {
    await this.connect();
    
    session.updatedAt = new Date();
    const key = `session:${session.id}`;
    const ttl = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));

    await this.redisClient.setEx(
      key,
      ttl,
      JSON.stringify(session.toJSON())
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.connect();
    
    const key = `session:${sessionId}`;
    await this.redisClient.del(key);
  }

  async extendSession(sessionId: string, days: number = 7): Promise<Session | null> {
    await this.connect();
    
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    session.expiresAt = expirationDate;

    await this.updateSession(session);
    return session;
  }

  async cleanupExpiredSessions(): Promise<number> {
    await this.connect();
    
    const keys = await this.redisClient.keys('session:*');
    let cleaned = 0;

    for (const key of keys) {
      const data = await this.redisClient.get(key);
      if (data) {
        const session = Session.fromJSON(JSON.parse(data));
        if (session.isExpired()) {
          await this.redisClient.del(key);
          cleaned++;
        }
      }
    }

    return cleaned;
  }
}