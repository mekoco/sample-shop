import { AppDataSource } from '../config/typeorm.config';
import { Product } from '../entities/Product';

export const ProductRepository = AppDataSource.getRepository(Product).extend({
  async findAllActive() {
    return this.find({
      where: { isActive: true },
      relations: ['categories'],
      order: { createdAt: 'DESC' }
    });
  },

  async findByCategory(categoryId: string) {
    return this.createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true })
      .leftJoin('product.categories', 'category')
      .where('category.id = :categoryId', { categoryId })
      .leftJoinAndSelect('product.categories', 'categories')
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  },

  async findWithStock() {
    return this.createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.stockQuantity > :stock', { stock: 0 })
      .leftJoinAndSelect('product.categories', 'categories')
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  }
});