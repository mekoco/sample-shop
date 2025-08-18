import 'reflect-metadata';
import app from './app';
import dotenv from 'dotenv';
import path from 'path';
import { AppDataSource } from './config/typeorm.config';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.BACKEND_PORT || 8080;

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');

    const HOST = process.env.BACKEND_HOST || 'localhost';
    app.listen(Number(PORT), HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.BACKEND_NODE_ENV}`);
      console.log(`API available at http://${HOST}:${PORT}/api`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();