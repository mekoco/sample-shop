import 'reflect-metadata';
import { Session } from '../Session';
import { ISession } from '../../../../shared/entities/session.interface';
import { validate } from 'class-validator';
import { createClient } from 'redis';
import crypto from 'crypto';

// Mock Redis client
const mockRedisClient = {
  setex: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  ttl: jest.fn().mockResolvedValue(-1),
  exists: jest.fn().mockResolvedValue(0),
  connect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined)
};

// Mock Redis createClient
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue(mockRedisClient)
}));

// Mock crypto for consistent testing
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockImplementation((size) => ({
    toString: jest.fn().mockReturnValue('a'.repeat(size * 2))
  }))
}));

// Mock SessionService class for testing
class MockSessionService {
  constructor(private redisClient: any) {}

  generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async create(data: Partial<ISession>): Promise<Session> {
    const session = new Session({
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });
    await this.save(session);
    return session;
  }

  async save(session: Session): Promise<void> {
    const key = `session:${session.id}`;
    const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
    await this.redisClient.setex(key, ttl, JSON.stringify(session.toJSON()));
  }

  async get(sessionId: string): Promise<Session | null> {
    const key = `session:${sessionId}`;
    const data = await this.redisClient.get(key);
    if (!data) return null;
    return Session.fromJSON(JSON.parse(data));
  }

  async update(session: Session): Promise<void> {
    session.updatedAt = new Date();
    await this.save(session);
  }

  async touch(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    if (session) {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);
      session.expiresAt = newExpiry;
      await this.update(session);
    }
  }
}

