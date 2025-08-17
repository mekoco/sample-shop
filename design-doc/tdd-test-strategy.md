# Test-Driven Development Strategy for PetSupplies Shop

## 1. TDD Philosophy & Principles

### Core TDD Cycle
```
1. RED: Write a failing test
2. GREEN: Write minimal code to pass the test
3. REFACTOR: Improve code while keeping tests green
```

### Testing Pyramid
```
         /\           E2E Tests (10%)
        /  \          - Critical user journeys
       /    \         - Full system integration
      /------\        
     /        \       Integration Tests (30%)
    /          \      - API endpoints
   /            \     - Service interactions
  /--------------\    
 /                \   Unit Tests (60%)
/                  \  - Business logic
                      - Utility functions
                      - Data validators
```

## 2. Test Structure & Organization

### Directory Structure
```
sample-shop/
├── src/
│   ├── services/
│   │   ├── product/
│   │   │   ├── product.service.ts
│   │   │   ├── product.service.test.ts
│   │   │   └── product.integration.test.ts
│   │   ├── order/
│   │   │   ├── order.service.ts
│   │   │   ├── order.service.test.ts
│   │   │   └── order.integration.test.ts
│   │   └── user/
│   │       ├── user.service.ts
│   │       ├── user.service.test.ts
│   │       └── user.integration.test.ts
│   ├── api/
│   │   ├── routes/
│   │   │   ├── product.routes.ts
│   │   │   └── product.routes.test.ts
│   │   └── middleware/
│   │       ├── auth.middleware.ts
│   │       └── auth.middleware.test.ts
│   └── utils/
│       ├── validators/
│       │   ├── product.validator.ts
│       │   └── product.validator.test.ts
│       └── helpers/
│           ├── price.helper.ts
│           └── price.helper.test.ts
├── tests/
│   ├── unit/           # Unit test helpers
│   ├── integration/     # Integration test setup
│   ├── e2e/            # End-to-end tests
│   ├── fixtures/       # Test data fixtures
│   ├── mocks/          # Mock implementations
│   └── utils/          # Test utilities
└── package.json
```

## 3. Unit Testing Strategy

### 3.1 Product Service Tests

