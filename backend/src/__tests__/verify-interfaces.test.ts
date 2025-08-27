import 'reflect-metadata';
import { IProduct } from '../../../shared/entities/product.interface';
import { ICategory } from '../../../shared/entities/category.interface';
import { ISession } from '../../../shared/entities/session.interface';
import { ICart } from '../../../shared/entities/cart.interface';
import { ICartItem } from '../../../shared/entities/cart-item.interface';
import { IOrder } from '../../../shared/entities/order.interface';
import { IOrderItem } from '../../../shared/entities/order-item.interface';
import { IAddress, IShippingAddress } from '../../../shared/entities/address.interface';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../../../shared/entities/types';
import { Product } from '../entities/Product';
import { Category } from '../entities/Category';
import { Session } from '../entities/Session';
import { Cart } from '../entities/Cart';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';

describe('Entity Interface Implementation Verification', () => {
  describe('Product Interface', () => {
    it('should implement IProduct interface', () => {
      const product = new Product();
      product.id = 'test-id';
      product.name = 'Test Product';
      product.description = 'Test Description';
      product.price = 99.99;
      product.currency = 'USD';
      product.sku = 'TEST-SKU-001';
      product.stockQuantity = 100;
      product.imageUrls = ['https://example.com/image.jpg'];
      product.thumbnailUrl = 'https://example.com/thumb.jpg';
      product.categories = [];
      product.isActive = true;
      product.createdAt = new Date();
      product.updatedAt = new Date();

      const productAsInterface: IProduct = product;
      expect(productAsInterface).toBeDefined();
      expect(product.id).toBe('test-id');
      expect(product.name).toBe('Test Product');
      expect(product.isInStock()).toBe(true);
      expect(product.getFormattedPrice()).toBe('$99.99');
    });
  });

  describe('Category Interface', () => {
    it('should implement ICategory interface', () => {
      const category = new Category();
      category.id = 'cat-id';
      category.name = 'Test Category';
      category.slug = 'test-category';
      category.description = 'Test Description';
      category.parentId = undefined;
      category.isActive = true;
      category.sortOrder = 1;
      category.createdAt = new Date();
      category.updatedAt = new Date();

      const categoryAsInterface: ICategory = category;
      expect(categoryAsInterface).toBeDefined();
      expect(category.name).toBe('Test Category');
      expect(category.slug).toBe('test-category');
    });
  });

  describe('Session Interface', () => {
    it('should implement ISession interface', () => {
      const session = new Session();
      
      const sessionAsInterface: ISession = session;
      expect(sessionAsInterface).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.expiresAt).toBeInstanceOf(Date);
      expect(session.isExpired()).toBe(false);
    });

    it('should generate secure session IDs', () => {
      const session1 = new Session();
      const session2 = new Session();
      
      expect(session1.id).toBeDefined();
      expect(session2.id).toBeDefined();
      expect(session1.id).not.toBe(session2.id);
      expect(session1.id.length).toBe(64); // 32 bytes hex = 64 chars
    });

    it('should set 7-day expiration', () => {
      const session = new Session();
      const diffInMs = session.expiresAt.getTime() - session.createdAt.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      
      expect(diffInDays).toBeCloseTo(7, 0);
    });
  });

  describe('Cart Interface', () => {
    it('should implement ICart interface', () => {
      const cart = new Cart({ sessionId: 'test-session' });
      
      const cartAsInterface: ICart = cart;
      expect(cartAsInterface).toBeDefined();
      expect(cart.id).toBeDefined();
      expect(cart.sessionId).toBe('test-session');
      expect(cart.items).toEqual([]);
      expect(cart.isExpired()).toBe(false);
    });

    it('should calculate totals correctly', () => {
      const cart = new Cart({ sessionId: 'test-session' });
      
      const item: ICartItem = {
        id: 'item-1',
        cartId: cart.id,
        productId: 'prod-1',
        quantity: 2,
        priceAtTime: 50,
        subtotal: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      cart.addItem(item);
      
      expect(cart.subtotal).toBe(100);
      expect(cart.tax).toBe(8); // 8% of 100
      expect(cart.shipping).toBe(0); // Free shipping over $50
      expect(cart.total).toBe(108);
    });
  });

  describe('Order Interface', () => {
    it('should implement IOrder interface', () => {
      const order = new Order();
      order.id = 'order-id';
      order.orderNumber = 'ORD-001';
      order.sessionId = 'session-id';
      order.status = OrderStatus.PENDING;
      order.items = [];
      order.shippingAddress = {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      };
      order.emailHash = 'hashed-email';
      order.subtotal = 100;
      order.tax = 8;
      order.shipping = 10;
      order.total = 118;
      order.currency = 'USD';
      order.paymentMethod = PaymentMethod.CREDIT_CARD;
      order.paymentStatus = PaymentStatus.PENDING;
      order.createdAt = new Date();
      order.updatedAt = new Date();

      const orderAsInterface: IOrder = order;
      expect(orderAsInterface).toBeDefined();
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.paymentMethod).toBe(PaymentMethod.CREDIT_CARD);
    });
  });

  describe('OrderItem Interface', () => {
    it('should implement IOrderItem interface', () => {
      const orderItem = new OrderItem();
      orderItem.id = 'item-id';
      orderItem.orderId = 'order-id';
      orderItem.productId = 'product-id';
      orderItem.productName = 'Test Product';
      orderItem.productSku = 'TEST-SKU';
      orderItem.quantity = 2;
      orderItem.priceAtTime = 50;
      orderItem.subtotal = 100;
      orderItem.createdAt = new Date();
      orderItem.updatedAt = new Date();

      const orderItemAsInterface: IOrderItem = orderItem;
      expect(orderItemAsInterface).toBeDefined();
      expect(orderItem.productName).toBe('Test Product');
      expect(orderItem.subtotal).toBe(100);
    });
  });

  describe('Address Interfaces', () => {
    it('should support IAddress interface', () => {
      const address: IAddress = {
        firstName: 'John',
        lastName: 'Doe',
        company: 'ACME Corp',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        isValid: true
      };

      expect(address).toBeDefined();
      expect(address.firstName).toBe('John');
    });

    it('should support IShippingAddress interface', () => {
      const shippingAddress: IShippingAddress = {
        firstName: 'Jane',
        lastName: 'Smith',
        addressLine1: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'USA',
        instructions: 'Leave at door'
      };

      expect(shippingAddress).toBeDefined();
      expect(shippingAddress.instructions).toBe('Leave at door');
    });
  });

  describe('Types and Enums', () => {
    it('should have OrderStatus enum values', () => {
      expect(OrderStatus.PENDING).toBe('pending');
      expect(OrderStatus.PROCESSING).toBe('processing');
      expect(OrderStatus.PAID).toBe('paid');
      expect(OrderStatus.SHIPPED).toBe('shipped');
      expect(OrderStatus.DELIVERED).toBe('delivered');
      expect(OrderStatus.CANCELLED).toBe('cancelled');
      expect(OrderStatus.REFUNDED).toBe('refunded');
    });

    it('should have PaymentStatus enum values', () => {
      expect(PaymentStatus.PENDING).toBe('pending');
      expect(PaymentStatus.PROCESSING).toBe('processing');
      expect(PaymentStatus.SUCCEEDED).toBe('succeeded');
      expect(PaymentStatus.FAILED).toBe('failed');
      expect(PaymentStatus.CANCELLED).toBe('cancelled');
      expect(PaymentStatus.REFUNDED).toBe('refunded');
    });

    it('should have PaymentMethod enum values', () => {
      expect(PaymentMethod.CREDIT_CARD).toBe('credit_card');
      expect(PaymentMethod.DEBIT_CARD).toBe('debit_card');
      expect(PaymentMethod.PAYPAL).toBe('paypal');
      expect(PaymentMethod.APPLE_PAY).toBe('apple_pay');
      expect(PaymentMethod.GOOGLE_PAY).toBe('google_pay');
    });
  });
});