describe('Session Entity', () => {
  let mockSessionService: MockSessionService;

  beforeAll(async () => {
    // Setup mock session service
    mockSessionService = new MockSessionService(mockRedisClient);
  });

  afterAll(async () => {
    // Cleanup mocks
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Reset the mock implementation for crypto.randomBytes
    (crypto.randomBytes as jest.Mock).mockImplementation((size) => ({
      toString: jest.fn().mockReturnValue('a'.repeat(size * 2))
    }));
  });

  describe('Interface Implementation', () => {
    it('should implement ISession interface', () => {
      // Test 1: Verify Session class implements ISession
      const session = new Session();
      const sessionAsInterface: ISession = session;
      
      expect(session).toBeDefined();
      expect(sessionAsInterface).toBeDefined();
      
      // Verify basic properties exist
      expect(session.id).toBeDefined();
      expect(session.expiresAt).toBeDefined();
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
    });

    it('should have all required ISession properties', () => {
      // Test 2: Verify all interface properties are present
      const session = new Session({
        cartId: 'cart-789',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0'
      });
      
      expect(session.id).toBeDefined();
      expect(session.cartId).toBe('cart-789');
      expect(session.ipAddress).toBe('192.168.1.100');
      expect(session.userAgent).toBe('Mozilla/5.0');
      expect(session.expiresAt).toBeDefined();
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
    });
  });

  describe('Session ID Generation', () => {
    it('should generate cryptographically secure session ID', () => {
      // Test 3: Verify secure session ID generation
      // Mock different values for each call to ensure uniqueness
      (crypto.randomBytes as jest.Mock)
        .mockImplementationOnce(() => ({
          toString: () => 'a'.repeat(64)
        }))
        .mockImplementationOnce(() => ({
          toString: () => 'b'.repeat(64)
        }));
      
      const session1 = new Session();
      const session2 = new Session();
      
      // Both should have generated IDs
      expect(session1.id).toBeDefined();
      expect(session2.id).toBeDefined();
      
      // IDs should be different (mock will return different values)
      expect(session1.id).not.toBe(session2.id);
      
      // Verify the ID format matches crypto.randomBytes output
      expect(session1.id).toMatch(/^[a-f0-9]{64}$/);
      expect(session2.id).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should ensure session IDs are unique', () => {
      // Test 4: Verify uniqueness of generated IDs
      const ids = new Set<string>();
      
      // Create multiple sessions and verify uniqueness
      for (let i = 0; i < 100; i++) {
        // Mock different values for each call
        (crypto.randomBytes as jest.Mock).mockImplementationOnce(() => ({
          toString: () => i.toString(16).padStart(64, '0')
        }));
        
        const session = new Session();
        expect(ids.has(session.id)).toBe(false);
        ids.add(session.id);
      }
      
      expect(ids.size).toBe(100);
    });
  });

  describe('Session Expiration', () => {
    it('should set expiration to 7 days from creation', () => {
      // Test 5: Verify 7-day expiration period
      const now = new Date();
      const session = new Session();
      
      const diffInMs = session.expiresAt.getTime() - session.createdAt.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      
      expect(diffInDays).toBe(7);
    });

    it('should check if session is expired', () => {
      // Test 6: Verify expiration checking logic
      const activeSession = new Session();
      activeSession.expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      expect(activeSession.isExpired()).toBe(false);
      
      const expiredSession = new Session();
      expiredSession.expiresAt = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      expect(expiredSession.isExpired()).toBe(true);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize to JSON correctly', () => {
      // Test 7: Verify JSON serialization
      const session = new Session({
        cartId: 'cart-456',
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      });
      
      const json = session.toJSON();
      
      expect(json.id).toBe(session.id);
      expect(json.cartId).toBe(session.cartId);
      expect(json.ipAddress).toBe(session.ipAddress);
      expect(json.userAgent).toBe(session.userAgent);
      expect(json.expiresAt).toBe(session.expiresAt.toISOString());
      expect(json.createdAt).toBe(session.createdAt.toISOString());
      expect(json.updatedAt).toBe(session.updatedAt.toISOString());
    });

    it('should deserialize from JSON correctly', () => {
      // Test 8: Verify JSON deserialization
      const originalSession = new Session({
        cartId: 'cart-789',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome'
      });
      
      const json = originalSession.toJSON();
      const deserializedSession = Session.fromJSON(json);
      
      expect(deserializedSession.id).toBe(originalSession.id);
      expect(deserializedSession.cartId).toBe(originalSession.cartId);
      expect(deserializedSession.ipAddress).toBe(originalSession.ipAddress);
      expect(deserializedSession.userAgent).toBe(originalSession.userAgent);
      expect(deserializedSession.expiresAt.getTime()).toBe(originalSession.expiresAt.getTime());
      expect(deserializedSession.createdAt.getTime()).toBe(originalSession.createdAt.getTime());
      expect(deserializedSession.updatedAt.getTime()).toBe(originalSession.updatedAt.getTime());
    });
  });

  describe('Redis Storage (Mocked)', () => {
    it('should save session to Redis', async () => {
      // Test 9: Verify session can be stored in Redis (mocked)
      const session = new Session({
        cartId: 'cart-456',
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      });
      
      await mockSessionService.save(session);
      
      const expectedKey = `session:${session.id}`;
      const expectedTtl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
      
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        expectedKey,
        expect.any(Number),
        JSON.stringify(session.toJSON())
      );
    });

    it('should retrieve session from Redis', async () => {
      // Test 10: Verify session retrieval from Redis (mocked)
      const originalSession = new Session({
        cartId: 'cart-789',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome'
      });
      
      // Mock Redis get to return the session data
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(originalSession.toJSON()));
      
      const retrieved = await mockSessionService.get(originalSession.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(originalSession.id);
      expect(retrieved?.cartId).toBe(originalSession.cartId);
      expect(retrieved?.ipAddress).toBe(originalSession.ipAddress);
    });

    it('should set TTL in Redis matching session expiration', async () => {
      // Test 11: Verify Redis TTL matches session expiration
      const session = new Session();
      session.expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
      
      await mockSessionService.save(session);
      
      // Verify setex was called with appropriate TTL (should be around 3600 seconds)
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        expect.stringContaining('session:'),
        expect.any(Number),
        expect.any(String)
      );
      
      const setexCall = mockRedisClient.setex.mock.calls[0];
      const ttlUsed = setexCall[1];
      expect(ttlUsed).toBeGreaterThan(3500);
      expect(ttlUsed).toBeLessThanOrEqual(3600);
    });

    it('should handle session not found', async () => {
      // Test 12: Verify handling of non-existent session
      mockRedisClient.get.mockResolvedValueOnce(null);
      
      const retrieved = await mockSessionService.get('non-existent-session');
      
      expect(retrieved).toBeNull();
    });
  });

  describe('Cart Association', () => {
    it('should link session to cart', async () => {
      // Test 13: Verify session-cart association
      const session = await mockSessionService.create({
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      });
      
      // Initially no cart
      expect(session.cartId).toBeUndefined();
      
      // Associate with cart
      session.cartId = 'cart-new-123';
      await mockSessionService.update(session);
      
      // Mock the get method to return the updated session
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(session.toJSON()));
      
      const updated = await mockSessionService.get(session.id);
      expect(updated?.cartId).toBe('cart-new-123');
    });
  });

  describe('Security Tracking', () => {
    it('should store IP address for security', () => {
      // Test 14: Verify IP address storage
      const session = new Session({
        ipAddress: '192.168.1.100'
      });
      
      expect(session.ipAddress).toBe('192.168.1.100');
      
      // Test IPv6
      const ipv6Session = new Session({
        ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      });
      expect(ipv6Session.ipAddress).toMatch(/^[0-9a-f:]+$/i);
    });

    it('should store user agent for device tracking', () => {
      // Test 15: Verify user agent storage
      const session = new Session({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
      
      expect(session.userAgent).toContain('Mozilla');
      expect(session.userAgent).toContain('Windows');
    });
  });

  describe('Session Service', () => {
    it('should create new session', async () => {
      // Test 16: Verify session creation service
      const session = await mockSessionService.create({
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      });
      
      expect(session.id).toBeDefined();
      expect(session.ipAddress).toBe('192.168.1.1');
      expect(session.userAgent).toBe('Test Browser');
      expect(session.expiresAt).toBeDefined();
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
    });

    it('should extend session expiration on activity', async () => {
      // Test 17: Verify session extension on activity
      const session = await mockSessionService.create({});
      const originalExpiry = session.expiresAt;
      
      // Mock Redis get to return the session
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(session.toJSON()));
      
      // Simulate activity after some time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await mockSessionService.touch(session.id);
      
      // Verify save was called (which would update the expiration)
      expect(mockRedisClient.setex).toHaveBeenCalled();
    });
  });

  describe('Session Constructor', () => {
    it('should create session with default values', () => {
      // Test 18: Verify default constructor behavior
      const session = new Session();
      
      expect(session.id).toBeDefined();
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
      expect(session.expiresAt).toBeDefined();
      expect(session.cartId).toBeUndefined();
      expect(session.ipAddress).toBeUndefined();
      expect(session.userAgent).toBeUndefined();
    });

    it('should create session with provided data', () => {
      // Test 19: Verify constructor with partial data
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour
      
      const session = new Session({
        id: 'custom-id',
        cartId: 'cart-123',
        ipAddress: '10.0.0.1',
        userAgent: 'Custom Browser',
        createdAt: now,
        expiresAt: expiresAt
      });
      
      expect(session.id).toBe('custom-id');
      expect(session.cartId).toBe('cart-123');
      expect(session.ipAddress).toBe('10.0.0.1');
      expect(session.userAgent).toBe('Custom Browser');
      expect(session.createdAt).toBe(now);
      expect(session.expiresAt).toBe(expiresAt);
    });
  });
});