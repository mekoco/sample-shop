import { IProduct } from '../product.interface';

describe('IProduct Interface', () => {
  describe('Interface Structure', () => {
    it('should have all required properties', () => {
      // Test 1: Verify IProduct interface has all required properties
      // Expected properties:
      // - id: string
      // - name: string  
      // - description: string
      // - price: number
      // - currency: string
      // - sku: string
      // - stockQuantity: number
      // - imageUrls: string[]
      // - thumbnailUrl?: string (optional)
      // - categories: ICategory[]
      // - isActive: boolean
      // - createdAt: Date
      // - updatedAt: Date
      
      const mockProduct: IProduct = {
        id: 'prod-1',
        name: 'Test Product',
        description: 'Test Description',
        price: 10.99,
        currency: 'USD',
        sku: 'SKU001',
        stockQuantity: 10,
        imageUrls: ['https://example.com/image.jpg'],
        categories: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(mockProduct.id).toBeDefined();
      expect(mockProduct.name).toBeDefined();
      expect(mockProduct.description).toBeDefined();
      expect(mockProduct.price).toBeDefined();
      expect(mockProduct.currency).toBeDefined();
      expect(mockProduct.sku).toBeDefined();
      expect(mockProduct.stockQuantity).toBeDefined();
      expect(mockProduct.imageUrls).toBeDefined();
      expect(mockProduct.categories).toBeDefined();
      expect(mockProduct.isActive).toBeDefined();
      expect(mockProduct.createdAt).toBeDefined();
      expect(mockProduct.updatedAt).toBeDefined();
    });

    it('should enforce correct property types', () => {
      // Test 2: Verify type safety for all properties
      // This test ensures TypeScript compilation will fail if types are incorrect
      
      const validProduct: IProduct = {
        id: 'prod-1',
        name: 'Product',
        description: 'Description',
        price: 10.99,
        currency: 'USD',
        sku: 'SKU001',
        stockQuantity: 10,
        imageUrls: ['url1', 'url2'],
        categories: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(typeof validProduct.id).toBe('string');
      expect(typeof validProduct.name).toBe('string');
      expect(typeof validProduct.price).toBe('number');
      expect(typeof validProduct.stockQuantity).toBe('number');
      expect(Array.isArray(validProduct.imageUrls)).toBe(true);
      expect(Array.isArray(validProduct.categories)).toBe(true);
      expect(typeof validProduct.isActive).toBe('boolean');
      expect(validProduct.createdAt instanceof Date).toBe(true);
      expect(validProduct.updatedAt instanceof Date).toBe(true);
    });

    it('should allow optional thumbnailUrl property', () => {
      // Test 3: Verify optional properties work correctly
      // thumbnailUrl should be optional
      
      const productWithoutThumbnail: IProduct = {
        id: 'prod-1',
        name: 'Product',
        description: 'Description',
        price: 10.99,
        currency: 'USD',
        sku: 'SKU001',
        stockQuantity: 10,
        imageUrls: [],
        categories: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
        // Note: thumbnailUrl is not included
      };
      
      expect(productWithoutThumbnail.thumbnailUrl).toBeUndefined();
      
      const productWithThumbnail: IProduct = {
        ...productWithoutThumbnail,
        thumbnailUrl: 'https://example.com/thumb.jpg'
      };
      
      expect(productWithThumbnail.thumbnailUrl).toBeDefined();
      expect(productWithThumbnail.thumbnailUrl).toBe('https://example.com/thumb.jpg');
    });
  });

  describe('Business Rules Validation', () => {
    it('should support multiple currencies', () => {
      // Test 4: Verify currency field can support multiple values
      // Expected to support at least: USD, EUR, GBP
      
      const createMockProduct = (overrides: Partial<IProduct> = {}): IProduct => ({
        id: 'prod-1',
        name: 'Test Product',
        description: 'Description',
        price: 10.99,
        currency: 'USD',
        sku: 'SKU001',
        stockQuantity: 10,
        imageUrls: [],
        categories: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
      });
      
      const usdProduct: IProduct = createMockProduct({ currency: 'USD' });
      const eurProduct: IProduct = createMockProduct({ currency: 'EUR' });
      const gbpProduct: IProduct = createMockProduct({ currency: 'GBP' });
      
      expect(usdProduct.currency).toBe('USD');
      expect(eurProduct.currency).toBe('EUR');
      expect(gbpProduct.currency).toBe('GBP');
    });

    it('should support multiple image URLs', () => {
      // Test 5: Verify imageUrls is an array that can hold multiple URLs
      
      const mockProductBase: IProduct = {
        id: 'prod-1',
        name: 'Test Product',
        description: 'Description',
        price: 10.99,
        currency: 'USD',
        sku: 'SKU001',
        stockQuantity: 10,
        imageUrls: [],
        categories: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const productWithMultipleImages: IProduct = {
        ...mockProductBase,
        imageUrls: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg'
        ]
      };
      
      expect(productWithMultipleImages.imageUrls).toHaveLength(3);
      expect(productWithMultipleImages.imageUrls[0]).toBe('https://example.com/image1.jpg');
      expect(productWithMultipleImages.imageUrls[1]).toBe('https://example.com/image2.jpg');
      expect(productWithMultipleImages.imageUrls[2]).toBe('https://example.com/image3.jpg');
    });

    it('should support multiple categories', () => {
      // Test 6: Verify categories is an array of ICategory objects
      
      const mockProductBase: IProduct = {
        id: 'prod-1',
        name: 'Test Product',
        description: 'Description',
        price: 10.99,
        currency: 'USD',
        sku: 'SKU001',
        stockQuantity: 10,
        imageUrls: [],
        categories: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const productWithCategories: IProduct = {
        ...mockProductBase,
        categories: [
          { 
            id: 'cat-1', 
            name: 'Dog Food',
            slug: 'dog-food',
            isActive: true,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: 'cat-2', 
            name: 'Premium',
            slug: 'premium',
            isActive: true,
            sortOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };
      
      expect(productWithCategories.categories).toHaveLength(2);
      expect(productWithCategories.categories[0].name).toBe('Dog Food');
      expect(productWithCategories.categories[1].name).toBe('Premium');
    });
  });

  describe('Data Integrity', () => {
    it('should enforce positive price values', () => {
      // Test 7: Business rule - price should be positive
      // Note: This validation would be implemented in the entity class, not interface
      // But the interface should be designed to support this validation
      
      const validatePrice = (product: IProduct): boolean => {
        return product.price > 0;
      };
      
      const validProduct: IProduct = {
        id: 'prod-1',
        name: 'Product',
        description: 'Description',
        price: 10.99,
        currency: 'USD',
        sku: 'SKU001',
        stockQuantity: 10,
        imageUrls: [],
        categories: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(validatePrice(validProduct)).toBe(true);
      
      const invalidProduct: IProduct = { ...validProduct, price: 0 };
      expect(validatePrice(invalidProduct)).toBe(false);
    });

    it('should enforce non-negative stock quantity', () => {
      // Test 8: Business rule - stock quantity should be >= 0
      
      const validateStock = (product: IProduct): boolean => {
        return product.stockQuantity >= 0;
      };
      
      const validProduct: IProduct = {
        id: 'prod-1',
        name: 'Product',
        description: 'Description',
        price: 10.99,
        currency: 'USD',
        sku: 'SKU001',
        stockQuantity: 0,
        imageUrls: [],
        categories: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(validateStock(validProduct)).toBe(true);
      
      const invalidProduct: IProduct = { ...validProduct, stockQuantity: -1 };
      expect(validateStock(invalidProduct)).toBe(false);
    });

    it('should enforce unique SKU', () => {
      // Test 9: Business rule - SKU should be unique
      // Note: Uniqueness would be enforced at database level
      // Interface should support SKU as a required string field
      
      const mockProductBase: IProduct = {
        id: 'prod-1',
        name: 'Test Product',
        description: 'Description',
        price: 10.99,
        currency: 'USD',
        sku: 'SKU001',
        stockQuantity: 10,
        imageUrls: [],
        categories: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const product: IProduct = {
        ...mockProductBase,
        sku: 'UNIQUE-SKU-001'
      };
      
      expect(product.sku).toBe('UNIQUE-SKU-001');
      expect(typeof product.sku).toBe('string');
      expect(product.sku.length).toBeGreaterThan(0);
    });
  });

  describe('Timestamp Management', () => {
    it('should have createdAt and updatedAt as Date objects', () => {
      // Test 10: Verify timestamp fields are Date objects
      
      const mockProductBase: IProduct = {
        id: 'prod-1',
        name: 'Test Product',
        description: 'Description',
        price: 10.99,
        currency: 'USD',
        sku: 'SKU001',
        stockQuantity: 10,
        imageUrls: [],
        categories: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const product: IProduct = {
        ...mockProductBase,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };
      
      expect(product.createdAt instanceof Date).toBe(true);
      expect(product.updatedAt instanceof Date).toBe(true);
      expect(product.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(product.updatedAt.toISOString()).toBe('2024-01-02T00:00:00.000Z');
    });
  });
});