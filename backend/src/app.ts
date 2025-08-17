import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

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

app.get('/api/products', async (_req: Request, res: Response) => {
  const sampleProducts = [
    {
      id: '1',
      name: 'Premium Dog Food',
      description: 'High-quality nutrition for your dog',
      category: 'Dog Food',
      price: 49.99,
      imageUrl: '/images/dog-food.jpg',
      stock: 50,
    },
    {
      id: '2',
      name: 'Cat Toys Set',
      description: 'Interactive toys to keep your cat entertained',
      category: 'Cat Toys',
      price: 24.99,
      imageUrl: '/images/cat-toys.jpg',
      stock: 100,
    },
    {
      id: '3',
      name: 'Bird Cage Deluxe',
      description: 'Spacious and comfortable cage for birds',
      category: 'Bird Supplies',
      price: 89.99,
      imageUrl: '/images/bird-cage.jpg',
      stock: 20,
    },
    {
      id: '4',
      name: 'Fish Tank Filter',
      description: 'Keep your aquarium water crystal clear',
      category: 'Fish Supplies',
      price: 34.99,
      imageUrl: '/images/fish-filter.jpg',
      stock: 75,
    },
  ];

  res.json({
    success: true,
    data: sampleProducts,
    message: 'Products retrieved successfully',
  });
});

app.get('/api/categories', (_req: Request, res: Response) => {
  const categories = [
    'Dog Food',
    'Dog Toys',
    'Cat Food',
    'Cat Toys',
    'Bird Supplies',
    'Fish Supplies',
    'Small Pet Supplies',
  ];

  res.json({
    success: true,
    data: categories,
    message: 'Categories retrieved successfully',
  });
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