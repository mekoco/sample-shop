# PetSupplies Shop - Quick Start Implementation Guide

## Implementation Roadmap

This guide provides a step-by-step approach to implementing the PetSupplies Shop using TDD and the parallel agent framework.

## Phase 1: Foundation (Week 1)

### Day 1-2: Project Setup
```bash
# Initialize project
mkdir petshop-app && cd petshop-app
npm init -y

# Install core dependencies
npm install express typescript @types/node @types/express
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
npm install --save-dev @playwright/test

# Setup TypeScript
npx tsc --init

# Create project structure
mkdir -p src/{services,api,models,utils,middleware}
mkdir -p tests/{unit,integration,e2e,fixtures,utils}
mkdir -p .claude-commands
```

### Day 3-4: Database & Core Models
```bash
# Database setup
npm install knex pg
npm install --save-dev @types/pg

# Create migrations
npx knex init
npx knex migrate:make create_users_table
npx knex migrate:make create_products_table
npx knex migrate:make create_orders_table
```

### Day 5: CI/CD Pipeline
```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:integration
```

## Phase 2: Core Services (Week 2)

### Implement Product Service (TDD)
```typescript
// 1. Write test first
// tests/unit/services/product.service.test.ts
describe('ProductService', () => {
  it('should create a product', async () => {
    const product = await productService.create({
      name: 'Dog Food',
      price: 29.99
    });
    expect(product.id).toBeDefined();
  });
});

// 2. Implement service
// src/services/product.service.ts
export class ProductService {
  async create(data: CreateProductDto): Promise<Product> {
    // Implementation
  }
}

// 3. Run test and verify
npm test -- product.service.test.ts
```

### Services Implementation Order
1. **Product Service** - Core catalog functionality
2. **User Service** - Authentication and profiles
3. **Cart Service** - Shopping cart management
4. **Order Service** - Order processing
5. **Inventory Service** - Stock management
6. **Payment Service** - Payment processing

## Phase 3: API Layer (Week 3)

### API Implementation Pattern
```typescript
// 1. Write integration test
// tests/integration/api/products.test.ts
describe('GET /api/products', () => {
  it('should return products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toBeInstanceOf(Array);
  });
});

// 2. Implement route
// src/api/routes/products.ts
router.get('/products', async (req, res) => {
  const products = await productService.findAll();
  res.json({ products });
});
```

## Phase 4: Agent Integration (Week 4)

### Setup Agent Environment
```bash
# 1. Create agent commands
cat > .claude-commands/fix-issue.md << 'EOF'
---
name: fix-issue
description: Fix GitHub issue
---
[Command content from agent integration guide]
EOF

# 2. Setup agent databases
./scripts/setup-agent-databases.sh

# 3. Configure agent environments
./scripts/setup-agents.sh

# 4. Start agents
./scripts/start-all-agents.sh
```

## Testing Checklist

### Unit Tests (Write First!)
- [ ] Product CRUD operations
- [ ] Price calculations
- [ ] Inventory checks
- [ ] User authentication
- [ ] Cart operations
- [ ] Order validation
- [ ] Payment processing
- [ ] Email formatting

### Integration Tests
- [ ] API endpoints authentication
- [ ] Database transactions
- [ ] Service interactions
- [ ] Cache operations
- [ ] External API mocking

### E2E Tests
- [ ] Complete purchase flow
- [ ] User registration
- [ ] Product search
- [ ] Cart management
- [ ] Checkout process
- [ ] Order tracking

## Sample Implementation Workflow

### Example: Adding Product Reviews Feature

#### Step 1: Create GitHub Issue
```markdown
Title: Add product review functionality

Description:
- Users can submit reviews for purchased products
- Reviews include rating (1-5) and text
- Display average rating on product page
- Only verified purchasers can review

Acceptance Criteria:
- [ ] Database schema for reviews
- [ ] API endpoints for CRUD operations
- [ ] Review validation logic
- [ ] Frontend components
- [ ] Tests with 80% coverage
```

#### Step 2: DEV Agent Workflow
```bash
# Agent 10 picks up the issue
# Creates branch: a10-add-product-reviews

# 1. Write failing tests
npm test -- --watch reviews

# 2. Implement feature
# 3. Make tests pass
# 4. Run full test suite
npm test

# 5. Create PR
gh pr create --title "feat: Add product reviews"
```

