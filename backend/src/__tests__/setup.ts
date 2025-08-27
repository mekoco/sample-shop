import 'reflect-metadata';
import '@testing-library/jest-dom';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/petshop_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.SESSION_SECRET = 'test-session-secret-key';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Clean up after tests
afterAll(async () => {
  // Close any open database connections
  // Close any open Redis connections
  await new Promise(resolve => setTimeout(resolve, 100));
});