```typescript
// tests/unit/services/product.service.test.ts

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ProductService } from '../../../src/services/product/product.service';
import { ProductRepository } from '../../../src/repositories/product.repository';
import { CacheService } from '../../../src/services/cache.service';
import { productFixtures } from '../../fixtures/products';

describe('ProductService', () => {
  let productService: ProductService;
  let mockRepository: jest.Mocked<ProductRepository>;
  let mockCache: jest.Mocked<CacheService>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findBySku: jest.fn(),
    };
    
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };
    
    productService = new ProductService(mockRepository, mockCache);
  });

  describe('createProduct', () => {
    // Test 1: RED -> GREEN -> REFACTOR
    it('should create a product with valid data', async () => {
      // Arrange
      const productData = {
        name: 'Premium Dog Food',
        sku: 'PDF-001',
        price: 29.99,
        category: 'dog-food',
        description: 'High quality dog food',
        stock: 100
      };
      
      const expectedProduct = {
        id: 'uuid-123',
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockRepository.findBySku.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(expectedProduct);
      
      // Act
      const result = await productService.createProduct(productData);
      
      // Assert
      expect(mockRepository.findBySku).toHaveBeenCalledWith('PDF-001');
      expect(mockRepository.create).toHaveBeenCalledWith(productData);
      expect(result).toEqual(expectedProduct);
      expect(mockCache.delete).toHaveBeenCalledWith('products:all');
    });

    // Test 2: Error handling
    it('should throw error when SKU already exists', async () => {
      // Arrange
      const productData = {
        name: 'Duplicate Product',
        sku: 'EXISTING-SKU',
        price: 19.99
      };
      
      mockRepository.findBySku.mockResolvedValue({ id: 'existing-id' });
      
      // Act & Assert
      await expect(productService.createProduct(productData))
        .rejects.toThrow('Product with SKU EXISTING-SKU already exists');
      
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    // Test 3: Validation
    it('should validate price is positive', async () => {
      // Arrange
      const productData = {
        name: 'Invalid Product',
        sku: 'INV-001',
        price: -10
      };
      
      // Act & Assert
      await expect(productService.createProduct(productData))
        .rejects.toThrow('Price must be a positive number');
    });

    // Test 4: Business rule
    it('should calculate and set profit margin', async () => {
      // Arrange
      const productData = {
        name: 'Product with Cost',
        sku: 'PWC-001',
        price: 50,
        cost: 30
      };
      
      mockRepository.findBySku.mockResolvedValue(null);
      mockRepository.create.mockImplementation((data) => 
        Promise.resolve({ id: 'uuid', ...data })
      );
      
      // Act
      const result = await productService.createProduct(productData);
      
      // Assert
      expect(result.profitMargin).toBe(40); // (50-30)/50 * 100 = 40%
    });

    // Test 5: Image processing
    it('should process and validate product images', async () => {
      // Arrange
      const productData = {
        name: 'Product with Images',
        sku: 'PWI-001',
        price: 25,
        images: [
          { url: 'http://example.com/image1.jpg', alt: 'Front view' },
          { url: 'http://example.com/image2.jpg', alt: 'Side view' }
        ]
      };
      
      mockRepository.findBySku.mockResolvedValue(null);
      mockRepository.create.mockImplementation((data) => 
        Promise.resolve({ id: 'uuid', ...data })
      );
      
      // Act
      const result = await productService.createProduct(productData);
      
      // Assert
      expect(result.images).toHaveLength(2);
      expect(result.images[0].isPrimary).toBe(true);
      expect(result.images[1].isPrimary).toBe(false);
    });
  });

  describe('updateProduct', () => {
    it('should update product and invalidate cache', async () => {
      // Arrange
      const productId = 'uuid-123';
      const updates = { price: 35.99, stock: 150 };
      const existingProduct = productFixtures.dogFood;
      const updatedProduct = { ...existingProduct, ...updates };
      
      mockRepository.findById.mockResolvedValue(existingProduct);
      mockRepository.update.mockResolvedValue(updatedProduct);
      
      // Act
      const result = await productService.updateProduct(productId, updates);
      
      // Assert
      expect(result).toEqual(updatedProduct);
      expect(mockCache.delete).toHaveBeenCalledWith(`product:${productId}`);
      expect(mockCache.delete).toHaveBeenCalledWith('products:all');
    });

    it('should throw error if product not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(productService.updateProduct('invalid-id', {}))
        .rejects.toThrow('Product not found');
    });

    it('should prevent updating SKU to existing one', async () => {
      // Arrange
      const productId = 'uuid-123';
      const updates = { sku: 'EXISTING-SKU' };
      
      mockRepository.findById.mockResolvedValue(productFixtures.dogFood);
      mockRepository.findBySku.mockResolvedValue({ id: 'other-id' });
      
      // Act & Assert
      await expect(productService.updateProduct(productId, updates))
        .rejects.toThrow('SKU already in use');
    });
  });

  describe('searchProducts', () => {
    it('should search products with filters', async () => {
      // Arrange
      const searchCriteria = {
        query: 'dog food',
        category: 'dog-food',
        minPrice: 20,
        maxPrice: 50,
        inStock: true
      };
      
      const searchResults = [
        productFixtures.dogFood,
        productFixtures.premiumDogFood
      ];
      
      mockRepository.search = jest.fn().mockResolvedValue({
        products: searchResults,
        total: 2,
        page: 1,
        pageSize: 10
      });
      
      // Act
      const result = await productService.searchProducts(searchCriteria);
      
      // Assert
      expect(mockRepository.search).toHaveBeenCalledWith(searchCriteria);
      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should use cache for repeated searches', async () => {
      // Arrange
      const searchCriteria = { query: 'cat toys' };
      const cacheKey = 'search:cat-toys:all:0:0:true';
      const cachedResults = { products: [], total: 0 };
      
      mockCache.get.mockResolvedValue(JSON.stringify(cachedResults));
      
      // Act
      const result = await productService.searchProducts(searchCriteria);
      
      // Assert
      expect(mockCache.get).toHaveBeenCalledWith(cacheKey);
      expect(mockRepository.search).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResults);
    });
  });

  describe('getProductWithInventory', () => {
    it('should fetch product with real-time inventory', async () => {
      // Arrange
      const productId = 'uuid-123';
      const product = productFixtures.dogFood;
      const inventory = { available: 45, reserved: 5, total: 50 };
      
      mockRepository.findById.mockResolvedValue(product);
      mockInventoryService = { getInventory: jest.fn().mockResolvedValue(inventory) };
      productService.setInventoryService(mockInventoryService);
      
      // Act
      const result = await productService.getProductWithInventory(productId);
      
      // Assert
      expect(result.product).toEqual(product);
      expect(result.inventory).toEqual(inventory);
      expect(result.isAvailable).toBe(true);
    });
  });
});
```

