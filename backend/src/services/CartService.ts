import { createClient, RedisClientType } from 'redis';
import { Cart } from '../entities/Cart';
import { ICartItem } from '../../../shared/entities/cart-item.interface';
import { IProduct } from '../../../shared/entities/product.interface';
import crypto from 'crypto';

export class CartService {
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

  async createCart(sessionId: string): Promise<Cart> {
    await this.connect();
    
    const cart = new Cart({
      sessionId,
      items: [],
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const key = `cart:${cart.id}`;
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds

    await this.redisClient.setEx(
      key,
      ttl,
      JSON.stringify(cart.toJSON())
    );

    return cart;
  }

  async getCart(cartId: string): Promise<Cart | null> {
    await this.connect();
    
    const key = `cart:${cartId}`;
    const data = await this.redisClient.get(key);

    if (!data) {
      return null;
    }

    const cart = Cart.fromJSON(JSON.parse(data));
    
    if (cart.isExpired()) {
      await this.deleteCart(cartId);
      return null;
    }

    return cart;
  }

  async getCartBySessionId(sessionId: string): Promise<Cart | null> {
    await this.connect();
    
    const keys = await this.redisClient.keys('cart:*');
    
    for (const key of keys) {
      const data = await this.redisClient.get(key);
      if (data) {
        const cart = Cart.fromJSON(JSON.parse(data));
        if (cart.sessionId === sessionId && !cart.isExpired()) {
          return cart;
        }
      }
    }

    return null;
  }

  async updateCart(cart: Cart): Promise<void> {
    await this.connect();
    
    cart.updatedAt = new Date();
    const key = `cart:${cart.id}`;
    const ttl = Math.max(1, Math.floor((cart.expiresAt.getTime() - Date.now()) / 1000));

    await this.redisClient.setEx(
      key,
      ttl,
      JSON.stringify(cart.toJSON())
    );
  }

  async deleteCart(cartId: string): Promise<void> {
    await this.connect();
    
    const key = `cart:${cartId}`;
    await this.redisClient.del(key);
  }

  async addItemToCart(cartId: string, product: IProduct, quantity: number): Promise<Cart | null> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      return null;
    }

    const cartItem: ICartItem = {
      id: 'item_' + crypto.randomBytes(16).toString('hex'),
      cartId: cart.id,
      productId: product.id,
      product,
      quantity,
      priceAtTime: product.price,
      subtotal: product.price * quantity,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    cart.addItem(cartItem);
    await this.updateCart(cart);

    return cart;
  }

  async removeItemFromCart(cartId: string, productId: string): Promise<Cart | null> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      return null;
    }

    cart.removeItem(productId);
    await this.updateCart(cart);

    return cart;
  }

  async updateItemQuantity(cartId: string, productId: string, quantity: number): Promise<Cart | null> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      return null;
    }

    cart.updateItemQuantity(productId, quantity);
    await this.updateCart(cart);

    return cart;
  }

  async clearCart(cartId: string): Promise<Cart | null> {
    const cart = await this.getCart(cartId);
    if (!cart) {
      return null;
    }

    cart.clearCart();
    await this.updateCart(cart);

    return cart;
  }

  async mergeGuestCart(guestCartId: string, userCartId: string): Promise<Cart | null> {
    const guestCart = await this.getCart(guestCartId);
    const userCart = await this.getCart(userCartId);

    if (!guestCart || !userCart) {
      return null;
    }

    // Merge guest cart items into user cart
    for (const item of guestCart.items) {
      userCart.addItem(item);
    }

    // Delete guest cart
    await this.deleteCart(guestCartId);
    
    // Update user cart
    await this.updateCart(userCart);

    return userCart;
  }

  async cleanupExpiredCarts(): Promise<number> {
    await this.connect();
    
    const keys = await this.redisClient.keys('cart:*');
    let cleaned = 0;

    for (const key of keys) {
      const data = await this.redisClient.get(key);
      if (data) {
        const cart = Cart.fromJSON(JSON.parse(data));
        if (cart.isExpired()) {
          await this.redisClient.del(key);
          cleaned++;
        }
      }
    }

    return cleaned;
  }
}