#### Step 3: REVIEWER Agent Workflow
```bash
# Agent 60 reviews the PR
# Runs all tests
npm test && npm run test:integration

# Checks code quality
npm run lint

# Approves or requests changes
```

#### Step 4: MERGER Agent Workflow
```bash
# Agent 80 validates for merge
# Runs complete validation
npm run test:all
npm run build
npm run test:performance

# Adds can-merge label if all pass
```

## Common TDD Patterns

### Pattern 1: Service Method Testing
```typescript
// Always test first
describe('Service.method', () => {
  it('should handle success case', async () => {
    // Arrange
    const input = { /* test data */ };
    
    // Act
    const result = await service.method(input);
    
    // Assert
    expect(result).toMatchObject({ /* expected */ });
  });
  
  it('should handle error case', async () => {
    await expect(service.method(invalidInput))
      .rejects.toThrow('Expected error');
  });
});
```

### Pattern 2: API Endpoint Testing
```typescript
describe('API Endpoint', () => {
  it('should return correct status and data', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', 'Bearer token')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

### Pattern 3: Database Transaction Testing
```typescript
describe('Database Transaction', () => {
  it('should rollback on error', async () => {
    await db.transaction(async (trx) => {
      await service.operation1(trx);
      // Force error
      throw new Error('Test rollback');
    }).catch(() => {});
    
    // Verify rollback
    const result = await db('table').where({ id: 1 });
    expect(result).toHaveLength(0);
  });
});
```

## Monitoring & Debugging

### Agent Monitoring Commands
```bash
# View agent status
./scripts/agent-status.sh

# View agent logs
tail -f /workspace/agents/petshop-10-dev/logs/agent.log

# Check work queue
gh issue list --label needs-dev
gh pr list --label needs-review

# Debug specific agent
docker logs api-agent-10
```

### Performance Monitoring
```bash
# Run performance tests
npm run test:performance

# Check metrics
curl http://localhost:9090/metrics

# View dashboard
open http://localhost:3001/dashboard
```

## Quick Commands Reference

### Development
```bash
npm run dev           # Start development server
npm test             # Run unit tests
npm run test:watch   # Watch mode for TDD
npm run lint         # Check code quality
npm run format       # Format code
```

### Database
```bash
npm run db:migrate      # Run migrations
npm run db:rollback     # Rollback migration
npm run db:seed         # Seed test data
npm run db:reset        # Reset database
```

### Docker
```bash
docker-compose up -d    # Start services
docker-compose logs -f  # View logs
docker-compose down     # Stop services
docker-compose restart  # Restart services
```

### Agent Management
```bash
./scripts/start-agent.sh 10 dev      # Start specific agent
./scripts/stop-agent.sh 10           # Stop specific agent
./scripts/restart-all-agents.sh      # Restart all agents
./scripts/agent-health-check.sh      # Check agent health
```

## Success Metrics

### Week 1 Goals
- [ ] Project structure created
- [ ] Database schema designed
- [ ] CI/CD pipeline running
- [ ] First unit tests passing

### Week 2 Goals
- [ ] Core services implemented
- [ ] 80% unit test coverage
- [ ] Integration tests running
- [ ] API documentation started

### Week 3 Goals
- [ ] All API endpoints working
- [ ] E2E tests implemented
- [ ] Performance benchmarks met
- [ ] Security scan passing

### Week 4 Goals
- [ ] Agents processing issues
- [ ] Automated PR workflow
- [ ] Monitoring dashboard live
- [ ] First features deployed

## Next Steps

1. **Start with TDD**: Write your first failing test
2. **Implement incrementally**: One feature at a time
3. **Deploy early**: Get agents working ASAP
4. **Monitor continuously**: Watch agent performance
5. **Iterate quickly**: Use agent feedback to improve

Remember: **Red → Green → Refactor** is your development cycle!

---

This quick start guide provides everything needed to begin implementing the PetSupplies Shop with TDD and parallel agents. Start small, test everything, and let the agents handle the workflow!