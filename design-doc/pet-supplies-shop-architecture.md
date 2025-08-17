# PetSupplies Shop - Simplified Architecture Design Document

## 1. Executive Summary

PetSupplies Shop is a simple ecommerce toy project for learning purposes. Built as a monolithic application with a clean modular structure, it demonstrates basic ecommerce functionality without unnecessary complexity.

### Key Features
- Product catalog for pet supplies
- Shopping cart functionality  
- User registration and authentication
- Order management
- Basic admin panel

## 2. System Architecture Overview

### Technology Stack
- **Database**: PostgreSQL (Primary database for all application data)
- **Backend**: Express.js with TypeScript (RESTful API server)
- **Frontend**: React with TypeScript, Node.js runtime

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Application                         │
│         (React + TypeScript Frontend - Port 3000)           │
│                      Node.js Runtime                        │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ HTTP/REST
                               │
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                            │
│        (Express + TypeScript Server - Port 8080)            │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │              Application Modules                  │       │
│  │                                                  │       │
│  │  • Auth Module      • Product Module            │       │
│  │  • User Module      • Cart Module               │       │
│  │  • Order Module     • Admin Module              │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
            ┌───────▼────────┐   ┌───────▼────────┐
            │   PostgreSQL    │   │     Redis       │
            │   (Main DB)     │   │   (Sessions)    │
            └────────────────┘   └────────────────┘
```

## 3. Core Application Modules

### 3.1 Auth Module
**Responsibilities:**
- User registration and login
- Session management
- Password reset

**Key Endpoints:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/reset-password
```

### 3.2 Product Module
**Responsibilities:**
- Product listing and search
- Product details
- Category management

**Key Endpoints:**
```
GET    /api/products         // List all products
GET    /api/products/:id     // Get product details
GET    /api/products/search  // Search products
GET    /api/categories       // List categories
```

**Data Model:**
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.3 Cart Module
**Responsibilities:**
- Add/remove items from cart
- Update quantities
- Calculate totals

**Key Endpoints:**
```
GET    /api/cart             // Get current cart
POST   /api/cart/items       // Add item to cart
PUT    /api/cart/items/:id   // Update quantity
DELETE /api/cart/items/:id   // Remove item
DELETE /api/cart             // Clear cart
```

**Data Model:**
```typescript
interface Cart {
  id: string;
  userId?: string;
  sessionId: string;
  items: CartItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}
```

### 3.4 Order Module
**Responsibilities:**
- Create orders from cart
- View order history
- Update order status (admin)

**Key Endpoints:**
```
POST   /api/orders           // Create order
GET    /api/orders           // List user orders
GET    /api/orders/:id       // Get order details
PUT    /api/orders/:id       // Update order (admin)
```

**Data Model:**
```typescript
interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  shippingAddress: Address;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.5 User Module
**Responsibilities:**
- User profile management
- Address management
- View order history

**Key Endpoints:**
```
GET    /api/users/profile    // Get profile
PUT    /api/users/profile    // Update profile
GET    /api/users/orders     // Get user orders
```

### 3.6 Admin Module
**Responsibilities:**
- Product management (CRUD)
- Order management
- Basic reporting

**Key Endpoints:**
```
POST   /api/admin/products       // Create product
PUT    /api/admin/products/:id   // Update product
DELETE /api/admin/products/:id   // Delete product
GET    /api/admin/orders         // List all orders
PUT    /api/admin/orders/:id     // Update order status
```

## 4. Database Schema

### PostgreSQL Tables

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    shipping_address JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

-- Addresses table
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    is_default BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### Redis Usage
```javascript
// Session storage
session:{sessionId}     // User session data
cart:{sessionId}        // Shopping cart data (temporary)
```

## 5. Authentication & Security

### Simple JWT-based Authentication
```javascript
// JWT configuration
{
  secret: process.env.JWT_SECRET,
  expiresIn: '7d'
}

// Session management with express-session + Redis
{
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}
```

### Basic Security Measures
- Password hashing with bcrypt
- Input validation with Joi
- SQL injection prevention with parameterized queries
- XSS protection with helmet
- Rate limiting on API endpoints

## 6. Testing Strategy

### Unit Tests
Focus on core business logic:
```javascript
describe('Cart Service', () => {
  test('should add item to cart', async () => {
    const cart = new Cart();
    await cart.addItem(productId, quantity);
    expect(cart.items).toHaveLength(1);
  });

  test('should calculate total correctly', () => {
    const cart = new Cart();
    cart.addItem({ price: 10, quantity: 2 });
    expect(cart.getTotal()).toBe(20);
  });
});
```

### Integration Tests
Test API endpoints:
```javascript
describe('API Tests', () => {
  test('POST /api/products should create product', async () => {
    const response = await request(app)
      .post('/api/admin/products')
      .send({ name: 'Dog Food', price: 29.99 });
    
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Dog Food');
  });
});
```

## 7. Development Setup

### Docker Compose Configuration
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@postgres:5432/petshop
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev-secret-key
    depends_on:
      - postgres
      - redis
    volumes:
      - ./src:/app/src
      - ./public:/app/public

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=petshop
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Environment Variables
```env
# Application
NODE_ENV=development
PORT=8080

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/petshop
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret

# Admin
ADMIN_EMAIL=admin@petshop.com
ADMIN_PASSWORD=admin123
```

## 8. Project Structure

```
petshop/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.routes.js
│   │   ├── products/
│   │   │   ├── product.controller.js
│   │   │   ├── product.service.js
│   │   │   ├── product.model.js
│   │   │   └── product.routes.js
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── users/
│   │   └── admin/
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── utils/
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── logger.js
│   └── app.js
├── tests/
│   ├── unit/
│   └── integration/
├── public/
│   └── uploads/
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## 9. Getting Started

```bash
# Clone repository
git clone https://github.com/youruser/petshop-toy-project.git
cd petshop-toy-project

# Install dependencies
npm install

# Setup database
docker-compose up -d postgres redis
npm run db:migrate
npm run db:seed

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start with Docker
docker-compose up
```

## 10. API Documentation

Basic REST API following standard conventions:
- GET for reading data
- POST for creating resources
- PUT for updating resources
- DELETE for removing resources

Response format:
```json
{
  "success": true,
  "data": { },
  "message": "Operation successful"
}
```

Error format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 11. Sample API Calls

```bash
# Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get products
curl http://localhost:8080/api/products

# Add to cart
curl -X POST http://localhost:8080/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"productId":1,"quantity":2}'

# Create order
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"shippingAddress":{...}}'
```

## 12. Future Improvements (Optional)
- Add product images upload
- Implement email notifications
- Add product reviews
- Create a simple React frontend
- Add pagination for product listings
- Implement basic search functionality

---

This simplified architecture is suitable for a toy project, focusing on core functionality without unnecessary complexity. It can be easily understood, developed, and deployed by a single developer or small team learning web development.