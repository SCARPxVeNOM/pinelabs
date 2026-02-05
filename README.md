<p align="center">
  <img src="docs/assets/pine-logo.png" alt="Pine Analytics" width="120" />
</p>

<h1 align="center">🌲 Pine Analytics</h1>

<p align="center">
  <strong>Real-time Blockchain Analytics Platform powered by Linera Microchains</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-smart-contracts">Smart Contracts</a> •
  <a href="#-linera-integration">Linera</a> •
  <a href="#-api">API</a>
</p>

---

## 🎯 Overview

Pine Analytics is a **full-stack blockchain analytics platform** built on [Linera](https://linera.io) that captures, aggregates, and interprets on-chain data in real time. It leverages Linera's unique microchain architecture to provide:

- **Horizontal Scalability** — Each user gets their own microchain
- **Sub-second Finality** — Real-time data processing
- **Cross-chain Messaging** — Aggregate data across multiple chains
- **AI-ready Data Layer** — Structured GraphQL API for analytics

## ✨ Features

### 🔥 Core Analytics
| Feature | Description |
|---------|-------------|
| **Real-time Event Capture** | Sub-second ingestion from Linera applications |
| **Custom Metrics** | Define and track any metric with aggregation types |
| **Time-series Analysis** | Bucketed data with configurable granularity |
| **Anomaly Detection** | Statistical analysis with z-score thresholds |
| **Moving Averages** | SMA and EMA calculations for trend analysis |

### 🔗 Microchain Integration
| Feature | Description |
|---------|-------------|
| **Multi-chain Management** | Monitor multiple chains from one dashboard |
| **Cross-chain Queries** | Aggregate data across chains in parallel |
| **Chain Health Monitoring** | Track sync status and block heights |
| **Cross-chain Messaging** | Sync data between microchains |

### 🛡️ Security & Access Control
| Feature | Description |
|---------|-------------|
| **Role-based Access (RBAC)** | Admin, Operator, Viewer roles |
| **Rate Limiting** | Configurable request throttling |
| **Merkle Indexing** | Cryptographic proof of data integrity |
| **Audit Logging** | Complete operation history |

### 📊 Visualization
| Feature | Description |
|---------|-------------|
| **Premium Dashboard** | Glassmorphism UI with real-time updates |
| **Interactive Charts** | Time-series with multiple views |
| **Cross-chain Comparison** | Side-by-side chain analytics |
| **Live Event Stream** | Real-time event feed |

---

## 🚀 Quick Start

### One Command Run

```bash
# Linux/macOS/WSL
./run-all.sh

# Windows PowerShell
.\run-all.ps1

# With Docker
docker-compose up
```

This will:
1. ✅ Build WASM smart contracts
2. ✅ Deploy to Linera testnet
3. ✅ Start GraphQL service (port 8080)
4. ✅ Start frontend (port 3000)

### Prerequisites

| Tool | Version | Installation |
|------|---------|--------------|
| Rust | 1.86.0 | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Linera CLI | 0.15.7 | `cargo install --locked linera-service@0.15.7` |
| Docker | 20+ | [docker.com](https://docker.com/) (optional) |

### Manual Setup

```bash
# 1. Clone and install dependencies
git clone https://github.com/yourusername/pine-analytics.git
cd pine-analytics
npm install --prefix frontend

# 2. Build WASM contracts
cargo build --release --target wasm32-unknown-unknown -p pine-analytics

# 3. Initialize Linera wallet (testnet)
linera wallet init --with-new-chain --faucet https://faucet.testnet-conway.linera.net/

# 4. Deploy application
cd pine-analytics && linera project publish-and-create && cd ..

# 5. Start services
linera service --port 8080 &
npm run dev --prefix frontend
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PINE ANALYTICS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Frontend   │───▶│   GraphQL    │───▶│  Linera Microchain   │  │
│  │   React+Vite │    │   Service    │    │  Smart Contracts     │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│         │                   │                      │                 │
│         ▼                   ▼                      ▼                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ useChains    │    │ Subscriptions│    │ Cross-chain Sync     │  │
│  │ useLinera    │    │ Mutations    │    │ Merkle Indexing      │  │
│  │ useMetrics   │    │ Queries      │    │ RBAC + Rate Limiting │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
pine/
├── pine-analytics/              # Rust Linera Application
│   ├── src/
│   │   ├── contract.rs         # Smart contract (operations, cross-chain)
│   │   ├── service.rs          # GraphQL service (queries, mutations)
│   │   ├── state.rs            # State management
│   │   ├── rbac.rs             # Role-based access control
│   │   ├── rate_limiting.rs    # Request throttling
│   │   ├── merkle.rs           # Merkle tree indexing
│   │   └── aggregations.rs     # Statistical functions
│   └── Cargo.toml
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── Dashboard.tsx   # Main dashboard
│   │   │   ├── ChainPanel.tsx  # Microchain management
│   │   │   └── WalletButton.tsx# Wallet connection
│   │   ├── hooks/              # React hooks
│   │   │   ├── useChains.ts    # Multi-chain management
│   │   │   └── useLinera.ts    # Linera context
│   │   ├── graphql/            # GraphQL operations
│   │   └── context/            # React contexts
│   └── package.json
├── docker-compose.yaml          # Container orchestration
├── run-all.sh                   # Unified run script (Bash)
├── run-all.ps1                  # Unified run script (PowerShell)
└── README.md
```

---

## 📜 Smart Contracts

### Contract Overview (`contract.rs`)

The Pine Analytics contract handles all on-chain operations:

```rust
// Core Operations
Operation::CaptureEvent { event }      // Ingest analytics events
Operation::AddApplication { app }      // Register monitored apps
Operation::RemoveApplication { id }    // Unregister apps
Operation::DefineMetric { metric }     // Create custom metrics
Operation::UpdateConfig { config }     // Admin configuration

// Cross-chain Messaging
Message::SyncData { events, source }   // Sync events between chains
Message::RequestAggregation { query }  // Distributed aggregation
Message::AggregationResult { data }    // Aggregation response
```

### RBAC System (`rbac.rs`)

```rust
pub enum Role {
    Admin,     // Full access: config, users, data
    Operator,  // Write access: events, metrics
    Viewer,    // Read-only access
}

// Permission checks
rbac.check_permission(owner, Permission::ManageConfig)?;
rbac.check_permission(owner, Permission::WriteEvents)?;
rbac.check_permission(owner, Permission::ReadData)?;
```

### Rate Limiting (`rate_limiting.rs`)

```rust
pub struct RateLimiter {
    requests_per_minute: u32,
    burst_size: u32,
    window_size_ms: u64,
}

// Usage
rate_limiter.check_and_record(operation_type, requester)?;
```

### Merkle Indexing (`merkle.rs`)

```rust
pub struct MerkleIndex {
    root: Hash,
    leaves: Vec<Hash>,
}

// Generate proofs for data integrity
let proof = merkle_index.generate_proof(event_id);
let valid = merkle_index.verify_proof(event_id, &proof);
```

### Aggregations (`aggregations.rs`)

```rust
// Supported aggregation types
pub enum AggregationType {
    Sum, Average, Count, Min, Max,
    Percentile(u8),      // p50, p95, p99
    StandardDeviation,
    MovingAverage(u32),  // Window size
}

// Anomaly detection
detect_anomalies(&data, z_threshold) -> Vec<Anomaly>
```

---

## 🔗 Linera Integration

### Microchain Architecture

Pine Analytics leverages Linera's unique microchain model:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User Chain A   │◄───▶│  User Chain B   │◄───▶│  User Chain C   │
│  (Analytics)    │     │  (Analytics)    │     │  (Analytics)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Cross-chain Queries   │
                    │   Aggregated Metrics    │
                    └─────────────────────────┘
```

### Key Linera Features Used

| Feature | Usage in Pine Analytics |
|---------|------------------------|
| **Microchains** | Each user/org has dedicated analytics chain |
| **Cross-chain Messages** | Sync data and aggregate metrics across chains |
| **GraphQL Service** | Real-time queries and subscriptions |
| **Blob Storage** | Store large event payloads |
| **Testnet Conway** | Production-ready deployment |

### Multi-chain Management (Frontend)

```typescript
// useChains hook provides:
const {
  chains,           // List of available chains
  activeChain,      // Currently selected chain
  crossChainQuery,  // Execute queries across multiple chains
  getChainHealth,   // Check chain sync status
  refreshChains,    // Reload chain list
} = useChains();

// Cross-chain query example
const results = await crossChainQuery(
  ['chain-a', 'chain-b', 'chain-c'],
  `query { metrics { totalEvents } }`
);
```

### Wallet Connection

```typescript
const {
  isConnected,      // Connection status
  chainId,          // Active chain ID
  connect,          // Connect to wallet
  disconnect,       // Disconnect
  refreshBalance,   // Update balance
} = useLinera();
```

---

## 📡 API Reference

### GraphQL Queries

```graphql
# Get monitored applications
query {
  monitoredApplications {
    applicationId
    chainId
    enabled
  }
}

# Query events with filters
query {
  events(
    filters: {
      applicationIds: ["app-1"]
      eventTypes: ["transaction", "transfer"]
      timeRange: { start: 1704067200, end: 1704153600 }
    }
    pagination: { offset: 0, limit: 100 }
  ) {
    events { id, eventType, timestamp, data }
    totalCount
    hasMore
  }
}

# Cross-chain aggregation
query {
  crossChainAggregation(
    targetChains: ["chain-a", "chain-b"]
    metric: "transaction_count"
    aggregationType: SUM
  ) {
    chainId
    value
    timestamp
  }
}

# Anomaly detection
query {
  detectAnomalies(
    applicationId: "my-app"
    metric: "gas_used"
    threshold: 2.5
  ) {
    timestamp
    value
    zScore
    severity
  }
}
```

### GraphQL Mutations

```graphql
# Capture an event
mutation {
  captureEvent(
    applicationId: "my-app"
    eventType: "transaction"
    data: "{ \"amount\": 100 }"
  ) {
    id
    timestamp
  }
}

# Add monitored application
mutation {
  addMonitoredApplication(
    applicationId: "new-app"
    chainId: "chain-xyz"
    graphqlEndpoint: "http://localhost:8081"
  ) {
    applicationId
    enabled
  }
}

# Send cross-chain sync
mutation {
  sendCrossChainSync(
    targetChain: "chain-b"
    events: [...]
  )
}
```

### GraphQL Subscriptions

```graphql
# Real-time event stream
subscription {
  eventStream(filters: { applicationIds: ["my-app"] }) {
    id
    eventType
    timestamp
    data
  }
}

# Chain health updates
subscription {
  chainHealth {
    chainId
    blockHeight
    syncStatus
    lastActivity
  }
}

# Anomaly alerts
subscription {
  anomalyAlerts(applicationIds: ["my-app"]) {
    metric
    value
    zScore
    timestamp
  }
}
```

---

## 🐳 Docker Deployment

### Quick Start with Docker

```bash
# Development mode (hot reload)
docker-compose up

# Production build
docker-compose -f docker-compose.yaml -f docker-compose.prod.yaml up

# Rebuild containers
docker-compose up --build
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | 3000 | React dashboard |
| `linera-service` | 8080 | GraphQL API |
| `nginx` | 80/443 | Reverse proxy (production) |

### Environment Variables

```bash
# Frontend
VITE_GRAPHQL_ENDPOINT=http://localhost:8080
VITE_WS_ENDPOINT=ws://localhost:8080
VITE_LINERA_FAUCET_URL=https://faucet.testnet-conway.linera.net/

# Linera Service
LINERA_PORT=8080
LINERA_NETWORK=testnet-conway
RUST_LOG=info
```

---

## 🧪 Testing

```bash
# Run all tests
cargo test

# Run with more iterations
PROPTEST_CASES=1000 cargo test

# Frontend tests
npm test --prefix frontend
```

### Test Coverage

- ✅ 24 unit tests passing
- ✅ Property-based tests for serialization
- ✅ RBAC permission tests
- ✅ Rate limiting tests
- ✅ Aggregation accuracy tests

---

## 📈 Roadmap

- [ ] Machine learning anomaly detection
- [ ] Advanced visualizations (heatmaps, network graphs)
- [ ] Export functionality (CSV, JSON, Parquet)
- [ ] Multi-tenant SaaS deployment
- [ ] Prometheus/Grafana integration

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- [Linera Documentation](https://linera.io/docs)
- [Linera GitHub](https://github.com/linera-io/linera-protocol)
- [Conway Testnet Faucet](https://faucet.testnet-conway.linera.net/)

---

<p align="center">
  <strong>Built with ❤️ using Linera, Rust, and React</strong>
</p>
