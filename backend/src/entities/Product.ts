import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Category } from './Category';
import { OrderItem } from './OrderItem';
import { IProduct } from '../../../shared/entities/product.interface';
import { ICategory } from '../../../shared/entities/category.interface';
import { IsNotEmpty, IsPositive, Min, IsUrl, IsString, Matches } from 'class-validator';

@Entity('products')
export class Product implements IProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  }})
  @IsPositive()
  @IsNotEmpty()
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  @IsString()
  currency: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Za-z0-9-]+$/, { message: 'SKU must contain only letters, numbers and hyphens' })
  sku: string;

  @Column({ type: 'int', default: 0 })
  @Min(0)
  stockQuantity: number;

  @Column('simple-array', { default: '' })
  imageUrls: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToMany(() => Category, category => category.products)
  @JoinTable({
    name: 'product_categories',
    joinColumn: { name: 'productId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' }
  })
  categories: Category[];

  @OneToMany(() => OrderItem, orderItem => orderItem.product)
  orderItems: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isInStock(): boolean {
    return this.stockQuantity > 0;
  }

  getFormattedPrice(): string {
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    const symbol = currencySymbols[this.currency] || this.currency;
    return `${symbol}${this.price.toFixed(2)}`;
  }
}