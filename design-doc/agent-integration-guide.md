# PetSupplies Shop - Agent Integration Guide

## Overview

This guide describes how the PetSupplies Shop integrates with the Parallel Claude Agents Orchestration Framework. Multiple agents work simultaneously on different aspects of the application, following Test-Driven Development practices.

## Agent Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│                  petshop/petshop-app                     │
└─────────────────────────────────────────────────────────┘
                            │
    ┌───────────────────────┼───────────────────────────┐
    │                       │                           │
┌───▼──────────┐    ┌───────▼────────┐        ┌────────▼────────┐
│ DEV Agents   │    │ REVIEWER Agents│        │ MERGER Agents   │
│ (10-50)      │    │ (60-79)        │        │ (80-89)         │
│              │    │                │        │                 │
│ Fix Issues   │    │ Review PRs     │        │ Validate Merges │
│ Implement    │    │ Run Tests      │        │ Full Test Suite │
│ Features     │    │ Code Quality   │        │ Deploy Ready    │
└──────────────┘    └────────────────┘        └─────────────────┘
    │                       │                           │
    └───────────────────────┼───────────────────────────┘
                            │
                ┌───────────▼──────────────┐
                │   Shared PostgreSQL      │
                │   Agent Namespaces       │
                │   - petshop_agent_10     │
                │   - petshop_agent_11     │
                │   - petshop_agent_60     │
                └──────────────────────────┘
```

## Agent-Specific Configuration

### 1. Development Agent Setup (IDs: 10-50)

Each DEV agent has its own isolated environment:

```bash
# Directory: /workspace/agents/petshop-10-dev/

# .env.agent configuration
AGENT_ID=10
AGENT_TYPE=dev

# Service Ports (concatenated)
API_PORT=808010
FRONTEND_PORT=300010
REDIS_PORT=637910
WEBSOCKET_PORT=900010

# Database
DB_NAME=petshop_agent_10

# Test Environment
TEST_DB_NAME=petshop_test_agent_10
```

### 2. Agent Workflow Labels

The PetShop uses specific GitHub labels for work coordination:

```yaml
# Issue/PR Labels
needs-dev:        Work ready for development
needs-review:     PR ready for code review
needs-merge:      PR approved, needs final validation
needs-human:      Blocked, requires human intervention
can-merge:        All tests pass, ready to merge

# Agent Assignment Labels
agent-dev:10:     Claimed by DEV agent 10
agent-reviewer:60: Claimed by REVIEWER agent 60
agent-merger:80:   Claimed by MERGER agent 80

# Feature Labels
feature:product:   Product catalog features
feature:order:     Order management features
feature:user:      User management features
bug:critical:      Critical bugs (priority)
enhancement:       Improvements to existing features
```

## Agent Task Definitions

### 1. DEV Agent Tasks

#### Fix Issue Command
```markdown
# .claude-commands/fix-issue.md
---
name: fix-issue
description: Fix a GitHub issue for PetShop
---

## Context
You are DEV Agent {{AGENT_ID}} working on the PetShop application.
Your environment uses ports concatenated with your agent ID.

## Task: Fix Issue #{{issue_number}}

### Pre-Implementation
1. Read issue description and acceptance criteria
2. Check related issues and PRs
3. Identify affected modules

### TDD Implementation
1. Write failing tests first:
   - Unit tests for business logic
   - Integration tests for API endpoints
   - E2E tests for user flows (if applicable)
   
2. Implement the fix:
   - Follow existing code patterns
   - Use established libraries
   - Maintain consistent style
   
3. Verify all tests pass:
   ```bash
   npm test                    # Unit tests
   npm run test:integration    # Integration tests
   npm run test:e2e           # E2E tests (if needed)
   ```

### Code Quality
1. Run linters:
   ```bash
   npm run lint
   npm run format:check
   ```

