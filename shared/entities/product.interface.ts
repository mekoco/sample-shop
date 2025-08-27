import { ICategory } from './category.interface';

export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  sku: string;
  stockQuantity: number;
  imageUrls: string[];
  thumbnailUrl?: string;
  categories: ICategory[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}