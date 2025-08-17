# Pet Supplies Shop

A simple e-commerce application for pet supplies built with React, Express, TypeScript, and PostgreSQL.

## Tech Stack

- **Database**: PostgreSQL
- **Backend**: Express.js with TypeScript
- **Frontend**: React with TypeScript, Node.js runtime

## Project Structure

```
sample-shop/
├── backend/           # Express TypeScript API server
├── frontend/          # React TypeScript application
└── design-doc/        # Architecture documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Redis (optional, for session management)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` and update the database connection string and other settings.

4. Start the backend server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:8080`

### Frontend Setup

1. In a new terminal, navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/categories` - Get all categories

### Health Check
- `GET /api/health` - Check API status

## Features

- Product catalog with category filtering
- Responsive design
- TypeScript for type safety
- RESTful API architecture
- Modular code structure

## Development

### Backend Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types

### Frontend Commands
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Next Steps

1. Set up PostgreSQL database and run migrations
2. Implement user authentication
3. Add shopping cart functionality
4. Create order management system
5. Build admin panel for product management

## License

MIT