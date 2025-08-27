import 'reflect-metadata';
import { Cart } from '../Cart';
import { ICart } from '../../../../shared/entities/cart.interface';
import { ICartItem } from '../../../../shared/entities/cart-item.interface';
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

// Mock CartService class for testing
class MockCartService {
  constructor(private redisClient: any) {}

  async createForSession(sessionId: string): Promise<Cart> {
    const cart = new Cart({
      sessionId: sessionId
    });
    await this.save(cart);
    return cart;
  }

  async save(cart: Cart): Promise<void> {
    const key = `cart:${cart.id}`;
    const ttl = Math.floor((cart.expiresAt.getTime() - Date.now()) / 1000);
    await this.redisClient.setex(key, ttl, JSON.stringify(cart.toJSON()));
  }

  async get(cartId: string): Promise<Cart | null> {
    const key = `cart:${cartId}`;
    const data = await this.redisClient.get(key);
    if (!data) return null;
    return Cart.fromJSON(JSON.parse(data));
  }

  toOrderData(cart: Cart): any {
    return {
      items: cart.items,
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      total: cart.total,
      currency: cart.currency
    };
  }
}

// Helper function to create mock cart item
function createMockCartItem(productId: string, quantity: number, priceAtTime: number): ICartItem {
  return {
    id: `item-${productId}`,
    cartId: 'cart-123',
    productId: productId,
    quantity: quantity,
    priceAtTime: priceAtTime,
    subtotal: quantity * priceAtTime,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

describe('Cart Entity', () => {
  let mockCartService: MockCartService;

  beforeAll(async () => {
    // Setup mock cart service
    mockCartService = new MockCartService(mockRedisClient);
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
    it('should implement ICart interface', () => {
      // Test 1: Verify Cart class implements ICart
      const cart = new Cart({ sessionId: 'session-123' });
      const cartAsInterface: ICart = cart;
      
      expect(cart).toBeDefined();
      expect(cartAsInterface).toBeDefined();
      
      // Verify basic properties exist
      expect(cart.id).toBeDefined();
      expect(cart.sessionId).toBeDefined();
      expect(cart.items).toBeDefined();
      expect(cart.subtotal).toBeDefined();
      expect(cart.tax).toBeDefined();
      expect(cart.shipping).toBeDefined();
      expect(cart.total).toBeDefined();
      expect(cart.currency).toBeDefined();
      expect(cart.expiresAt).toBeDefined();
    });

    it('should have all required ICart properties', () => {
      // Test 2: Verify all interface properties are present
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      expect(cart.id).toBeDefined();
      expect(cart.sessionId).toBe('session-456');
      expect(cart.items).toEqual([]);
      expect(cart.subtotal).toBe(0);
      expect(cart.tax).toBeDefined();
      expect(cart.shipping).toBeDefined();
      expect(cart.total).toBeDefined();
      expect(cart.currency).toBe('USD');
      expect(cart.expiresAt).toBeDefined();
      expect(cart.createdAt).toBeDefined();
      expect(cart.updatedAt).toBeDefined();
    });
  });

  describe('Cart Items Management', () => {
    it('should add items to cart', () => {
      // Test 3: Verify adding items to cart
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item = createMockCartItem('prod-1', 2, 25.99);
      cart.addItem(item);
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productId).toBe('prod-1');
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].subtotal).toBe(51.98);
    });

    it('should update existing item quantity', () => {
      // Test 4: Verify updating item quantities
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item = createMockCartItem('prod-1', 2, 10.00);
      cart.addItem(item);
      
      cart.updateItemQuantity('prod-1', 5);
      
      expect(cart.items[0].quantity).toBe(5);
      expect(cart.items[0].subtotal).toBe(50.00);
    });

    it('should remove items from cart', () => {
      // Test 5: Verify removing items
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item1 = createMockCartItem('prod-1', 1, 10.00);
      const item2 = createMockCartItem('prod-2', 2, 20.00);
      
      cart.addItem(item1);
      cart.addItem(item2);
      
      expect(cart.items).toHaveLength(2);
      
      cart.removeItem('prod-1');
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productId).toBe('prod-2');
    });

    it('should merge duplicate product entries', () => {
      // Test 6: Verify duplicate product handling
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item1 = createMockCartItem('prod-1', 2, 10.00);
      cart.addItem(item1);
      
      const item2 = createMockCartItem('prod-1', 3, 10.00); // Same product
      cart.addItem(item2);
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5); // 2 + 3
      expect(cart.items[0].subtotal).toBe(50.00);
    });

    it('should remove item when quantity is set to 0', () => {
      // Test 7: Verify removing items by setting quantity to 0
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item = createMockCartItem('prod-1', 2, 10.00);
      cart.addItem(item);
      
      expect(cart.items).toHaveLength(1);
      
      cart.updateItemQuantity('prod-1', 0);
      
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('Price Calculations', () => {
    it('should calculate subtotal correctly', () => {
      // Test 8: Verify subtotal calculation
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item1 = createMockCartItem('prod-1', 2, 10.00);
      const item2 = createMockCartItem('prod-2', 1, 15.00);
      
      cart.addItem(item1);
      cart.addItem(item2);
      
      expect(cart.subtotal).toBe(35.00);
    });

    it('should calculate tax correctly', () => {
      // Test 9: Verify tax calculation (8% default rate)
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item = createMockCartItem('prod-1', 1, 100.00);
      cart.addItem(item);
      
      // Tax is calculated automatically at 8%
      expect(cart.tax).toBe(8.00);
    });

    it('should calculate shipping correctly', () => {
      // Test 10: Verify shipping calculation
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      // Free shipping over $50
      const item1 = createMockCartItem('prod-1', 1, 60.00);
      cart.addItem(item1);
      expect(cart.shipping).toBe(0);
      
      // Clear cart and test with under $50
      cart.clearCart();
      const item2 = createMockCartItem('prod-2', 1, 25.00);
      cart.addItem(item2);
      expect(cart.shipping).toBe(10); // Standard shipping
    });

    it('should calculate total with all components', () => {
      // Test 11: Verify total calculation
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item = createMockCartItem('prod-1', 1, 100.00);
      cart.addItem(item);
      
      // subtotal: 100, tax: 8, shipping: 0 (over $50), total: 108
      expect(cart.total).toBe(108.00);
    });

    it('should handle decimal precision in calculations', () => {
      // Test 12: Verify decimal handling
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item1 = createMockCartItem('prod-1', 3, 19.99);
      const item2 = createMockCartItem('prod-2', 2, 14.49);
      
      cart.addItem(item1); // 59.97
      cart.addItem(item2); // 28.98
      
      expect(cart.subtotal).toBe(88.95);
      
      // Tax at 8% = 7.116, should be rounded appropriately
      expect(cart.tax).toBeCloseTo(7.12, 2);
    });
  });

  describe('Cart Expiration', () => {
    it('should set expiration to 7 days from creation', () => {
      // Test 13: Verify 7-day expiration period
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const diffInMs = cart.expiresAt.getTime() - cart.createdAt.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      
      expect(diffInDays).toBe(7);
    });

    it('should check if cart is expired', () => {
      // Test 14: Verify expiration checking logic
      const activeCart = new Cart({
        sessionId: 'session-456'
      });
      activeCart.expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      expect(activeCart.isExpired()).toBe(false);
      
      const expiredCart = new Cart({
        sessionId: 'session-456'
      });
      expiredCart.expiresAt = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      expect(expiredCart.isExpired()).toBe(true);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize to JSON correctly', () => {
      // Test 15: Verify JSON serialization
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item = createMockCartItem('prod-1', 2, 25.99);
      cart.addItem(item);
      
      const json = cart.toJSON();
      
      expect(json.id).toBe(cart.id);
      expect(json.sessionId).toBe(cart.sessionId);
      expect(json.items).toEqual(cart.items);
      expect(json.subtotal).toBe(cart.subtotal);
      expect(json.tax).toBe(cart.tax);
      expect(json.shipping).toBe(cart.shipping);
      expect(json.total).toBe(cart.total);
      expect(json.currency).toBe(cart.currency);
      expect(json.expiresAt).toBe(cart.expiresAt.toISOString());
      expect(json.createdAt).toBe(cart.createdAt.toISOString());
      expect(json.updatedAt).toBe(cart.updatedAt.toISOString());
    });

    it('should deserialize from JSON correctly', () => {
      // Test 16: Verify JSON deserialization
      const originalCart = new Cart({
        sessionId: 'session-789'
      });
      
      const item = createMockCartItem('prod-1', 1, 15.00);
      originalCart.addItem(item);
      
      const json = originalCart.toJSON();
      const deserializedCart = Cart.fromJSON(json);
      
      expect(deserializedCart.id).toBe(originalCart.id);
      expect(deserializedCart.sessionId).toBe(originalCart.sessionId);
      expect(deserializedCart.items).toEqual(originalCart.items);
      expect(deserializedCart.subtotal).toBe(originalCart.subtotal);
      expect(deserializedCart.tax).toBe(originalCart.tax);
      expect(deserializedCart.shipping).toBe(originalCart.shipping);
      expect(deserializedCart.total).toBe(originalCart.total);
      expect(deserializedCart.currency).toBe(originalCart.currency);
      expect(deserializedCart.expiresAt.getTime()).toBe(originalCart.expiresAt.getTime());
      expect(deserializedCart.createdAt.getTime()).toBe(originalCart.createdAt.getTime());
      expect(deserializedCart.updatedAt.getTime()).toBe(originalCart.updatedAt.getTime());
    });
  });

  describe('Redis Storage (Mocked)', () => {
    it('should save cart to Redis', async () => {
      // Test 17: Verify cart can be stored in Redis (mocked)
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      await mockCartService.save(cart);
      
      const expectedKey = `cart:${cart.id}`;
      
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        expectedKey,
        expect.any(Number),
        JSON.stringify(cart.toJSON())
      );
    });

    it('should retrieve cart from Redis', async () => {
      // Test 18: Verify cart retrieval from Redis (mocked)
      const originalCart = new Cart({
        sessionId: 'session-789'
      });
      
      // Mock Redis get to return the cart data
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(originalCart.toJSON()));
      
      const retrieved = await mockCartService.get(originalCart.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(originalCart.id);
      expect(retrieved?.sessionId).toBe(originalCart.sessionId);
    });

    it('should set TTL matching cart expiration', async () => {
      // Test 19: Verify Redis TTL matches cart expiration
      const cart = new Cart({
        sessionId: 'session-456'
      });
      cart.expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
      
      await mockCartService.save(cart);
      
      // Verify setex was called with appropriate TTL (should be around 3600 seconds)
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        expect.stringContaining('cart:'),
        expect.any(Number),
        expect.any(String)
      );
      
      const setexCall = mockRedisClient.setex.mock.calls[0];
      const ttlUsed = setexCall[1];
      expect(ttlUsed).toBeGreaterThan(3500);
      expect(ttlUsed).toBeLessThanOrEqual(3600);
    });

    it('should handle cart not found', async () => {
      // Test 20: Verify handling of non-existent cart
      mockRedisClient.get.mockResolvedValueOnce(null);
      
      const retrieved = await mockCartService.get('non-existent-cart');
      
      expect(retrieved).toBeNull();
    });
  });

  describe('Cart Service', () => {
    it('should create cart for session', async () => {
      // Test 21: Verify cart creation
      const cart = await mockCartService.createForSession('session-123');
      
      expect(cart.id).toMatch(/^cart_[a-f0-9]{32}$/);
      expect(cart.sessionId).toBe('session-123');
      expect(cart.items).toEqual([]);
      // Empty cart has shipping of 10 (since subtotal is 0 < 50)
      expect(cart.total).toBe(10);
    });

    it('should clear cart contents', () => {
      // Test 22: Verify cart clearing
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item1 = createMockCartItem('prod-1', 2, 10.00);
      const item2 = createMockCartItem('prod-2', 1, 20.00);
      
      cart.addItem(item1);
      cart.addItem(item2);
      
      expect(cart.items).toHaveLength(2);
      expect(cart.subtotal).toBeGreaterThan(0);
      expect(cart.total).toBeGreaterThan(0);
      
      cart.clearCart();
      
      expect(cart.items).toEqual([]);
      expect(cart.subtotal).toBe(0);
      // After clearing, cart has shipping of 10 (since subtotal is 0 < 50)
      expect(cart.total).toBe(10);
    });

    it('should convert cart to order data', async () => {
      // Test 23: Verify cart to order conversion
      const cart = await mockCartService.createForSession('session-123');
      
      const item = createMockCartItem('prod-1', 2, 25.99);
      cart.addItem(item);
      
      const orderData = mockCartService.toOrderData(cart);
      
      expect(orderData.items).toHaveLength(1);
      expect(orderData.subtotal).toBe(cart.subtotal);
      expect(orderData.tax).toBe(cart.tax);
      expect(orderData.shipping).toBe(cart.shipping);
      expect(orderData.total).toBe(cart.total);
      expect(orderData.currency).toBe(cart.currency);
    });
  });

  describe('Cart Constructor', () => {
    it('should create cart with default values', () => {
      // Test 24: Verify default constructor behavior
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      expect(cart.id).toBeDefined();
      expect(cart.sessionId).toBe('session-456');
      expect(cart.items).toEqual([]);
      expect(cart.subtotal).toBe(0);
      expect(cart.tax).toBe(0);
      // Empty cart has shipping of 10 (since subtotal is 0 < 50)
      expect(cart.shipping).toBe(10);
      expect(cart.total).toBe(10);
      expect(cart.currency).toBe('USD');
      expect(cart.createdAt).toBeDefined();
      expect(cart.updatedAt).toBeDefined();
      expect(cart.expiresAt).toBeDefined();
    });

    it('should create cart with provided data', () => {
      // Test 25: Verify constructor with partial data
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour
      const items = [createMockCartItem('prod-1', 1, 10.00)];
      
      const cart = new Cart({
        id: 'custom-cart-id',
        sessionId: 'session-123',
        items: items,
        subtotal: 10.00,
        tax: 0.80,
        shipping: 5.00,
        total: 15.80,
        currency: 'EUR',
        createdAt: now,
        expiresAt: expiresAt
      });
      
      expect(cart.id).toBe('custom-cart-id');
      expect(cart.sessionId).toBe('session-123');
      expect(cart.items).toEqual(items);
      expect(cart.subtotal).toBe(10.00);
      expect(cart.tax).toBe(0.80);
      expect(cart.shipping).toBe(5.00);
      expect(cart.total).toBe(15.80);
      expect(cart.currency).toBe('EUR');
      expect(cart.createdAt).toBe(now);
      expect(cart.expiresAt).toBe(expiresAt);
    });
  });

  describe('Edge Cases', () => {
    it('should handle updating quantity of non-existent item', () => {
      // Test 26: Verify behavior when updating non-existent item
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      // This should not throw an error, just do nothing
      cart.updateItemQuantity('non-existent-product', 5);
      
      expect(cart.items).toHaveLength(0);
    });

    it('should handle removing non-existent item', () => {
      // Test 27: Verify behavior when removing non-existent item
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item = createMockCartItem('prod-1', 1, 10.00);
      cart.addItem(item);
      
      expect(cart.items).toHaveLength(1);
      
      // This should not throw an error
      cart.removeItem('non-existent-product');
      
      expect(cart.items).toHaveLength(1); // Original item should still be there
    });

    it('should handle negative quantity update by removing item', () => {
      // Test 28: Verify negative quantity handling
      const cart = new Cart({
        sessionId: 'session-456'
      });
      
      const item = createMockCartItem('prod-1', 2, 10.00);
      cart.addItem(item);
      
      expect(cart.items).toHaveLength(1);
      
      cart.updateItemQuantity('prod-1', -1);
      
      expect(cart.items).toHaveLength(0); // Item should be removed
    });
  });
});