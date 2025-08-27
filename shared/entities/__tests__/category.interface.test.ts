import { ICategory } from '../category.interface';

describe('ICategory Interface', () => {
  describe('Interface Structure', () => {
    it('should have all required properties', () => {
      // Test 1: Verify ICategory interface has all required properties
      // Expected properties:
      // - id: string
      // - name: string
      // - slug: string
      // - description?: string (optional)
      // - parentId?: string (optional)
      // - isActive: boolean
      // - sortOrder: number
      // - createdAt: Date
      // - updatedAt: Date
      
      const mockCategory: ICategory = {
        id: 'cat-1',
        name: 'Dog Food',
        slug: 'dog-food',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(mockCategory.id).toBeDefined();
      expect(mockCategory.name).toBeDefined();
      expect(mockCategory.slug).toBeDefined();
      expect(mockCategory.isActive).toBeDefined();
      expect(mockCategory.sortOrder).toBeDefined();
      expect(mockCategory.createdAt).toBeDefined();
      expect(mockCategory.updatedAt).toBeDefined();
    });

    it('should enforce correct property types', () => {
      // Test 2: Verify type safety for all properties
      
      const validCategory: ICategory = {
        id: 'cat-1',
        name: 'Dog Food',
        slug: 'dog-food',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(typeof validCategory.id).toBe('string');
      expect(typeof validCategory.name).toBe('string');
      expect(typeof validCategory.slug).toBe('string');
      expect(typeof validCategory.isActive).toBe('boolean');
      expect(typeof validCategory.sortOrder).toBe('number');
      expect(validCategory.createdAt instanceof Date).toBe(true);
      expect(validCategory.updatedAt instanceof Date).toBe(true);
    });

    it('should allow optional description and parentId', () => {
      // Test 3: Verify optional properties work correctly
      
      const categoryWithoutOptionals: ICategory = {
        id: 'cat-1',
        name: 'Dog Food',
        slug: 'dog-food',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
        // Note: description and parentId are not included
      };
      
      const categoryWithOptionals: ICategory = {
        id: 'cat-2',
        name: 'Premium Dog Food',
        slug: 'premium-dog-food',
        description: 'High quality dog food',
        parentId: 'cat-1',
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(categoryWithoutOptionals.description).toBeUndefined();
      expect(categoryWithoutOptionals.parentId).toBeUndefined();
      expect(categoryWithOptionals.description).toBe('High quality dog food');
      expect(categoryWithOptionals.parentId).toBe('cat-1');
    });
  });

  describe('Hierarchical Structure', () => {
    it('should support parent-child relationships via parentId', () => {
      // Test 4: Verify hierarchical category structure
      
      const parentCategory: ICategory = {
        id: 'cat-parent',
        name: 'Pet Food',
        slug: 'pet-food',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const childCategory: ICategory = {
        id: 'cat-child',
        name: 'Dog Food',
        slug: 'dog-food',
        parentId: 'cat-parent',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(childCategory.parentId).toBe(parentCategory.id);
    });

    it('should allow root categories without parentId', () => {
      // Test 5: Root categories should not have parentId
      
      const rootCategory: ICategory = {
        id: 'cat-root',
        name: 'All Products',
        slug: 'all-products',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(rootCategory.parentId).toBeUndefined();
    });
  });

  describe('Slug Generation', () => {
    it('should have a slug field for URL-friendly identifiers', () => {
      // Test 6: Verify slug field exists and follows URL-friendly format
      
      const category: ICategory = {
        id: 'cat-1',
        name: 'Dog & Cat Food',
        slug: 'dog-cat-food', // URL-friendly version
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(category.slug).toMatch(/^[a-z0-9-]+$/);
      expect(category.slug).toBe('dog-cat-food');
    });
  });

  describe('Sorting and Display', () => {
    it('should support sortOrder for category display ordering', () => {
      // Test 7: Verify sortOrder field for custom ordering
      
      const mockCategoryBase = {
        id: 'cat-1',
        name: 'Test Category',
        slug: 'test-category',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const categories: ICategory[] = [
        { ...mockCategoryBase, id: 'cat-3', sortOrder: 3 },
        { ...mockCategoryBase, id: 'cat-1', sortOrder: 1 },
        { ...mockCategoryBase, id: 'cat-2', sortOrder: 2 }
      ];
      
      const sorted = categories.sort((a, b) => a.sortOrder - b.sortOrder);
      expect(sorted[0].sortOrder).toBe(1);
      expect(sorted[1].sortOrder).toBe(2);
      expect(sorted[2].sortOrder).toBe(3);
    });

    it('should support active/inactive status', () => {
      // Test 8: Verify isActive field for showing/hiding categories
      
      const mockCategoryBase = {
        id: 'cat-1',
        name: 'Test Category',
        slug: 'test-category',
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const activeCategory: ICategory = {
        ...mockCategoryBase,
        isActive: true
      };
      
      const inactiveCategory: ICategory = {
        ...mockCategoryBase,
        id: 'cat-2',
        isActive: false
      };
      
      expect(activeCategory.isActive).toBe(true);
      expect(inactiveCategory.isActive).toBe(false);
    });
  });

  describe('Timestamp Management', () => {
    it('should have createdAt and updatedAt as Date objects', () => {
      // Test 9: Verify timestamp fields are Date objects
      
      const mockCategoryBase = {
        id: 'cat-1',
        name: 'Test Category',
        slug: 'test-category',
        isActive: true,
        sortOrder: 1
      };
      
      const category: ICategory = {
        ...mockCategoryBase,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };
      
      expect(category.createdAt instanceof Date).toBe(true);
      expect(category.updatedAt instanceof Date).toBe(true);
      expect(category.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(category.updatedAt.toISOString()).toBe('2024-01-02T00:00:00.000Z');
    });
  });
});