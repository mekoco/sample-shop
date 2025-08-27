import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Order } from './Order';
import { Product } from './Product';
import { IOrderItem } from '../../../shared/entities/order-item.interface';

@Entity('order_items')
export class OrderItem implements IOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, order => order.items)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, product => product.orderItems)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column({ type: 'varchar', length: 255 })
  productName: string;

  @Column({ type: 'varchar', length: 100 })
  productSku: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  }})
  priceAtTime: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  }})
  subtotal: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}