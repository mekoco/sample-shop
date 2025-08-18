import { DataSource, DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5532'),
  username: process.env.DATABASE_USER || 'petshop_user',
  password: process.env.DATABASE_PASSWORD || 'petshop_password',
  database: process.env.DATABASE_NAME || 'petshop_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, '..', 'entities', '*.{ts,js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
  subscribers: [],
};

export const AppDataSource = new DataSource(dataSourceOptions);