import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './User';
import { OrderItem } from './OrderItem';
import { IOrder, IShippingAddress, IAddress } from '../../../shared/entities';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../../shared/entities/types';

@Entity('orders')
export class Order implements IOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  orderNumber: string;

  @Column({ type: 'uuid', nullable: true })
  sessionId?: string;

  @ManyToOne(() => User, user => user.orders, { nullable: true })
  user?: User;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true, eager: true })
  items: OrderItem[];

  @Column({ type: 'jsonb' })
  shippingAddress: IShippingAddress;

  @Column({ type: 'jsonb', nullable: true })
  billingAddress?: IAddress;

  @Column({ type: 'varchar', length: 255 })
  emailHash: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: {
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

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  }})
  total: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentIntentId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}