import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for tests
dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Keep important methods for debugging
  error: jest.fn(console.error),
  warn: jest.fn(console.warn),
  // Silence less important logs
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Clean up after all tests
afterAll(async () => {
  // Close any open handles
  await new Promise(resolve => setTimeout(resolve, 500));
});