2. Check test coverage:
   ```bash
   npm run test:coverage
   # Ensure coverage doesn't decrease
   ```

### Documentation
1. Update API documentation if endpoints changed
2. Update README if setup changed
3. Add migration notes if database changed

### Git Workflow
1. Create feature branch:
   ```bash
   git checkout -b a{{AGENT_ID}}-fix-issue-{{issue_number}}
   ```

2. Commit with descriptive message:
   ```bash
   git commit -m "fix: [Module] Description of fix

   - Detail 1
   - Detail 2
   
   Fixes #{{issue_number}}"
   ```

3. Push and create PR:
   ```bash
   git push -u origin a{{AGENT_ID}}-fix-issue-{{issue_number}}
   gh pr create --title "Fix: Description" --body "..."
   ```

### Label Management
1. Remove `needs-dev`
2. Add `needs-review`
3. Keep `agent-dev:{{AGENT_ID}}`
```

#### Implement Feature Command
```markdown
# .claude-commands/implement-feature.md
---
name: implement-feature
description: Implement a new feature for PetShop
---

## Task: Implement Feature from Issue #{{issue_number}}

### Analysis Phase
1. Break down feature into components:
   - API endpoints needed
   - Database schema changes
   - Frontend components
   - Business logic services
   
2. Create implementation plan with subtasks

### TDD Development Cycle

#### Step 1: Database Schema (if needed)
```typescript
// Write migration test first
describe('Migration: Add pet profiles', () => {
  it('should create pet_profiles table', async () => {
    await runMigration('add-pet-profiles');
    const table = await db.schema.hasTable('pet_profiles');
    expect(table).toBe(true);
  });
});

// Then create migration
exports.up = function(knex) {
  return knex.schema.createTable('pet_profiles', table => {
    table.uuid('id').primary();
    table.uuid('user_id').references('users.id');
    table.string('name').notNullable();
    table.enum('type', ['dog', 'cat', 'bird', 'fish']);
    table.timestamps(true, true);
  });
};
```

#### Step 2: Service Layer
```typescript
// Test first
describe('PetProfileService', () => {
  it('should create pet profile for user', async () => {
    const profile = await petProfileService.create({
      userId: 'user-123',
      name: 'Buddy',
      type: 'dog'
    });
    expect(profile.id).toBeDefined();
  });
});

// Then implement
class PetProfileService {
  async create(data: CreatePetProfileDto) {
    // Implementation
  }
}
```

#### Step 3: API Endpoints
```typescript
// Test first
describe('POST /api/users/pets', () => {
  it('should create pet profile', async () => {
    const response = await request(app)
      .post('/api/users/pets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Buddy', type: 'dog' });
    
    expect(response.status).toBe(201);
  });
});

// Then implement route
router.post('/users/pets', authenticate, async (req, res) => {
  // Implementation
});
```

#### Step 4: Integration Testing
```typescript
describe('Pet Profile Feature Integration', () => {
  it('should handle complete pet profile flow', async () => {
    // Create user
    const user = await createTestUser();
    
    // Add pet profile
    const pet = await petProfileService.create({
      userId: user.id,
      name: 'Max',
      type: 'dog'
    });
    
    // Get personalized recommendations
    const recommendations = await recommendationService
      .getForPet(pet.id);
    
    expect(recommendations).toContainEqual(
      expect.objectContaining({ category: 'dog-food' })
    );
  });
});
```

### Performance Considerations
1. Add database indexes for new queries
2. Implement caching strategy
3. Consider pagination for list endpoints
4. Add rate limiting if needed

### Security Checks
1. Input validation
2. Authorization checks
3. SQL injection prevention
4. XSS protection
```

### 2. REVIEWER Agent Tasks

```markdown
# .claude-commands/review-pr.md
---
name: review-pr
description: Review a pull request for PetShop
---

## Task: Review PR #{{pr_number}}