### 3.2 Order Service Tests

```typescript
// tests/unit/services/order.service.test.ts

describe('OrderService', () => {
  let orderService: OrderService;
  let mockOrderRepo: jest.Mocked<OrderRepository>;
  let mockInventoryService: jest.Mocked<InventoryService>;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    // Setup mocks
    orderService = new OrderService(
      mockOrderRepo,
      mockInventoryService,
      mockPaymentService,
      mockEmailService
    );
  });

  describe('createOrder', () => {
    it('should create order with proper workflow', async () => {
      // Test the complete order creation workflow
      // 1. Validate cart
      // 2. Reserve inventory
      // 3. Process payment
      // 4. Create order record
      // 5. Send confirmation email
      
      const orderData = {
        userId: 'user-123',
        items: [
          { productId: 'prod-1', quantity: 2, price: 25 },
          { productId: 'prod-2', quantity: 1, price: 15 }
        ],
        shippingAddress: addressFixture,
        paymentMethod: 'card'
      };
      
      // Mock inventory reservation
      mockInventoryService.reserveItems.mockResolvedValue({
        reservationId: 'res-123',
        success: true
      });
      
      // Mock payment processing
      mockPaymentService.processPayment.mockResolvedValue({
        transactionId: 'trans-123',
        status: 'success'
      });
      
      // Mock order creation
      const expectedOrder = {
        id: 'order-123',
        orderNumber: 'ORD-2024-001',
        ...orderData,
        status: 'confirmed',
        total: 65
      };
      mockOrderRepo.create.mockResolvedValue(expectedOrder);
      
      // Act
      const result = await orderService.createOrder(orderData);
      
      // Assert
      expect(mockInventoryService.reserveItems).toHaveBeenCalledWith([
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 }
      ]);
      
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith({
        amount: 65,
        method: 'card',
        userId: 'user-123'
      });
      
      expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith(
        expectedOrder
      );
      
      expect(result).toEqual(expectedOrder);
    });

    it('should rollback on payment failure', async () => {
      // Test transaction rollback
      const orderData = orderFixtures.validOrder;
      
      mockInventoryService.reserveItems.mockResolvedValue({
        reservationId: 'res-123',
        success: true
      });
      
      mockPaymentService.processPayment.mockRejectedValue(
        new Error('Payment declined')
      );
      
      // Act & Assert
      await expect(orderService.createOrder(orderData))
        .rejects.toThrow('Payment declined');
      
      // Verify rollback
      expect(mockInventoryService.releaseReservation)
        .toHaveBeenCalledWith('res-123');
      expect(mockOrderRepo.create).not.toHaveBeenCalled();
    });

    it('should handle insufficient inventory', async () => {
      const orderData = orderFixtures.validOrder;
      
      mockInventoryService.reserveItems.mockResolvedValue({
        success: false,
        failedItems: [
          { productId: 'prod-1', available: 1, requested: 5 }
        ]
      });
      
      await expect(orderService.createOrder(orderData))
        .rejects.toThrow('Insufficient inventory for product prod-1');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order and refund payment', async () => {
      const orderId = 'order-123';
      const order = {
        ...orderFixtures.confirmedOrder,
        paymentInfo: { transactionId: 'trans-123' }
      };
      
      mockOrderRepo.findById.mockResolvedValue(order);
      mockPaymentService.refund.mockResolvedValue({
        refundId: 'refund-123',
        status: 'completed'
      });
      
      const result = await orderService.cancelOrder(orderId);
      
      expect(mockPaymentService.refund).toHaveBeenCalledWith('trans-123');
      expect(mockInventoryService.releaseItems).toHaveBeenCalledWith(
        order.items
      );
      expect(result.status).toBe('cancelled');
    });

    it('should prevent cancellation of shipped orders', async () => {
      const order = { ...orderFixtures.shippedOrder };
      mockOrderRepo.findById.mockResolvedValue(order);
      
      await expect(orderService.cancelOrder(order.id))
        .rejects.toThrow('Cannot cancel shipped order');
    });
  });
});
```

