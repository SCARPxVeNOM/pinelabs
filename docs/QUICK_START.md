# Pine Analytics - Quick Start Implementation Guide

## Overview

This guide provides a step-by-step approach to implementing Pine Analytics. Follow these steps in order.

## Phase 1: Backend Core (Tasks 1-13)

### Step 1: Project Setup ✓ COMPLETED
- Created Cargo workspace
- Configured dependencies
- Set up rust-toolchain

### Step 2: Data Models ✓ COMPLETED
- Implemented all state structures in `src/state.rs`
- Created error types in `src/error.rs`
- Added property tests for serialization

### Step 3: Contract Implementation (NEXT)
**File**: `pine-analytics/src/contract.rs`
**Reference**: `docs/contract-implementation.md`

**Implementation checklist**:
- [ ] Copy contract structure from docs
- [ ] Implement Contract trait
- [ ] Add operation handlers (add/remove apps, capture events)
- [ ] Add message handlers (notifications, subscriptions)
- [ ] Add helper methods (validation, indexing, metrics)
- [ ] Add property tests for event capture and deduplication
- [ ] Test WASM compilation

**Key functions to implement**:
1. `instantiate()` - Initialize with admin
2. `execute_operation()` - Handle all operations
3. `execute_message()` - Handle cross-chain messages
4. `add_monitored_app()` - Add app to monitoring
5. `capture_event()` - Store and index events
6. `process_event_for_metrics()` - Extract metrics

### Step 4: Service Implementation
**File**: `pine-analytics/src/service.rs`
**Reference**: `docs/service-implementation.md`

**Implementation checklist**:
- [ ] Copy service structure
- [ ] Implement Service trait
- [ ] Implement QueryRoot (all queries)
- [ ] Implement MutationRoot (mutations)
- [ ] Implement SubscriptionRoot (real-time streams)
- [ ] Add supporting types
- [ ] Test GraphQL queries

**Key queries to implement**:
1. `monitored_applications` - List apps
2. `events` - Query events with filters
3. `time_series` - Time-bucketed metrics
4. `compare_applications` - Cross-app comparison

### Step 5: Property Tests for Backend
**Files**: Add to `pine-analytics/src/tests.rs`

**Tests to implement**:
- [ ] Event data completeness (Property 1)
- [ ] Subscription establishment (Property 2)
- [ ] Concurrent monitoring (Property 4)
- [ ] Deduplication idempotency (Property 7)
- [ ] Configuration validation (Property 20)
- [ ] Time range filtering (Property 10)
- [ ] Application filtering (Property 11)
- [ ] Pagination correctness (Property 9)

## Phase 2: Frontend (Tasks 14-22)

### Step 6: Frontend Setup
**Directory**: `frontend/`

**Setup checklist**:
- [ ] Create Vite + React + TypeScript project
- [ ] Install dependencies (Apollo Client, Recharts, Tailwind)
- [ ] Configure Tailwind CSS
- [ ] Set up Apollo Client
- [ ] Create project structure

**Commands**:
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install @apollo/client graphql recharts lucide-react date-fns
npm install -D tailwindcss autoprefixer postcss
npx tailwindcss init -p
```

### Step 7: Core Components
**Files to create**:
1. `src/components/Dashboard.tsx` - Main dashboard
2. `src/components/Header.tsx` - App header
3. `src/components/ApplicationSelector.tsx` - App picker
4. `src/components/MetricsOverview.tsx` - Metrics cards
5. `src/components/TimeSeriesChart.tsx` - Charts
6. `src/components/EventStream.tsx` - Real-time events
7. `src/components/ComparisonView.tsx` - App comparison

### Step 8: GraphQL Integration
**File**: `src/graphql/queries.ts`

**Queries to define**:
```typescript
export const MONITORED_APPS_QUERY = gql`
  query MonitoredApplications {
    monitoredApplications {
      applicationId
      chainId
      graphqlEndpoint
      enabled
    }
  }
`;