### Setup Review Environment
```bash
# Fetch PR branch
gh pr checkout {{pr_number}}

# Install dependencies if changed
npm ci

# Run database migrations
npm run db:migrate
```

### Code Review Checklist

#### 1. Code Quality
- [ ] Follows project coding standards
- [ ] No commented-out code
- [ ] Meaningful variable/function names
- [ ] DRY principle followed
- [ ] SOLID principles applied

#### 2. Test Coverage
```bash
# Check test coverage
npm run test:coverage

# Verify coverage hasn't decreased
# Minimum thresholds:
# - Statements: 80%
# - Branches: 80%
# - Functions: 80%
# - Lines: 80%
```

#### 3. TDD Verification
- [ ] Tests were written before implementation
- [ ] Tests cover happy path and edge cases
- [ ] Tests are independent and isolated
- [ ] No skipped tests without justification

#### 4. Security Review
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] SQL injection prevention
- [ ] Proper authentication/authorization
- [ ] Rate limiting on public endpoints

#### 5. Performance Review
- [ ] No N+1 query problems
- [ ] Appropriate database indexes
- [ ] Caching implemented where needed
- [ ] Pagination for large datasets

#### 6. API Contract
- [ ] Backwards compatible changes
- [ ] OpenAPI documentation updated
- [ ] Response format consistent
- [ ] Error handling standardized

### Run Test Suites
```bash
# Unit tests
npm test

# Integration tests  
npm run test:integration

# E2E tests for affected flows
npm run test:e2e -- --grep "{{affected_feature}}"

# Performance tests
npm run test:performance
```

### Database Review
```bash
# Check for migrations
npm run db:migrate:status

# Verify rollback works
npm run db:rollback
npm run db:migrate
```

### Manual Testing
1. Start services:
   ```bash
   docker-compose up -d
   npm run dev
   ```

2. Test affected endpoints:
   ```bash
   # Use agent's ports
   curl http://localhost:{{API_PORT}}/api/health
   ```

3. Test frontend if changed:
   ```bash
   open http://localhost:{{FRONTEND_PORT}}
   ```

### Review Decision
If all checks pass:
- Remove `needs-review`
- Add `needs-merge`
- Approve PR with comments

If issues found:
- Request changes with specific feedback
- Remove `needs-review`
- Add `needs-dev`
- Document required fixes
```

### 3. MERGER Agent Tasks

```markdown
# .claude-commands/merge-pr.md
---
name: merge-pr
description: Validate and merge PR for PetShop
---

## Task: Validate PR #{{pr_number}} for Merge

### Pre-Merge Validation

#### 1. Full Test Suite
```bash
# Run complete test suite
npm run test:all

# Expected output:
# - All tests passing
# - Coverage meets thresholds
# - No test timeouts
```

#### 2. Build Verification
```bash
# Production build
npm run build

# Verify build size
npm run build:analyze
# Check for unexpected size increases
```

#### 3. Database Migration Check
```bash
# Test migration on fresh database
npm run db:reset
npm run db:migrate
npm run db:seed

# Verify rollback
npm run db:rollback
npm run db:migrate
```

#### 4. Integration Test with All Services
```bash
# Start all services
docker-compose up -d

# Wait for health checks
npm run wait:services

# Run integration suite
npm run test:integration:full

# Run smoke tests
npm run test:smoke
```

#### 5. Performance Regression Check
```bash
# Run performance benchmarks
npm run benchmark

# Compare with baseline
npm run benchmark:compare
```

#### 6. Security Scan
```bash
# Dependency vulnerabilities
npm audit

# Code security scan
npm run security:scan
```

### Load Testing
```bash
# Start application
npm run start:production

# Run load tests
npm run test:load

# Verify metrics:
# - Response time p95 < 500ms
# - Error rate < 0.1%
# - Throughput > 100 req/s
```

### Final Checks
1. Verify PR is up to date with main
2. Check for merge conflicts
3. Ensure all CI checks passed
4. Verify no `needs-dev` or `needs-human` labels