### 3.3 Shopping Cart Tests

```typescript
// tests/unit/services/cart.service.test.ts

describe('CartService', () => {
  let cartService: CartService;
  let mockRedis: jest.Mocked<RedisClient>;
  let mockProductService: jest.Mocked<ProductService>;
  let mockPricingService: jest.Mocked<PricingService>;

  describe('addToCart', () => {
    it('should add item to cart', async () => {
      const sessionId = 'session-123';
      const productId = 'prod-1';
      const quantity = 2;
      
      const product = {
        id: productId,
        name: 'Dog Toy',
        price: 15.99,
        stock: 10
      };
      
      mockProductService.getProduct.mockResolvedValue(product);
      mockRedis.get.mockResolvedValue(null); // Empty cart
      
      const result = await cartService.addToCart(sessionId, productId, quantity);
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        productId,
        quantity,
        price: 15.99,
        total: 31.98
      });
      
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `cart:${sessionId}`,
        3600,
        JSON.stringify(result)
      );
    });

    it('should merge quantities for existing items', async () => {
      const sessionId = 'session-123';
      const existingCart = {
        items: [
          { productId: 'prod-1', quantity: 2, price: 15.99 }
        ]
      };
      
      mockRedis.get.mockResolvedValue(JSON.stringify(existingCart));
      
      const result = await cartService.addToCart(sessionId, 'prod-1', 3);
      
      expect(result.items[0].quantity).toBe(5);
    });

    it('should validate stock availability', async () => {
      const product = { id: 'prod-1', stock: 2 };
      mockProductService.getProduct.mockResolvedValue(product);
      
      await expect(cartService.addToCart('session', 'prod-1', 5))
        .rejects.toThrow('Insufficient stock. Only 2 items available');
    });
  });

  describe('calculateTotals', () => {
    it('should calculate cart totals with tax and shipping', async () => {
      const cart = {
        items: [
          { productId: 'prod-1', quantity: 2, price: 25 },
          { productId: 'prod-2', quantity: 1, price: 15 }
        ],
        shippingAddress: { zipCode: '12345' }
      };
      
      mockPricingService.calculateTax.mockResolvedValue(6.5);
      mockPricingService.calculateShipping.mockResolvedValue(5.99);
      
      const result = await cartService.calculateTotals(cart);
      
      expect(result).toEqual({
        subtotal: 65,
        tax: 6.5,
        shipping: 5.99,
        total: 77.49
      });
    });

    it('should apply discount codes', async () => {
      const cart = {
        items: [{ productId: 'prod-1', quantity: 1, price: 100 }],
        couponCode: 'SAVE20'
      };
      
      mockPricingService.validateCoupon.mockResolvedValue({
        valid: true,
        discountType: 'percentage',
        discountValue: 20
      });
      
      const result = await cartService.calculateTotals(cart);
      
      expect(result.discount).toBe(20);
      expect(result.subtotal).toBe(100);
      expect(result.total).toBe(80);
    });
  });
});
```

## 4. Integration Testing Strategy

### 4.1 API Endpoint Tests