export const EVENTS_QUERY = gql`
  query Events($filters: EventFilters, $pagination: Pagination) {
    events(filters: $filters, pagination: $pagination) {
      events {
        id
        sourceApp
        timestamp
        eventType
        data
      }
      totalCount
      hasMore
    }
  }
`;

export const TIME_SERIES_QUERY = gql`
  query TimeSeries($metric: String!, $timeRange: TimeRange!, $granularity: TimeGranularity!) {
    timeSeries(metric: $metric, timeRange: $timeRange, granularity: $granularity) {
      timestamp
      value
    }
  }
`;
```

## Phase 3: Advanced Features (Tasks 23-27)

### Step 9: Performance Optimizations
- [ ] Implement connection pooling
- [ ] Add event batching
- [ ] Create LRU cache
- [ ] Add query result caching

### Step 10: Auto-Detection
- [ ] Define integration pattern
- [ ] Implement auto-detection logic
- [ ] Create integration docs

### Step 11: Monitoring
- [ ] Add system metrics tracking
- [ ] Implement health check endpoint
- [ ] Create metrics dashboard

## Phase 4: Deployment (Task 26)

### Step 12: Build Scripts
**File**: `scripts/build.sh`

```bash
#!/bin/bash
set -e

echo "Building Pine Analytics..."

# Build contract
cd pine-analytics
cargo build --release --target wasm32-unknown-unknown

# Build frontend
cd ../frontend
npm run build

echo "Build complete!"
```

### Step 13: Deployment Script
**File**: `scripts/deploy.sh`

```bash
#!/bin/bash
set -e

# Publish bytecode
BYTECODE_ID=$(linera publish-bytecode \
  target/wasm32-unknown-unknown/release/pine_analytics_contract.wasm \
  target/wasm32-unknown-unknown/release/pine_analytics_service.wasm)

echo "Bytecode ID: $BYTECODE_ID"

# Create application
APP_ID=$(linera create-application $BYTECODE_ID \
  --json-argument '{"admin_owner": "'$ADMIN_OWNER'"}')

echo "Application ID: $APP_ID"

# Start service
linera service --port 8080
```

## Testing Strategy

### Unit Tests
Run after each component:
```bash
cargo test
```

### Property Tests
Run all property tests:
```bash
cargo test --release -- --test-threads=1
```

### Integration Tests
Test end-to-end:
```bash
# Start service
linera service --port 8080

# Run frontend
cd frontend && npm run dev

# Test in browser
open http://localhost:5173
```

## Common Issues & Solutions

### Issue: WASM compilation fails
**Solution**: Ensure wasm32-unknown-unknown target is installed:
```bash
rustup target add wasm32-unknown-unknown
```

### Issue: GraphQL queries fail
**Solution**: Check service is running and endpoint is correct:
```bash
curl http://localhost:8080/health
```

### Issue: Frontend can't connect
**Solution**: Update Apollo Client endpoint in `src/main.tsx`:
```typescript
const client = new ApolloClient({
  uri: 'http://localhost:8080/graphql',
  cache: new InMemoryCache(),
});
```

## Next Steps

1. **Start with contract**: Implement `contract.rs` using the pseudocode
2. **Test contract**: Write and run property tests
3. **Implement service**: Add GraphQL layer
4. **Build frontend**: Create React components
5. **Deploy**: Use deployment scripts
6. **Monitor**: Track metrics and health

## Resources

- **Contract pseudocode**: `docs/contract-implementation.md`
- **Service pseudocode**: `docs/service-implementation.md`
- **Linera docs**: https://linera.io/docs
- **GraphQL docs**: https://async-graphql.github.io/
- **React docs**: https://react.dev/

## Support

If you encounter issues:
1. Check the pseudocode in `docs/`
2. Review error messages carefully
3. Test components individually
4. Use `log::debug!()` for troubleshooting