### Merge Process
If ALL validations pass:
```bash
# Add can-merge label
gh pr edit {{pr_number}} --add-label "can-merge"

# Post validation results
gh pr comment {{pr_number}} --body "Validation complete. All tests pass."
```

If ANY validation fails:
```bash
# Remove needs-merge
gh pr edit {{pr_number}} --remove-label "needs-merge"

# Add needs-dev
gh pr edit {{pr_number}} --add-label "needs-dev"

# Post detailed failure report
gh pr comment {{pr_number}} --body "[Failure details]"
```
```

## Agent Database Setup

### Database Initialization Script

```sql
-- scripts/init-agent-database.sql

-- Function to create agent database and schema
CREATE OR REPLACE FUNCTION create_agent_database(agent_id INTEGER, agent_type TEXT)
RETURNS void AS $$
DECLARE
    db_name TEXT;
BEGIN
    db_name := 'petshop_agent_' || agent_id;
    
    -- Create database if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = db_name) THEN
        EXECUTE 'CREATE DATABASE ' || quote_ident(db_name);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create databases for all agents
SELECT create_agent_database(10, 'dev');
SELECT create_agent_database(11, 'dev');
SELECT create_agent_database(12, 'dev');
SELECT create_agent_database(60, 'reviewer');
SELECT create_agent_database(61, 'reviewer');
SELECT create_agent_database(80, 'merger');
```

### Database Migration for Each Agent

```javascript
// scripts/migrate-agent-db.js

const knex = require('knex');
const config = require('./knexfile');

