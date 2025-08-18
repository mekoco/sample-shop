import { AppDataSource } from '../config/typeorm.config';
import { Product } from '../entities/Product';

export const ProductRepository = AppDataSource.getRepository(Product).extend({
  async findAllActive() {
    return this.find({
      where: { isActive: true },
      relations: ['category'],
      order: { createdAt: 'DESC' }
    });
  },

  async findByCategory(categoryId: string) {
    return this.find({
      where: { 
        isActive: true,
        category: { id: categoryId }
      },
      relations: ['category'],
      order: { createdAt: 'DESC' }
    });
  },

  async findWithStock() {
    return this.createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.stock > :stock', { stock: 0 })
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  }
});