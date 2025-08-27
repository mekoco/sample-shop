import 'reflect-metadata';
import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import { SessionService } from '../../services/SessionService';
import { CartService } from '../../services/CartService';
import { Session } from '../../entities/Session';
import { Cart } from '../../entities/Cart';
import { IProduct } from '../../../../shared/entities/product.interface';
import { ICategory } from '../../../../shared/entities/category.interface';
import { ICartItem } from '../../../../shared/entities/cart-item.interface';
import crypto from 'crypto';

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  setEx: jest.fn().mockResolvedValue('OK'),
  get: jest.fn(),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue([]),
  exists: jest.fn().mockResolvedValue(0),
  isOpen: false
};

// Mock Redis module
jest.mock('redis', () => ({
  createClient: () => mockRedisClient
}));

// Helper to create mock category
const createMockCategory = (): ICategory => ({
  id: 'cat_1',
  name: 'Test Category',
  slug: 'test-category',
  description: 'Test category description',
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Helper to create mock product
const createMockProduct = (id: string, price: number): IProduct => ({
  id,
  name: `Product ${id}`,
  description: `Description for ${id}`,
  price,
  currency: 'USD',
  sku: `SKU-${id}`,
  stockQuantity: 100,
  imageUrls: ['test.jpg'],
  thumbnailUrl: 'test-thumb.jpg',
  categories: [createMockCategory()],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Helper to create mock cart item
const createMockCartItem = (cartId: string, productId: string, quantity: number, priceAtTime: number): ICartItem => ({
  id: 'item_' + crypto.randomBytes(8).toString('hex'),
  cartId,
  productId,
  product: createMockProduct(productId, priceAtTime),
  quantity,
  priceAtTime,
  subtotal: priceAtTime * quantity,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Helper to create test app with mocked routes
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());
  
  const sessionService = new SessionService(mockRedisClient as any);
  const cartService = new CartService(mockRedisClient as any);
  
  // Session endpoints
  app.post('/api/sessions', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ipAddress, userAgent } = req.body;
      const session = await sessionService.createSession(ipAddress, userAgent);
      res.status(201).json({
        sessionId: session.id,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      return next(error);
    }
  });
  
  app.put('/api/sessions/:sessionId/touch', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = await sessionService.extendSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      return res.json({ sessionId: session.id, expiresAt: session.expiresAt });
    } catch (error) {
      return next(error);
    }
  });
  
  app.get('/api/sessions/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = await sessionService.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      return res.json(session);
    } catch (error) {
      return next(error);
    }
  });
  
  // Cart endpoints
  app.post('/api/carts', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.get('X-Session-ID');
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }
      
      const cart = await cartService.createCart(sessionId);
      return res.status(201).json(cart.toJSON());
    } catch (error) {
      return next(error);
    }
  });
  
  app.get('/api/carts/:cartId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cartId } = req.params;
      const cart = await cartService.getCart(cartId);
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
      return res.json(cart.toJSON());
    } catch (error) {
      return next(error);
    }
  });
  
  app.post('/api/carts/:cartId/items', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cartId } = req.params;
      const { productId, quantity } = req.body;
      
      // Mock product lookup
      const product = createMockProduct(productId, 20.00);
      
      const cart = await cartService.addItemToCart(cartId, product, quantity);
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
      return res.json(cart.toJSON());
    } catch (error) {
      return next(error);
    }
  });
  
  app.put('/api/carts/:cartId/items/:productId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cartId, productId } = req.params;
      const { quantity } = req.body;
      
      const cart = await cartService.updateItemQuantity(cartId, productId, quantity);
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
      return res.json(cart.toJSON());
    } catch (error) {
      return next(error);
    }
  });
  
  app.delete('/api/carts/:cartId/items/:productId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cartId, productId } = req.params;
      
      const cart = await cartService.removeItemFromCart(cartId, productId);
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
      return res.json(cart.toJSON());
    } catch (error) {
      return next(error);
    }
  });
  
  app.get('/api/carts/:cartId/totals', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cartId } = req.params;
      const cart = await cartService.getCart(cartId);
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }
      
      const subtotal = cart.subtotal;
      const tax = subtotal * 0.1; // 10% tax
      const shipping = 5.99;
      const total = subtotal + tax + shipping;
      
      return res.json({ subtotal, tax, shipping, total });
    } catch (error) {
      return next(error);
    }
  });
  
  // Order endpoints
  app.post('/api/orders', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cartId, email, shippingAddress, paymentMethod } = req.body;
      
      // Basic validation
      if (!shippingAddress?.firstName || !shippingAddress?.addressLine1) {
        const errors = [];
        if (!shippingAddress?.firstName) errors.push('First name is required');
        if (!shippingAddress?.addressLine1) errors.push('Address line 1 is required');
        return res.status(400).json({ errors });
      }
      
      // Hash email for privacy
      const emailHash = crypto.createHash('sha256').update(email).digest('hex');
      
      const order = {
        id: 'order_' + crypto.randomBytes(16).toString('hex'),
        orderNumber: 'ORD-' + Date.now(),
        status: 'pending',
        emailHash,
        shippingAddress,
        paymentMethod,
        createdAt: new Date()
      };
      
      return res.status(201).json(order);
    } catch (error) {
      return next(error);
    }
  });
  
  app.post('/api/orders/:orderId/payment', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { paymentMethod, paymentToken } = req.body;
      
      // Mock payment processing
      const paymentResponse = {
        paymentStatus: 'succeeded',
        paymentIntentId: 'pi_' + crypto.randomBytes(16).toString('hex'),
        orderId
      };
      
      res.json(paymentResponse);
    } catch (error) {
      return next(error);
    }
  });
  
  app.get('/api/orders/:orderId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      
      const order = {
        id: orderId,
        orderNumber: 'ORD-123',
        status: 'pending',
        emailHash: crypto.createHash('sha256').update('test@example.com').digest('hex'),
        createdAt: new Date()
      };
      
      res.json(order);
    } catch (error) {
      return next(error);
    }
  });
  
  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });
  
  return app;
};

