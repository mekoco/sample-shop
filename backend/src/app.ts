import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { ProductRepository } from './repositories/ProductRepository';
import { CategoryRepository } from './repositories/CategoryRepository';

dotenv.config();

const app: Application = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/products', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await ProductRepository.findAllActive();
    res.json({
      success: true,
      data: products,
      message: 'Products retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await CategoryRepository.findAllActive();
    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    code: 'INTERNAL_SERVER_ERROR',
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
});

export default app;