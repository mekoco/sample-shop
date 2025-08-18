import 'reflect-metadata';
import app from './app';
import dotenv from 'dotenv';
import { AppDataSource } from './config/typeorm.config';

dotenv.config();

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();