async function migrateAgentDatabase(agentId) {
  const dbName = `petshop_agent_${agentId}`;
  
  const db = knex({
    ...config,
    connection: {
      ...config.connection,
      database: dbName
    }
  });
  
  try {
    console.log(`Migrating database for agent ${agentId}...`);
    await db.migrate.latest();
    console.log(`Migration complete for agent ${agentId}`);
  } catch (error) {
    console.error(`Migration failed for agent ${agentId}:`, error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Migrate all agent databases
async function migrateAll() {
  const agents = [10, 11, 12, 60, 61, 80];
  
  for (const agentId of agents) {
    await migrateAgentDatabase(agentId);
  }
}

migrateAll().catch(console.error);
```

## Agent Orchestration Scripts

### Master Orchestrator

```bash
#!/bin/bash
# scripts/orchestrate-petshop.sh

# Configuration
REPO_URL="https://github.com/petshop/petshop-app.git"
BASE_DIR="/workspace/agents"

# Agent pools
DEV_AGENTS=(10 11 12 13 14)
REVIEWER_AGENTS=(60 61 62)
MERGER_AGENTS=(80 81)

# Start shared services
echo "Starting shared PostgreSQL..."
docker-compose -f docker-compose.shared.yml up -d postgres-shared

echo "Waiting for PostgreSQL..."
until docker exec postgres-shared pg_isready; do
  sleep 2
done

# Initialize agent databases
echo "Initializing agent databases..."
docker exec postgres-shared psql -U postgres -f /scripts/init-agent-database.sql

# Setup and start agents
setup_agent() {
    local agent_id=$1
    local agent_type=$2
    local dir="${BASE_DIR}/petshop-${agent_id}-${agent_type}"
    
    echo "Setting up ${agent_type} agent ${agent_id}..."
    
    # Clone if needed
    if [ ! -d "$dir" ]; then
        git clone "$REPO_URL" "$dir"
    fi
    
    cd "$dir"
    
    # Create .env.agent
    cat > .env.agent <<EOF
AGENT_ID=${agent_id}
AGENT_TYPE=${agent_type}

# Ports
API_PORT=8080${agent_id}
FRONTEND_PORT=3000${agent_id}
REDIS_PORT=6379${agent_id}
WEBSOCKET_PORT=9000${agent_id}

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=petshop_agent_${agent_id}
DB_USER=postgres
DB_PASSWORD=postgres

# URLs
API_URL=http://localhost:8080${agent_id}
FRONTEND_URL=http://localhost:3000${agent_id}
EOF
    
    # Install dependencies
    npm ci
    
    # Run migrations
    npm run db:migrate
    
    # Start services
    docker-compose up -d
    
    # Start agent
    if [ "$agent_type" = "dev" ]; then
        nohup ./dev-agent.sh > logs/agent.log 2>&1 &
    elif [ "$agent_type" = "reviewer" ]; then
        nohup ./reviewer-agent.sh > logs/agent.log 2>&1 &
    elif [ "$agent_type" = "merger" ]; then
        nohup ./merger-agent.sh > logs/agent.log 2>&1 &
    fi
    
    echo "Agent ${agent_id} started"
}

# Start all agents
for id in "${DEV_AGENTS[@]}"; do
    setup_agent $id "dev" &
done

for id in "${REVIEWER_AGENTS[@]}"; do
    setup_agent $id "reviewer" &
done

for id in "${MERGER_AGENTS[@]}"; do
    setup_agent $id "merger" &
done

wait

echo "All agents started successfully!"
```

## Monitoring Dashboard

### Agent Activity Monitor

```typescript
// monitoring/agent-dashboard.ts

interface AgentMetrics {
  agentId: number;
  type: 'dev' | 'reviewer' | 'merger';
  status: 'active' | 'idle' | 'blocked';
  currentTask?: {
    type: 'issue' | 'pr';
    number: number;
    startedAt: Date;
    duration: number;
  };
  stats: {
    tasksCompleted: number;
    tasksFaile: number;
    averageTime: number;
    successRate: number;
  };
  health: {
    cpu: number;
    memory: number;
    diskUsage: number;
  };
}

class AgentMonitor {
  async getAgentMetrics(agentId: number): Promise<AgentMetrics> {
    const agent = await this.getAgentInfo(agentId);
    const currentTask = await this.getCurrentTask(agentId);
    const stats = await this.getAgentStats(agentId);
    const health = await this.getAgentHealth(agentId);
    
    return {
      agentId,
      type: agent.type,
      status: currentTask ? 'active' : 'idle',
      currentTask,
      stats,
      health
    };
  }
  
  async getDashboard(): Promise<DashboardData> {
    const agents = await Promise.all(
      ALL_AGENTS.map(id => this.getAgentMetrics(id))
    );
    
    return {
      agents,
      queue: {
        needsDev: await this.getIssueCount('needs-dev'),
        needsReview: await this.getIssueCount('needs-review'),
        needsMerge: await this.getIssueCount('needs-merge'),
        blocked: await this.getIssueCount('needs-human')
      },
      throughput: {
        hourly: await this.getThroughput('1h'),
        daily: await this.getThroughput('24h'),
        weekly: await this.getThroughput('7d')
      }
    };
  }
}
```

### Real-time Metrics Display

```html
<!-- monitoring/dashboard.html -->
<!DOCTYPE html>
<html>
<head>
    <title>PetShop Agent Dashboard</title>
    <style>
        .agent-card {
            border: 1px solid #ccc;
            padding: 10px;
            margin: 10px;
            border-radius: 5px;
        }
        .status-active { background: #90EE90; }
        .status-idle { background: #FFE4B5; }
        .status-blocked { background: #FFB6C1; }
    </style>
</head>
<body>
    <h1>PetShop Agent Dashboard</h1>
    
    <div id="queue-status">
        <h2>Work Queue</h2>
        <div>Needs Dev: <span id="needs-dev">0</span></div>
        <div>Needs Review: <span id="needs-review">0</span></div>
        <div>Needs Merge: <span id="needs-merge">0</span></div>
        <div>Blocked: <span id="blocked">0</span></div>
    </div>
    
    <div id="agents">
        <h2>Active Agents</h2>
        <!-- Agent cards dynamically inserted here -->
    </div>
    
    <script>
        async function updateDashboard() {
            const response = await fetch('/api/monitoring/dashboard');
            const data = await response.json();
            
            // Update queue status
            document.getElementById('needs-dev').textContent = data.queue.needsDev;
            document.getElementById('needs-review').textContent = data.queue.needsReview;
            document.getElementById('needs-merge').textContent = data.queue.needsMerge;
            document.getElementById('blocked').textContent = data.queue.blocked;
            
            // Update agent cards
            const agentsDiv = document.getElementById('agents');
            agentsDiv.innerHTML = data.agents.map(agent => `
                <div class="agent-card status-${agent.status}">
                    <h3>Agent ${agent.agentId} (${agent.type})</h3>
                    <div>Status: ${agent.status}</div>
                    ${agent.currentTask ? `
                        <div>Working on: ${agent.currentTask.type} #${agent.currentTask.number}</div>
                        <div>Duration: ${Math.round(agent.currentTask.duration / 60)} min</div>
                    ` : ''}
                    <div>Success Rate: ${agent.stats.successRate}%</div>
                    <div>CPU: ${agent.health.cpu}% | RAM: ${agent.health.memory}%</div>
                </div>
            `).join('');
        }
        
        // Update every 10 seconds
        setInterval(updateDashboard, 10000);
        updateDashboard();
    </script>
</body>
</html>
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Agent Can't Connect to Database
```bash
# Check database exists
psql -U postgres -c "SELECT datname FROM pg_database WHERE datname LIKE 'petshop_agent_%';"

# Create if missing
psql -U postgres -c "CREATE DATABASE petshop_agent_${AGENT_ID};"

# Run migrations
npm run db:migrate
```

#### 2. Port Conflicts
```bash
# Find process using port
lsof -i :808010

# Kill process if needed
kill -9 $(lsof -t -i:808010)

# Or use different agent ID
```

#### 3. Test Failures in Agent Environment
```bash
# Check test database
psql -U postgres -c "CREATE DATABASE petshop_test_agent_${AGENT_ID};"

# Reset test data
npm run test:db:reset

# Run tests with debug
DEBUG=* npm test
```

#### 4. Agent Stuck on Task
```bash
# Check agent logs
tail -f logs/agent-${AGENT_ID}.log

# Check GitHub labels
gh issue view ${ISSUE_NUMBER} --json labels

# Manually intervene
gh issue edit ${ISSUE_NUMBER} --remove-label "agent-dev:${AGENT_ID}" --add-label "needs-human"
```

## Performance Optimization

### Agent Resource Allocation

```yaml
# docker-compose.agent.yml
version: '3.8'

services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G

  frontend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
          
  redis:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Caching Strategy for Agents

```javascript
// config/cache.agent.js

module.exports = {
  // Agent-specific cache keys
  productCache: {
    key: `agent:${process.env.AGENT_ID}:products`,
    ttl: 3600
  },
  
  testCache: {
    key: `agent:${process.env.AGENT_ID}:test-results`,
    ttl: 1800
  },
  
  buildCache: {
    key: `agent:${process.env.AGENT_ID}:build`,
    ttl: 7200
  }
};
```

## Summary

The PetSupplies Shop is fully integrated with the Parallel Claude Agents Framework, enabling:

1. **Parallel Development**: Multiple agents work on different features simultaneously
2. **TDD Enforcement**: All agents follow test-first development
3. **Quality Gates**: Review and merge agents ensure code quality
4. **Isolated Environments**: Each agent has its own ports and database
5. **Automated Workflow**: From issue to production without human intervention
6. **Monitoring**: Real-time visibility into agent activity and performance

This integration enables rapid, high-quality development of the PetSupplies Shop while maintaining code quality and system stability.