```typescript
// tests/integration/api/product.routes.test.ts

import request from 'supertest';
import { app } from '../../../src/app';
import { setupTestDatabase, teardownTestDatabase } from '../../utils/database';
import { createAuthToken } from '../../utils/auth';

describe('Product API Integration', () => {
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    authToken = await createAuthToken({ role: 'customer' });
    adminToken = await createAuthToken({ role: 'admin' });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=10')
        .expect(200);
      
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.products).toBeInstanceOf(Array);
      expect(response.body.products.length).toBeLessThanOrEqual(10);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        pages: expect.any(Number)
      });
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products?category=dog-food')
        .expect(200);
      
      response.body.products.forEach(product => {
        expect(product.category).toBe('dog-food');
      });
    });

    it('should search products by query', async () => {
      const response = await request(app)
        .get('/api/products/search?q=premium')
        .expect(200);
      
      expect(response.body.products.length).toBeGreaterThan(0);
      response.body.products.forEach(product => {
        const matchesQuery = 
          product.name.toLowerCase().includes('premium') ||
          product.description.toLowerCase().includes('premium');
        expect(matchesQuery).toBe(true);
      });
    });
  });

  describe('POST /api/products', () => {
    it('should create product as admin', async () => {
      const productData = {
        name: 'New Cat Toy',
        sku: 'NCT-001',
        price: 9.99,
        category: 'cat-toys',
        stock: 50
      };
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        ...productData,
        id: expect.any(String),
        createdAt: expect.any(String)
      });
    });

    it('should reject product creation for non-admin', async () => {
      const productData = {
        name: 'Unauthorized Product',
        sku: 'UP-001',
        price: 19.99
      };
      
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(403);
    });

    it('should validate required fields', async () => {
      const invalidProduct = {
        name: 'Invalid Product'
        // Missing required fields
      };
      
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct)
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toContain('SKU is required');
      expect(response.body.errors).toContain('Price is required');
    });
  });

  describe('PUT /api/products/:id', () => {
    let productId: string;

    beforeEach(async () => {
      const product = await createTestProduct();
      productId = product.id;
    });

    it('should update product as admin', async () => {
      const updates = {
        price: 29.99,
        stock: 100
      };
      
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);
      
      expect(response.body.price).toBe(29.99);
      expect(response.body.stock).toBe(100);
    });

    it('should handle concurrent updates correctly', async () => {
      // Test optimistic locking
      const updates1 = { price: 25.99 };
      const updates2 = { price: 27.99 };
      
      const [response1, response2] = await Promise.all([
        request(app)
          .put(`/api/products/${productId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updates1),
        request(app)
          .put(`/api/products/${productId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updates2)
      ]);
      
      // One should succeed, one should fail with conflict
      const statuses = [response1.status, response2.status].sort();
      expect(statuses).toEqual([200, 409]);
    });
  });
});
```

### 4.2 Service Integration Tests

```typescript
// tests/integration/services/order.integration.test.ts

describe('Order Service Integration', () => {
  let orderService: OrderService;
  let testUser: User;
  let testProducts: Product[];

  beforeAll(async () => {
    await setupTestDatabase();
    await setupTestServices();
    
    testUser = await createTestUser();
    testProducts = await createTestProducts();
    orderService = container.get(OrderService);
  });

  describe('Complete Order Flow', () => {
    it('should process order from cart to delivery', async () => {
      // Step 1: Add items to cart
      const cart = await cartService.addItems(testUser.id, [
        { productId: testProducts[0].id, quantity: 2 },
        { productId: testProducts[1].id, quantity: 1 }
      ]);
      
      // Step 2: Create order
      const order = await orderService.createOrder({
        userId: testUser.id,
        cartId: cart.id,
        shippingAddress: testAddress,
        paymentMethod: { type: 'card', token: 'test-token' }
      });
      
      expect(order.status).toBe('pending');
      expect(order.items).toHaveLength(2);
      
      // Step 3: Process payment
      await orderService.processPayment(order.id);
      const processedOrder = await orderService.getOrder(order.id);
      expect(processedOrder.status).toBe('confirmed');
      
      // Step 4: Fulfill order
      await orderService.fulfillOrder(order.id);
      const fulfilledOrder = await orderService.getOrder(order.id);
      expect(fulfilledOrder.status).toBe('processing');
      
      // Step 5: Ship order
      const trackingInfo = {
        carrier: 'FedEx',
        trackingNumber: 'FX123456789'
      };
      await orderService.shipOrder(order.id, trackingInfo);
      const shippedOrder = await orderService.getOrder(order.id);
      expect(shippedOrder.status).toBe('shipped');
      expect(shippedOrder.tracking).toEqual(trackingInfo);
      
      // Verify inventory was updated
      const product1Stock = await inventoryService.getStock(testProducts[0].id);
      expect(product1Stock.available).toBe(
        testProducts[0].stock - 2
      );
      
      // Verify email was sent
      const emails = await emailService.getSentEmails(testUser.email);
      expect(emails).toContainEqual(
        expect.objectContaining({
          subject: expect.stringContaining('Order Confirmation'),
          to: testUser.email
        })
      );
    });

    it('should handle order cancellation', async () => {
      const order = await createTestOrder(testUser.id);
      
      // Cancel order
      await orderService.cancelOrder(order.id, 'Customer request');
      
      const cancelledOrder = await orderService.getOrder(order.id);
      expect(cancelledOrder.status).toBe('cancelled');
      expect(cancelledOrder.cancellationReason).toBe('Customer request');
      
      // Verify inventory was restored
      for (const item of order.items) {
        const stock = await inventoryService.getStock(item.productId);
        expect(stock.available).toBe(stock.total);
      }
      
      // Verify refund was processed
      const refund = await paymentService.getRefund(order.paymentInfo.transactionId);
      expect(refund.status).toBe('completed');
    });
  });
});
```

## 5. End-to-End Testing Strategy

### 5.1 Critical User Journeys

```typescript
// tests/e2e/shopping-flow.e2e.test.ts

import { test, expect } from '@playwright/test';
import { setupE2EEnvironment, teardownE2EEnvironment } from '../utils/e2e-setup';

test.describe('Complete Shopping Flow', () => {
  test.beforeAll(async () => {
    await setupE2EEnvironment();
  });

  test.afterAll(async () => {
    await teardownE2EEnvironment();
  });

  test('should complete purchase from browse to checkout', async ({ page }) => {
    // Step 1: Navigate to homepage
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle('PetSupplies Shop - Your Pet\'s Favorite Store');
    
    // Step 2: Browse by category
    await page.click('[data-testid="nav-category-dog"]');
    await page.waitForURL('**/category/dog');
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    
    // Step 3: Search for specific product
    await page.fill('[data-testid="search-input"]', 'premium dog food');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/search?q=premium+dog+food');
    
    // Step 4: View product details
    await page.click('[data-testid="product-card"]:first-child');
    await page.waitForSelector('[data-testid="product-details"]');
    
    // Verify product information
    await expect(page.locator('[data-testid="product-name"]')).toContainText('Premium');
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-rating"]')).toBeVisible();
    
    // Step 5: Select options and add to cart
    await page.selectOption('[data-testid="size-select"]', 'large');
    await page.fill('[data-testid="quantity-input"]', '2');
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Verify cart notification
    await expect(page.locator('[data-testid="cart-notification"]')).toContainText('Added to cart');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
    
    // Step 6: Continue shopping
    await page.click('[data-testid="continue-shopping"]');
    await page.click('[data-testid="nav-category-cat"]');
    await page.click('[data-testid="product-card"]:nth-child(2)');
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Step 7: View cart
    await page.click('[data-testid="cart-icon"]');
    await page.waitForURL('**/cart');
    
    // Verify cart contents
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible();
    
    // Step 8: Apply discount code
    await page.fill('[data-testid="promo-code-input"]', 'WELCOME10');
    await page.click('[data-testid="apply-promo-button"]');
    await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible();
    
    // Step 9: Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    
    // Step 10: Guest checkout or login
    await page.click('[data-testid="guest-checkout"]');
    
    // Step 11: Fill shipping information
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="first-name"]', 'John');
    await page.fill('[data-testid="last-name"]', 'Doe');
    await page.fill('[data-testid="address-line1"]', '123 Pet Street');
    await page.fill('[data-testid="city"]', 'Pet City');
    await page.selectOption('[data-testid="state"]', 'CA');
    await page.fill('[data-testid="zip-code"]', '90210');
    await page.fill('[data-testid="phone"]', '555-1234');
    
    // Step 12: Select shipping method
    await page.click('[data-testid="shipping-standard"]');
    
    // Step 13: Fill payment information
    await page.click('[data-testid="payment-credit-card"]');
    
    // Use Stripe test card
    const stripeFrame = page.frameLocator('[data-testid="stripe-frame"]');
    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/25');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');
    
    // Step 14: Review order
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-amount"]')).toContainText('$');
    
    // Step 15: Place order
    await page.click('[data-testid="place-order-button"]');
    
    // Step 16: Verify order confirmation
    await page.waitForURL('**/order-confirmation/**');
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmation-message"]')).toContainText('Thank you for your order');
    
    // Capture order number for verification
    const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
    expect(orderNumber).toMatch(/^ORD-\d{4}-\d{6}$/);
    
    // Step 17: Verify confirmation email (mock check)
    const emailSent = await page.evaluate(() => {
      return window.__E2E_MOCKS__?.emailSent;
    });
    expect(emailSent).toBe(true);
  });

  test('should handle out of stock scenario', async ({ page }) => {
    await page.goto('http://localhost:3000/product/out-of-stock-item');
    
    await expect(page.locator('[data-testid="out-of-stock-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-to-cart-button"]')).toBeDisabled();
    
    // Try to notify when back in stock
    await page.click('[data-testid="notify-me-button"]');
    await page.fill('[data-testid="notify-email"]', 'customer@example.com');
    await page.click('[data-testid="submit-notify"]');
    
    await expect(page.locator('[data-testid="notify-success"]')).toContainText('We\'ll notify you');
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    // Setup cart and go to checkout
    await setupCartWithItems(page);
    await page.goto('http://localhost:3000/checkout');
    
    // Fill checkout form
    await fillCheckoutForm(page);
    
    // Use card that triggers decline
    const stripeFrame = page.frameLocator('[data-testid="stripe-frame"]');
    await stripeFrame.locator('[placeholder="Card number"]').fill('4000000000000002');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/25');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');
    
    await page.click('[data-testid="place-order-button"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="payment-error"]')).toContainText('Payment was declined');
    await expect(page.locator('[data-testid="try-again-button"]')).toBeVisible();
  });
});
```

### 5.2 Mobile Responsive Tests

```typescript
// tests/e2e/mobile-shopping.e2e.test.ts

import { devices } from '@playwright/test';

test.describe('Mobile Shopping Experience', () => {
  test.use({ ...devices['iPhone 12'] });

  test('should navigate and purchase on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Test mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Navigate categories
    await page.click('[data-testid="mobile-category-dog"]');
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    
    // Test mobile filters
    await page.click('[data-testid="mobile-filter-button"]');
    await page.click('[data-testid="filter-price-under-20"]');
    await page.click('[data-testid="apply-filters"]');
    
    // Add to cart
    await page.click('[data-testid="product-card"]:first-child');
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Mobile cart drawer
    await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();
    
    // Continue with checkout...
  });
});
```

## 6. Test Data Management

### 6.1 Fixtures

```typescript
// tests/fixtures/products.ts

export const productFixtures = {
  dogFood: {
    id: 'prod-dog-food-1',
    name: 'Premium Adult Dog Food',
    sku: 'PDF-001',
    price: 45.99,
    category: 'dog-food',
    description: 'Complete nutrition for adult dogs',
    stock: 100,
    images: [
      { url: '/images/dog-food-1.jpg', alt: 'Premium Dog Food' }
    ],
    petType: 'dog',
    ageGroup: 'adult',
    weight: 10,
    brand: 'NutriPet'
  },
  
  catToy: {
    id: 'prod-cat-toy-1',
    name: 'Interactive Feather Wand',
    sku: 'IFW-001',
    price: 12.99,
    category: 'cat-toys',
    description: 'Engaging toy for cats',
    stock: 50,
    petType: 'cat'
  },
  
  // More fixtures...
};

// tests/fixtures/users.ts
export const userFixtures = {
  customer: {
    id: 'user-customer-1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer',
    addresses: [
      {
        line1: '123 Main St',
        city: 'Pet City',
        state: 'CA',
        zipCode: '90210',
        country: 'US'
      }
    ]
  },
  
  admin: {
    id: 'user-admin-1',
    email: 'admin@petshop.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  }
};
```

### 6.2 Test Database Seeding

```typescript
// tests/utils/seed.ts

export async function seedTestDatabase() {
  await db.transaction(async (trx) => {
    // Clear existing data
    await trx('order_items').delete();
    await trx('orders').delete();
    await trx('product_variants').delete();
    await trx('products').delete();
    await trx('users').delete();
    await trx('categories').delete();
    
    // Seed categories
    await trx('categories').insert([
      { id: 'cat-1', name: 'Dog Food', slug: 'dog-food' },
      { id: 'cat-2', name: 'Cat Food', slug: 'cat-food' },
      { id: 'cat-3', name: 'Dog Toys', slug: 'dog-toys' },
      { id: 'cat-4', name: 'Cat Toys', slug: 'cat-toys' }
    ]);
    
    // Seed products
    await trx('products').insert(Object.values(productFixtures));
    
    // Seed users
    await trx('users').insert(Object.values(userFixtures));
  });
}
```

## 7. Test Execution & CI/CD

### 7.1 Test Scripts

```json
// package.json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest --testPathPattern=\\.test\\.ts$",
    "test:integration": "jest --testPathPattern=\\.integration\\.test\\.ts$",
    "test:e2e": "playwright test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "npm run test:coverage && npm run test:e2e",
    "test:debug": "node --inspect-brk ./node_modules/.bin/jest --runInBand"
  }
}
```

### 7.2 Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.integration.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.interface.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  }
};
```

### 7.3 GitHub Actions CI Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgres://postgres:test@localhost/petshop_test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:test@localhost/petshop_test
          REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start application
        run: |
          npm run build
          npm run start:test &
          npx wait-on http://localhost:3000
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 8. Test Monitoring & Reporting

### 8.1 Test Dashboard

```typescript
// tests/utils/reporter.ts

