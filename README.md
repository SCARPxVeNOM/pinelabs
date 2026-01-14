# Pine Analytics - Blockchain Analytics Platform

A full-stack blockchain analytics platform built on Linera that captures, aggregates, and interprets on-chain data in real time.

## 🎯 Overview

Pine Analytics provides:
- **Real-time data capture** from Linera applications
- **Comprehensive aggregation** and metric extraction
- **AI-readable data layer** with GraphQL API
- **Interactive dashboards** for visualization
- **Cross-application comparison** and analysis

## 📁 Project Structure

```
pine/
├── pine-analytics/          # Rust backend (contract + service)
│   ├── src/
│   │   ├── contract.rs     # Smart contract logic
│   │   ├── service.rs      # GraphQL service
│   │   ├── state.rs        # Data models
│   │   ├── error.rs        # Error types
│   │   ├── lib.rs          # Library exports
│   │   └── tests.rs        # Property-based tests
│   └── Cargo.toml
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── graphql/        # GraphQL queries
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utilities
│   └── package.json
├── docs/                    # Implementation guides
│   ├── contract-implementation.md
│   ├── service-implementation.md
│   ├── frontend-implementation.md
│   ├── testing-guide.md
│   ├── deployment-guide.md
│   └── QUICK_START.md
├── scripts/                 # Build and deployment scripts
│   ├── build.sh
│   ├── deploy.sh
│   └── run.sh
└── .kiro/specs/            # Specification documents
    └── pine-analytics/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

## 🚀 Quick Start

### Prerequisites

- Rust 1.86.0
- Node.js 18+
- Linera CLI 0.15.7
- wasm32-unknown-unknown target

### Installation (WSL/Linux/macOS)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup toolchain install 1.86.0
rustup target add wasm32-unknown-unknown

# Install Linera CLI
cargo install --locked linera-service@0.15.7
```

### One-command run (recommended)

```bash
# Builds backend WASM + frontend, deploys with Linera, starts GraphQL service,
# and runs the frontend dev server.
chmod +x scripts/run.sh
./scripts/run.sh
```

By default:
- **Backend GraphQL**: `http://localhost:8080/graphql`
- **Backend health**: `http://localhost:8080/health`
- **Frontend**: `http://localhost:5173`

You can override:

```bash
export WALLET=1
export PORT=8080
./scripts/run.sh
```

## 📚 Documentation

### Implementation Guides

1. **[Quick Start Guide](docs/QUICK_START.md)** - Get started quickly
2. **[Contract Implementation](docs/contract-implementation.md)** - Complete contract pseudocode
3. **[Service Implementation](docs/service-implementation.md)** - GraphQL service guide
4. **[Frontend Implementation](docs/frontend-implementation.md)** - React components guide
5. **[Testing Guide](docs/testing-guide.md)** - Property-based testing
6. **[Deployment Guide](docs/deployment-guide.md)** - Production deployment

### Specification Documents

- **[Requirements](.kiro/specs/pine-analytics/requirements.md)** - 10 user stories, 50 acceptance criteria
- **[Design](.kiro/specs/pine-analytics/design.md)** - Architecture, components, 32 correctness properties
- **[Tasks](.kiro/specs/pine-analytics/tasks.md)** - 28 implementation tasks

## 🏗️ Architecture

### Backend (Linera)

```
┌─────────────────────────────────────┐
│     Analytics Contract              │
│  - Event capture                    │
│  - Configuration management         │
│  - Metric aggregation               │
│  - Cross-chain messaging            │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│     Analytics Service               │
│  - GraphQL queries                  │
│  - Real-time subscriptions          │
│  - Data filtering & pagination      │
│  - Time-series aggregation          │
└─────────────────────────────────────┘
```

### Frontend (React)

```
┌─────────────────────────────────────┐
│         Dashboard                   │
│  ┌─────────────┐  ┌──────────────┐ │
│  │  Metrics    │  │  Time Series │ │
│  │  Overview   │  │  Charts      │ │
│  └─────────────┘  └──────────────┘ │
│  ┌─────────────┐  ┌──────────────┐ │
│  │  Event      │  │  Comparison  │ │
│  │  Stream     │  │  View        │ │
│  └─────────────┘  └──────────────┘ │
└─────────────────────────────────────┘
```

## 🔑 Key Features

### Data Capture
- Real-time event monitoring
- Transaction tracking
- Automatic deduplication
- Cross-chain message handling

### Aggregation
- Custom metric definitions
- Multiple aggregation types (sum, avg, count, min, max)
- Time-series bucketing
- Application-specific metrics

### Querying
- GraphQL API
- Flexible filtering
- Pagination support
- Real-time subscriptions

### Visualization
- Interactive dashboards
- Time-series charts
- Live event streams
- Cross-application comparison