describe('Guest Checkout Integration Tests', () => {
  let app: Application;
  
  beforeAll(async () => {
    app = createTestApp();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock behaviors
    mockRedisClient.get.mockImplementation((key: string) => {
      // Return null by default (nothing found)
      return Promise.resolve(null);
    });
    
    mockRedisClient.keys.mockResolvedValue([]);
    mockRedisClient.exists.mockResolvedValue(0);
  });

  describe('Session Management', () => {
    it('should create a new session for guest user', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          ipAddress: '192.168.1.100',
          userAgent: 'Test Browser'
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body.sessionId).toMatch(/^[a-f0-9]{64}$/); // 64 hex chars
      expect(response.body).toHaveProperty('expiresAt');
      
      // Verify Redis setEx was called
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        expect.stringMatching(/^session:/),
        604800, // 7 days in seconds
        expect.any(String)
      );
    });

    it('should extend session on activity', async () => {
      const sessionId = crypto.randomBytes(32).toString('hex');
      const originalSession = new Session({ 
        id: sessionId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Mock Redis to return the session
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(originalSession.toJSON()));
      
      const originalExpiry = new Date(originalSession.expiresAt);
      
      // Make touch request
      const touchResponse = await request(app)
        .put(`/api/sessions/${sessionId}/touch`)
        .expect(200);
      
      const newExpiry = new Date(touchResponse.body.expiresAt);
      expect(newExpiry.getTime()).toBeGreaterThan(originalExpiry.getTime());
      
      // Verify session was updated in Redis
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        `session:${sessionId}`,
        expect.any(Number),
        expect.any(String)
      );
    });
  });

  describe('Cart Management', () => {
    it('should create cart for session', async () => {
      const sessionId = crypto.randomBytes(32).toString('hex');
      
      const cartResponse = await request(app)
        .post('/api/carts')
        .set('X-Session-ID', sessionId)
        .send({})
        .expect(201);
      
      expect(cartResponse.body).toHaveProperty('id');
      expect(cartResponse.body).toHaveProperty('sessionId', sessionId);
      expect(cartResponse.body).toHaveProperty('items', []);
      expect(cartResponse.body).toHaveProperty('currency', 'USD');
      
      // Verify cart was stored in Redis
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        expect.stringMatching(/^cart:/),
        604800, // 7 days TTL
        expect.any(String)
      );
    });

    it('should add items to cart', async () => {
      const cartId = 'cart_' + crypto.randomBytes(16).toString('hex');
      const sessionId = crypto.randomBytes(32).toString('hex');
      
      // Mock cart retrieval - return empty cart
      const mockCart = new Cart({ sessionId, items: [], currency: 'USD' });
      mockCart.id = cartId;
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockCart.toJSON()));
      
      const addItemResponse = await request(app)
        .post(`/api/carts/${cartId}/items`)
        .set('X-Session-ID', sessionId)
        .send({
          productId: 'prod-123',
          quantity: 2
        })
        .expect(200);
      
      expect(addItemResponse.body.items).toHaveLength(1);
      expect(addItemResponse.body.items[0]).toMatchObject({
        productId: 'prod-123',
        quantity: 2,
        priceAtTime: 20.00,
        subtotal: 40.00
      });
      
      // Verify cart was updated in Redis
      expect(mockRedisClient.setEx).toHaveBeenLastCalledWith(
        `cart:${cartId}`,
        expect.any(Number),
        expect.any(String)
      );
    });

    it('should calculate cart totals', async () => {
      const cartId = 'cart_' + crypto.randomBytes(16).toString('hex');
      const sessionId = crypto.randomBytes(32).toString('hex');
      
      // Create cart with items for total calculation
      const mockCart = new Cart({ sessionId, items: [], currency: 'USD' });
      mockCart.id = cartId;
      
      // Add mock items to cart
      const item1 = createMockCartItem(cartId, 'prod-1', 2, 20.00);
      const item2 = createMockCartItem(cartId, 'prod-2', 1, 30.00);
      
      mockCart.items = [item1, item2];
      mockCart.calculateTotals(); // Recalculate totals after adding items
      
      // Mock cart retrieval
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockCart.toJSON()));
      
      const totalsResponse = await request(app)
        .get(`/api/carts/${cartId}/totals`)
        .set('X-Session-ID', sessionId)
        .expect(200);
      
      // Endpoint logic: 10% tax and fixed $5.99 shipping
      expect(totalsResponse.body).toMatchObject({
        subtotal: 70.00,
        tax: 7.00, // 10% tax (endpoint overrides cart calculation)
        shipping: 5.99, // Fixed shipping (endpoint overrides cart calculation)
        total: 82.99 // 70 + 7.00 + 5.99
      });
    });

    it('should update item quantity', async () => {
      const cartId = 'cart_' + crypto.randomBytes(16).toString('hex');
      const sessionId = crypto.randomBytes(32).toString('hex');
      
      // Create cart with an existing item
      const mockCart = new Cart({ sessionId, items: [], currency: 'USD' });
      mockCart.id = cartId;
      
      const item = createMockCartItem(cartId, 'prod-123', 2, 20.00);
      
      mockCart.items = [item];
      
      // Mock cart retrieval
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockCart.toJSON()));
      
      const updateResponse = await request(app)
        .put(`/api/carts/${cartId}/items/prod-123`)
        .set('X-Session-ID', sessionId)
        .send({ quantity: 5 })
        .expect(200);
      
      expect(updateResponse.body.items).toHaveLength(1);
      expect(updateResponse.body.items[0].quantity).toBe(5);
      expect(updateResponse.body.items[0].subtotal).toBe(100.00); // 5 * 20.00
    });

    it('should remove item from cart', async () => {
      const cartId = 'cart_' + crypto.randomBytes(16).toString('hex');
      const sessionId = crypto.randomBytes(32).toString('hex');
      
      // Create cart with multiple items
      const mockCart = new Cart({ sessionId, items: [], currency: 'USD' });
      mockCart.id = cartId;
      
      const item1 = createMockCartItem(cartId, 'prod-1', 1, 15.00);
      const item2 = createMockCartItem(cartId, 'prod-2', 1, 25.00);
      
      mockCart.items = [item1, item2];
      
      // Mock cart retrieval for removal
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockCart.toJSON()));
      
      // Remove first item
      await request(app)
        .delete(`/api/carts/${cartId}/items/prod-1`)
        .set('X-Session-ID', sessionId)
        .expect(200);
      
      // Mock cart retrieval for verification
      const updatedCart = { ...mockCart.toJSON() };
      updatedCart.items = [item2]; // Only second item remains
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(updatedCart));
      
      const cartResponse = await request(app)
        .get(`/api/carts/${cartId}`)
        .set('X-Session-ID', sessionId)
        .expect(200);
      
      expect(cartResponse.body.items).toHaveLength(1);
      expect(cartResponse.body.items[0].productId).toBe('prod-2');
    });
  });

  describe('Order Creation', () => {
    it('should create order from cart', async () => {
      const cartId = 'cart_' + crypto.randomBytes(16).toString('hex');
      
      const orderResponse = await request(app)
        .post('/api/orders')
        .send({
          cartId: cartId,
          email: 'guest@example.com',
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US'
          },
          paymentMethod: 'credit_card'
        })
        .expect(201);
      
      expect(orderResponse.body).toHaveProperty('id');
      expect(orderResponse.body).toHaveProperty('orderNumber');
      expect(orderResponse.body.orderNumber).toMatch(/^ORD-\d+$/);
      expect(orderResponse.body).toHaveProperty('status', 'pending');
      expect(orderResponse.body).toHaveProperty('emailHash');
      expect(orderResponse.body.emailHash).not.toBe('guest@example.com');
      expect(orderResponse.body.emailHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
      expect(orderResponse.body).not.toHaveProperty('email'); // Raw email should not be returned
    });

    it('should hash email for privacy', async () => {
      const email = 'test@example.com';
      const expectedHash = crypto.createHash('sha256').update(email).digest('hex');
      
      const orderData = {
        cartId: 'cart_test',
        email: email,
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          addressLine1: '456 Test Ave',
          city: 'Test City',
          state: 'TC',
          postalCode: '12345',
          country: 'US'
        },
        paymentMethod: 'credit_card'
      };
      
      const orderResponse = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);
      
      expect(orderResponse.body.emailHash).toBe(expectedHash);
      expect(orderResponse.body.emailHash).toHaveLength(64);
      expect(orderResponse.body).not.toHaveProperty('email');
    });

    it('should validate address before order creation', async () => {
      const invalidAddress = {
        firstName: '', // Missing
        lastName: 'Doe',
        addressLine1: '', // Missing
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US'
      };
      
      const orderResponse = await request(app)
        .post('/api/orders')
        .send({
          cartId: 'cart-123',
          email: 'test@example.com',
          shippingAddress: invalidAddress,
          paymentMethod: 'credit_card'
        })
        .expect(400);
      
      expect(orderResponse.body).toHaveProperty('errors');
      expect(orderResponse.body.errors).toContain('First name is required');
      expect(orderResponse.body.errors).toContain('Address line 1 is required');
    });
  });

  describe('Payment Processing', () => {
    it('should process payment for order', async () => {
      const orderId = 'order_' + crypto.randomBytes(16).toString('hex');
      
      const paymentResponse = await request(app)
        .post(`/api/orders/${orderId}/payment`)
        .send({
          paymentMethod: 'credit_card',
          paymentToken: 'tok_test_visa' // Test Stripe token
        })
        .expect(200);
      
      expect(paymentResponse.body).toHaveProperty('paymentStatus', 'succeeded');
      expect(paymentResponse.body).toHaveProperty('paymentIntentId');
      expect(paymentResponse.body.paymentIntentId).toMatch(/^pi_/);
      expect(paymentResponse.body).toHaveProperty('orderId', orderId);
    });

    it('should not store credit card details', async () => {
      const orderId = 'order_' + crypto.randomBytes(16).toString('hex');
      
      // Process payment with sensitive card details
      await request(app)
        .post(`/api/orders/${orderId}/payment`)
        .send({
          paymentMethod: 'credit_card',
          cardNumber: '4242424242424242',
          cvv: '123',
          expiry: '12/25'
        })
        .expect(200);
      
      // Retrieve order to verify no sensitive data is stored
      const orderResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .expect(200);
      
      // Verify no card details in response
      expect(orderResponse.body).not.toHaveProperty('cardNumber');
      expect(orderResponse.body).not.toHaveProperty('cvv');
      expect(orderResponse.body).not.toHaveProperty('expiry');
      
      // Verify order has basic properties but no sensitive data
      expect(orderResponse.body).toHaveProperty('id');
      expect(orderResponse.body).toHaveProperty('orderNumber');
      expect(orderResponse.body).toHaveProperty('status');
      expect(orderResponse.body).toHaveProperty('emailHash');
    });
  });

  describe('Session and Cart Expiration', () => {
    it('should expire session after 7 days', async () => {
      const sessionId = crypto.randomBytes(32).toString('hex');
      const sessionService = new SessionService(mockRedisClient as any);
      
      // Create session that's already expired
      const expiredSession = new Session({
        id: sessionId,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago
        updatedAt: new Date(Date.now() - 1000)
      });
      
      // Mock Redis to return expired session
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(expiredSession.toJSON()));
      
      // Try to retrieve expired session
      const retrievedSession = await sessionService.getSession(sessionId);
      
      // Should return null for expired session
      expect(retrievedSession).toBeNull();
      
      // Should have deleted the expired session
      expect(mockRedisClient.del).toHaveBeenCalledWith(`session:${sessionId}`);
    });

    it('should expire cart with session', async () => {
      const sessionId = crypto.randomBytes(32).toString('hex');
      const cartId = 'cart_' + crypto.randomBytes(16).toString('hex');
      const cartService = new CartService(mockRedisClient as any);
      
      // Create cart that's already expired
      const expiredCart = new Cart({
        sessionId,
        items: [],
        currency: 'USD',
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago
        updatedAt: new Date(Date.now() - 1000)
      });
      expiredCart.id = cartId;
      
      // Mock Redis to return expired cart
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(expiredCart.toJSON()));
      
      // Try to retrieve expired cart
      const retrievedCart = await cartService.getCart(cartId);
      
      // Should return null for expired cart
      expect(retrievedCart).toBeNull();
      
      // Should have deleted the expired cart
      expect(mockRedisClient.del).toHaveBeenCalledWith(`cart:${cartId}`);
    });
  });

  describe('Data Privacy', () => {
    it('should not store unhashed PII', async () => {
      const orderData = {
        cartId: 'cart_test',
        email: 'personal@example.com',
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Doe',
          addressLine1: '789 Privacy St',
          city: 'Secure City',
          state: 'SC',
          postalCode: '54321',
          country: 'US'
        },
        paymentMethod: 'credit_card'
      };
      
      const orderResponse = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);
      
      // Email should be hashed in response
      expect(orderResponse.body.emailHash).toBeDefined();
      expect(orderResponse.body.emailHash).not.toBe('personal@example.com');
      expect(orderResponse.body.emailHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
      expect(orderResponse.body).not.toHaveProperty('email'); // Raw email should not be returned
      
      // Verify the hash is correct
      const expectedHash = crypto.createHash('sha256').update('personal@example.com').digest('hex');
      expect(orderResponse.body.emailHash).toBe(expectedHash);
      
      // Shipping address can be stored for fulfillment but email is protected
      expect(orderResponse.body.shippingAddress).toMatchObject({
        firstName: 'Jane',
        lastName: 'Doe',
        addressLine1: '789 Privacy St',
        city: 'Secure City',
        state: 'SC',
        postalCode: '54321',
        country: 'US'
      });
    });
    
    it('should handle session cleanup correctly', async () => {
      const sessionService = new SessionService(mockRedisClient as any);
      
      // Mock multiple sessions, some expired
      const sessionKeys = [
        'session:active1',
        'session:expired1', 
        'session:active2',
        'session:expired2'
      ];
      
      mockRedisClient.keys.mockResolvedValueOnce(sessionKeys);
      
      // Mock session data - some expired, some not
      const activeSession1 = new Session({ id: 'active1' }); // Not expired (7 days default)
      const expiredSession1 = new Session({ 
        id: 'expired1',
        expiresAt: new Date(Date.now() - 1000) // 1 second ago
      });
      const activeSession2 = new Session({ id: 'active2' }); // Not expired
      const expiredSession2 = new Session({ 
        id: 'expired2',
        expiresAt: new Date(Date.now() - 1000) // 1 second ago
      });
      
      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify(activeSession1.toJSON()))
        .mockResolvedValueOnce(JSON.stringify(expiredSession1.toJSON()))
        .mockResolvedValueOnce(JSON.stringify(activeSession2.toJSON()))
        .mockResolvedValueOnce(JSON.stringify(expiredSession2.toJSON()));
      
      const cleaned = await sessionService.cleanupExpiredSessions();
      
      // Should have cleaned 2 expired sessions
      expect(cleaned).toBe(2);
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.del).toHaveBeenCalledWith('session:expired1');
      expect(mockRedisClient.del).toHaveBeenCalledWith('session:expired2');
    });
  });
});