export class TestReporter {
  generateReport(results: TestResults): TestReport {
    return {
      summary: {
        total: results.total,
        passed: results.passed,
        failed: results.failed,
        skipped: results.skipped,
        duration: results.duration
      },
      coverage: {
        lines: results.coverage.lines,
        branches: results.coverage.branches,
        functions: results.coverage.functions,
        statements: results.coverage.statements
      },
      failures: results.failures.map(f => ({
        test: f.testName,
        error: f.error,
        stack: f.stack
      })),
      slowTests: results.tests
        .filter(t => t.duration > 1000)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10)
    };
  }
}
```

## 9. TDD Best Practices

### 9.1 Test Naming Conventions
- Use descriptive test names that explain the behavior
- Follow the pattern: `should [expected behavior] when [condition]`
- Group related tests using `describe` blocks

### 9.2 Test Organization
- One test file per source file
- Mirror the source directory structure
- Keep tests close to the code they test

### 9.3 Test Independence
- Each test should be independent
- Use `beforeEach` and `afterEach` for setup/teardown
- Avoid shared state between tests

### 9.4 Test Performance
- Mock external dependencies
- Use test databases for integration tests
- Parallelize test execution where possible

### 9.5 Continuous Improvement
- Review and update tests with code changes
- Add tests for bug fixes
- Refactor tests to improve maintainability

---

This TDD strategy ensures high-quality, maintainable code for the PetSupplies Shop while enabling rapid development through the parallel agent framework.