## 🧪 Testing

### Run Tests

```bash
# All tests
cargo test

# Property tests only
cargo test --test proptest

# With more iterations
PROPTEST_CASES=1000 cargo test

# Specific test
cargo test test_event_data_completeness
```

### Test Coverage

- 32 property-based tests
- Event capture and storage
- Filtering and pagination
- Metric aggregation
- Configuration management
- Data persistence

## 📊 Usage Examples

### Add Monitored Application

```graphql
mutation {
  addMonitoredApplication(
    applicationId: "my-app"
    chainId: "chain-123"
    graphqlEndpoint: "http://localhost:8081/graphql"
  ) {
    applicationId
    enabled
  }
}
```

### Query Events

```graphql
query {
  events(
    filters: {
      applicationIds: ["my-app"]
      timeRange: { start: 1234567890, end: 1234567999 }
    }
    pagination: { offset: 0, limit: 100 }
  ) {
    events {
      id
      eventType
      timestamp
      data
    }
    totalCount
    hasMore
  }
}
```

### Subscribe to Events

```graphql
subscription {
  eventStream(filters: { applicationIds: ["my-app"] }) {
    id
    eventType
    timestamp
    data
  }
}
```

### Compare Applications

```graphql
query {
  compareApplications(
    applicationIds: ["app1", "app2", "app3"]
    metrics: ["event_count", "active_users"]
  ) {
    applications
    relativePerformance
  }
}
```

## 🔧 Configuration

### Backend (config.json)

```json
{
  "analytics": {
    "chain_id": "YOUR_CHAIN_ID",
    "application_id": "YOUR_APP_ID",
    "admin_owner": "YOUR_OWNER_ADDRESS"
  },
  "monitoring": {
    "poll_interval_ms": 1000,
    "max_events_per_query": 1000,
    "cache_size_mb": 512
  }
}
```

### Frontend (.env)

```bash
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/graphql
VITE_WS_ENDPOINT=ws://localhost:8080/graphql
VITE_APP_ID=YOUR_APP_ID
```

## 🚦 Status

### Completed ✅
- ✅ Project structure and dependencies
- ✅ Core data models and state (`AnalyticsState`, `Event`, `MetricDefinition`)
- ✅ Contract implementation (`contract.rs`) with event capture and configuration
- ✅ Service implementation (`service.rs`) with GraphQL API
- ✅ Frontend components (Dashboard, MetricsOverview, TimeSeriesChart, EventStream, ComparisonView)
- ✅ Property-based tests for serialization and data integrity
- ✅ Build and deployment scripts (`build.sh`, `deploy.sh`, `deploy-testnet.sh`)
- ✅ WASM compilation and Linera integration
- ✅ Application management panel (add/remove monitored applications)
- ✅ Real-time metrics visualization
- ✅ Time-series charts with multiple granularities
- ✅ Cross-application comparison features

### Recent Improvements 🎉
- ✅ Fixed admin owner parsing to support flexible address formats
- ✅ Enhanced frontend with comprehensive application management
- ✅ Improved error handling and user feedback
- ✅ Optimized WASM build process
- ✅ Added deployment scripts for both local and testnet environments

### Planned 📋
- Advanced analytics features (ML-based insights)
- Enhanced visualizations (heatmaps, network graphs)
- Performance optimizations (caching, indexing)
- Export functionality (CSV, JSON)

## 📖 Implementation Steps

Follow these steps to implement Pine Analytics:

1. **Read the Quick Start** - `docs/QUICK_START.md`
2. **Implement Contract** - Follow `docs/contract-implementation.md`
3. **Implement Service** - Follow `docs/service-implementation.md`
4. **Build Frontend** - Follow `docs/frontend-implementation.md`
5. **Write Tests** - Follow `docs/testing-guide.md`
6. **Deploy** - Follow `docs/deployment-guide.md`

## 🤝 Contributing

1. Read the specification documents in `.kiro/specs/pine-analytics/`
2. Follow the implementation guides in `docs/`
3. Write property-based tests for new features
4. Update documentation as needed

## 📝 License

MIT License - See LICENSE file for details

## 🚀 Deployment

### Local Development

```bash
chmod +x scripts/run.sh
./scripts/run.sh
```

For detailed scripts usage, see [scripts/README.md](scripts/README.md).

## 🔗 Resources

- [Linera Documentation](https://linera.io/docs)
- [Async-GraphQL](https://async-graphql.github.io/)
- [React Documentation](https://react.dev/)
- [PropTest](https://github.com/proptest-rs/proptest)

## 💬 Support

For questions or issues:
1. Check the documentation in `docs/`
2. Review the specification in `.kiro/specs/pine-analytics/`
3. Test with the provided examples
4. Check logs and health endpoints

---

**Built with ❤️ using Linera, Rust, and React**
