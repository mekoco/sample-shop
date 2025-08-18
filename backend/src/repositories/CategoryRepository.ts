import { AppDataSource } from '../config/typeorm.config';
import { Category } from '../entities/Category';

export const CategoryRepository = AppDataSource.getRepository(Category).extend({
  async findAllActive() {
    return this.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' }
    });
  },

  async findWithProducts(categoryId: string) {
    return this.findOne({
      where: { id: categoryId, isActive: true },
      relations: ['products']
    });
  }
});