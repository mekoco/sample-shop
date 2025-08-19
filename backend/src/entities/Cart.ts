import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CartItem } from './CartItem';
import { ICart } from '../../../shared/entities/cart.interface';

@Entity('carts')
export class Cart implements ICart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @OneToMany(() => CartItem, cartItem => cartItem.cart, { cascade: true, eager: true })
  items: CartItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  }})
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  }})
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  }})
  shipping: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  }})
  total: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}