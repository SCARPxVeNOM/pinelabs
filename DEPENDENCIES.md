# Linera Casino - Dependencies & Requirements Documentation

This document provides a comprehensive overview of all dependencies, requirements, and versions used in the Linera Casino project. Use this guide when setting up a new Linera blockchain application.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Core Technologies](#core-technologies)
3. [Rust Dependencies](#rust-dependencies)
4. [Node.js/JavaScript Dependencies](#nodejsjavascript-dependencies)
5. [Linera Protocol Dependencies](#linera-protocol-dependencies)
6. [Build Tools & Compilers](#build-tools--compilers)
7. [Development Tools](#development-tools)
8. [Docker Requirements](#docker-requirements)
9. [Network & Port Configuration](#network--port-configuration)
10. [Installation Commands](#installation-commands)

---

## System Requirements

### Operating System
- **Linux** (Ubuntu 20.04+, Debian 11+, or WSL2 on Windows)
- **macOS** (10.15+)
- **Windows** (with WSL2 recommended, or native with LLVM/Clang)

### Minimum System Resources
- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 10GB free space
- **CPU**: Multi-core processor (4+ cores recommended)

### Required System Packages

#### Linux/Debian/Ubuntu
```bash
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    curl \
    git \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    jq \
    libssl-dev
```

#### macOS
```bash
brew install \
    curl \
    git \
    pkg-config \
    protobuf \
    llvm \
    jq \
    openssl
```

#### Windows (WSL2)
Use the Linux commands above within WSL2.

---

## Core Technologies

### Rust
- **Version**: `1.86.0` (stable)
- **Toolchain File**: `rust-toolchain.toml`
- **Edition**: `2021`
- **Installation**: Via `rustup` (https://rustup.rs/)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install specific version
rustup toolchain install 1.86.0
rustup default 1.86.0
```

### Node.js
- **Version**: LTS (18.x or higher)
- **Package Manager**: `npm` (included with Node.js)
- **Alternative**: `pnpm` (for Croissant extension)

```bash
# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt-get install -y nodejs

# Or using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts
```

### pnpm (Optional but Recommended)
- **Version**: Latest
- **Purpose**: Package manager for Croissant extension

```bash
npm install -g pnpm
```

---

## Rust Dependencies

### Workspace Configuration
- **Cargo Resolver**: `2`
- **Workspace Members**: `abi`, `bankroll`, `poker`, `rummy`, `roulette`
- **Excluded**: `croissant`, `croissant/wasm-client` (separate workspace)

### Core Rust Dependencies

#### Linera SDK
- **Package**: `linera-sdk`
- **Version**: `0.15.7` (must match Testnet Conway)
- **Purpose**: Core SDK for building Linera applications
- **Installation**:
  ```bash
  cargo install --locked linera-service@0.15.7
  cargo install --locked linera-storage-service@0.15.7
  ```

#### Async GraphQL
- **Package**: `async-graphql`
- **Version**: `=7.0.17` (exact version required)
- **Related Packages**:
  - `async-graphql-derive`: `=7.0.17`
  - `async-graphql-value`: `=7.0.17`
  - `async-graphql-parser`: `=7.0.17`
- **Purpose**: GraphQL server implementation for Linera services
- **Note**: Exact version (`=`) is required to avoid compatibility issues

#### Serialization
- **Package**: `serde`
- **Version**: `1.0` (with `derive` feature)
- **Package**: `serde_json`
- **Version**: `1.0`
- **Purpose**: JSON serialization/deserialization

#### Async Runtime
- **Package**: `tokio`
- **Version**: `1.40`
- **Features**: `["rt", "sync"]`
- **Purpose**: Async runtime for Rust

#### Futures
- **Package**: `futures`
- **Version**: `0.3`
- **Purpose**: Async primitives and utilities

#### Random Number Generation
- **Package**: `rand`
- **Version**: `0.8.5`
- **Package**: `getrandom`
- **Version**: `0.2.15`
- **Features**: `["custom"]` (for custom random source)
- **Purpose**: Cryptographically secure random number generation

#### Logging
- **Package**: `log`
- **Version**: `0.4.27`
- **Purpose**: Logging facade

### Project-Specific Rust Packages

#### ABI (Application Binary Interface)
- **Package**: `abi`
- **Version**: `0.2.0`
- **Edition**: `2021`
- **Dependencies**: All workspace dependencies
- **Purpose**: Shared game logic library (poker, rummy, roulette, deck, random)

#### Bankroll
- **Package**: `bankroll`
- **Version**: `0.2.0`
- **Edition**: `2021`
- **Binaries**:
  - `bankroll_contract` (contract.rs)
  - `bankroll_service` (service.rs)
- **Purpose**: Token management and balance tracking

#### Poker
- **Package**: `poker`
- **Version**: `0.2.0`
- **Edition**: `2021`
- **Binaries**:
  - `poker_contract` (contract.rs)
  - `poker_service` (service.rs)
- **Purpose**: Texas Hold'em poker game implementation

#### Rummy
- **Package**: `rummy`
- **Version**: `0.2.0`
- **Edition**: `2021`
- **Binaries**:
  - `rummy_contract` (contract.rs)
  - `rummy_service` (service.rs)
- **Purpose**: Indian Rummy game implementation

#### Roulette
- **Package**: `roulette`
- **Version**: `0.2.0`
- **Edition**: `2021`
- **Binaries**:
  - `roulette_contract` (contract.rs)
  - `roulette_service` (service.rs)
- **Purpose**: European Roulette game implementation

### Rust Build Configuration

#### Release Profile
```toml
[profile.release]
debug = true          # Include debug symbols
lto = true            # Link-time optimization
opt-level = 'z'       # Optimize for size
strip = 'debuginfo'   # Strip debug info
```

#### WebAssembly Target
- **Target**: `wasm32-unknown-unknown`
- **Installation**:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```

---

## Node.js/JavaScript Dependencies

### Frontend Application (`frontend/`)

#### Runtime Dependencies
- **react**: `^18.2.0` - React UI library
- **react-dom**: `^18.2.0` - React DOM renderer
- **@apollo/client**: `^3.8.0` - GraphQL client
- **graphql**: `^16.8.0` - GraphQL query language
- **lucide-react**: `^0.263.1` - Icon library

#### Development Dependencies
- **@types/react**: `^18.2.0` - TypeScript types for React
- **@types/react-dom**: `^18.2.0` - TypeScript types for React DOM
- **@vitejs/plugin-react**: `^4.0.0` - Vite React plugin
- **typescript**: `^5.0.0` - TypeScript compiler
- **vite**: `^4.4.0` - Build tool and dev server
- **tailwindcss**: `^3.4.19` - CSS framework
- **autoprefixer**: `^10.4.22` - CSS post-processor
- **postcss**: `^8.5.6` - CSS transformer

#### TypeScript Configuration
- **Target**: `ES2020`
- **Module**: `ESNext`
- **JSX**: `react-jsx`
- **Module Resolution**: `bundler`

### Croissant Extension (`croissant/`)

#### Root Workspace
- **Package Manager**: `pnpm` (workspace)
- **Workspaces**: `wasm-client`, `web`
- **Dependencies**:
  - `lucide-react`: `^0.488.0`

#### WASM Client (`croissant/wasm-client/`)

**Rust Toolchain**:
- **Channel**: `nightly-2025-03-21`
- **Components**: `["clippy", "rustfmt", "rust-src"]`
- **Targets**: `["wasm32-unknown-unknown"]`
- **Profile**: `minimal`

**Rust Dependencies** (WASM-specific):
- `wasm-bindgen`: `0.2.100`
- `wasm-bindgen-futures`: `0.4.50`
- `js-sys`: `0.3`
- `web-sys`: `0.3` (features: `["console", "Window"]`)
- `serde-wasm-bindgen`: `0.6.5`
- `console_error_panic_hook`: `0.1.6`
- `tokio`: `1.48.0`
- `tokio-util`: `0.7.15`
- `futures`: `0.3.30`
- `serde`: `1.0.205`
- `serde_json`: `1.0.120`
- `log`: `0.4.21`
- `tracing`: `0.1.40` (features: `["release_max_level_debug"]`)
- `tracing-web`: `0.1.3`
- `tracing-subscriber`: `0.3.22`
- `tsify`: `0.5.5`
- `rexie`: `0.6.2` (IndexedDB wrapper)
- `async-trait`: `0.1.89`
- `num-traits`: `0.2.19`
- `nonzero_lit`: `0.1.2`

**JavaScript Dependencies**:
- `ethers`: `^6.14.3` - Ethereum library
- `prettier`: `3.5.3` - Code formatter
- `typedoc`: `^0.28.5` - Documentation generator
- `tsc-alias`: `^1.8.16` - TypeScript path alias resolver
- `typedoc-plugin-markdown`: `^4.7.0` - Markdown plugin for TypeDoc

**Linera Protocol Dependencies** (from `linera-protocol/`):
- `linera-base` (features: `["web"]`)
- `linera-client` (features: `["web", "wasmer", "indexed-db"]`)
- `linera-core` (features: `["web", "wasmer"]`)
- `linera-execution` (features: `["web", "wasmer"]`)
- `linera-rpc` (features: `["web"]`)
- `linera-storage` (features: `["web", "wasmer"]`)
- `linera-views` (features: `["web", "indexeddb"]`)
- `linera-persistent`
- `linera-faucet-client`

#### Web Extension (`croissant/web/`)

**Runtime Dependencies**:
- `@linera/wasm-client`: `workspace:*` - Local workspace package
- `react`: `^18.3.1`
- `react-dom`: `^18.3.1`
- `react-router-dom`: `^7.7.1` - Routing library
- `@vitejs/plugin-react`: `^4.7.0`

**Development Dependencies**:
- `typescript`: `^5.8.3`
- `vite`: `^5.4.19` - Build tool
- `@vitejs/plugin-react-swc`: `^3.11.0` - Fast React plugin
- `@vitejs/plugin-legacy`: `^6.1.1` - Legacy browser support
- `vite-plugin-top-level-await`: `^1.6.0` - Top-level await support
- `vite-plugin-wasm`: `^3.5.0` - WASM support
- `tailwindcss`: `^3.4.17`
- `eslint`: `^9.32.0`
- `@eslint/js`: `^9.32.0`
- `typescript-eslint`: `^8.38.0`
- `eslint-plugin-react-hooks`: `^5.2.0`
- `eslint-plugin-react-refresh`: `^0.4.20`
- `globals`: `^15.15.0`
- `@types/react`: `^18.3.23`
- `@types/react-dom`: `^18.3.7`
- `@types/chrome`: `^0.0.313` - Chrome extension types

---

## Linera Protocol Dependencies

### Linera CLI Tools
- **linera-service**: `0.15.7` (must match Testnet Conway)
- **linera-storage-service**: `0.15.7` (must match Testnet Conway)

### Linera Protocol Repository
- **Location**: `linera-protocol/` (submodule or local copy)
- **Version**: Compatible with `0.15.7` SDK
- **Components Used**:
  - `linera-base`
  - `linera-chain`
  - `linera-client`
  - `linera-core`
  - `linera-ethereum`
  - `linera-execution`
  - `linera-faucet`
  - `linera-indexer`
  - `linera-metrics`
  - `linera-persistent`
  - `linera-rpc`
  - `linera-sdk`
  - `linera-sdk-derive`
  - `linera-service`
  - `linera-service-graphql-client`
  - `linera-storage`
  - `linera-storage-service`
  - `linera-summary`
  - `linera-views`
  - `linera-views-derive`
  - `linera-witty`
  - `linera-witty-macros`

### Testnet Configuration
- **Network**: Testnet Conway
- **Faucet URL**: `https://faucet.testnet-conway.linera.net/`
- **GraphQL Endpoint**: `http://localhost:{PORT}/chains/{chainId}/applications/{appId}`

---

## Build Tools & Compilers

### Rust Toolchain
- **Version**: `1.86.0` (stable)
- **Edition**: `2021`
- **Cargo**: Latest (included with rustup)

### WebAssembly Compilation
- **Target**: `wasm32-unknown-unknown`
- **Build Command**:
  ```bash
  cargo build --release --target wasm32-unknown-unknown
  ```

### TypeScript Compiler
- **Version**: `^5.0.0` (frontend), `^5.8.3` (croissant/web)
- **Configuration**: `tsconfig.json`

### Vite
- **Version**: `^4.4.0` (frontend), `^5.4.19` (croissant/web)
- **Purpose**: Build tool, dev server, and bundler

### Webpack/Other Bundlers
- Not used - Vite is the primary bundler

---

## Development Tools

### Code Quality
- **Clippy**: Rust linter (included with Rust)
- **rustfmt**: Rust formatter (included with Rust)
- **ESLint**: JavaScript/TypeScript linter (`^9.32.0`)
- **Prettier**: Code formatter (`3.5.3`)

### Testing
- **Cargo Test**: Built-in Rust testing
- **Jest/Vitest**: Not currently configured (can be added)

### Documentation
- **TypeDoc**: `^0.28.5` - TypeScript documentation generator
- **Rustdoc**: Built-in Rust documentation

### Version Control
- **Git**: Required for cloning and version control

### HTTP Server
- **http-server**: Used for serving static frontend files
  ```bash
  npm install -g http-server
  ```

---

## Docker Requirements

### Base Image
- **Image**: `rust:1.86-slim`
- **OS**: Debian-based Linux

### Docker System Packages
```dockerfile
pkg-config
protobuf-compiler
clang
make
jq
curl
nodejs (LTS)
```

### Docker Environment Variables
- `CARGO_BUILD_JOBS=1` - Single job build (memory optimization)
- `CARGO_NET_GIT_FETCH_WITH_CLI=true` - Use git CLI for fetching

### Docker Compose
- **File**: `compose.yaml`
- **Services**: `casino` (main service)

---

## Network & Port Configuration

### Port Assignments

#### Linera Services
- **Faucet**: `8080`
- **GraphQL Service A**: `8081`
- **GraphQL Service B**: `8082`
- **GraphQL Service C**: `8083`

#### Frontend Web Servers
- **Player 1 (web_a)**: `5173`
- **Player 2 (web_b)**: `5174`
- **Player 3 (web_c)**: `5175`

#### Additional Services (if used)
- **Shard Proxy**: `9001`
- **Shard**: `13001`

### Network Configuration
- **Protocol**: HTTP/HTTPS
- **CORS**: Enabled for frontend development
- **GraphQL Endpoint Pattern**: `http://localhost:{PORT}/chains/{chainId}/applications/{appId}`

---

## Installation Commands

### Complete Setup Script

```bash
#!/bin/bash
set -e

echo "=== Installing System Dependencies ==="
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    curl \
    git \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    jq \
    libssl-dev

echo "=== Installing Rust ==="
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup toolchain install 1.86.0
rustup default 1.86.0
rustup target add wasm32-unknown-unknown

echo "=== Installing Node.js ==="
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt-get install -y nodejs

echo "=== Installing pnpm ==="
npm install -g pnpm

echo "=== Installing Linera CLI ==="
cargo install --locked linera-service@0.15.7
cargo install --locked linera-storage-service@0.15.7

echo "=== Installing http-server ==="
npm install -g http-server

echo "=== Verifying Installations ==="
rustc --version
cargo --version
node --version
npm --version
pnpm --version
linera --version

echo "=== Setup Complete ==="
```

### Project-Specific Installation

```bash
# Clone repository
git clone <repository-url>
cd linCasino

# Install Rust dependencies
cargo build --release --target wasm32-unknown-unknown

# Install frontend dependencies
cd frontend
npm install
npm run build
cd ..

# Install Croissant dependencies (optional)
cd croissant
pnpm install
cd ..
```

---

## Version Compatibility Matrix

| Component | Version | Notes |
|-----------|---------|-------|
| Rust | 1.86.0 | Stable channel |
| Linera SDK | 0.15.7 | Must match Testnet Conway |
| async-graphql | 7.0.17 | Exact version required |
| Node.js | 18.x+ | LTS recommended |
| React | 18.2.0+ | Frontend framework |
| TypeScript | 5.0.0+ | Type checking |
| Vite | 4.4.0+ | Build tool |

---

## Troubleshooting

### Version Mismatch Issues

**Problem**: `async-graphql` version conflicts
**Solution**: Use exact version `=7.0.17` in `Cargo.toml`

**Problem**: Linera SDK version mismatch
**Solution**: Ensure `linera-sdk@0.15.7` matches installed CLI tools

**Problem**: Rust toolchain version mismatch
**Solution**: Use `rust-toolchain.toml` to pin version

### Build Issues

**Problem**: WASM target not found
**Solution**: `rustup target add wasm32-unknown-unknown`

**Problem**: Missing system dependencies
**Solution**: Install all system packages listed in [System Requirements](#system-requirements)

**Problem**: Memory issues during build
**Solution**: Set `CARGO_BUILD_JOBS=1` environment variable

---

## Additional Resources

- **Linera Documentation**: https://linera.io/docs
- **Rust Documentation**: https://doc.rust-lang.org/
- **Async-GraphQL Documentation**: https://async-graphql.github.io/
- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/

---

## Quick Reference

### Essential Commands

```bash
# Build Rust contracts
cargo build --release --target wasm32-unknown-unknown

# Run Linera service
linera --with-wallet 1 service --port 8081

# Build frontend
cd frontend && npm run build

# Start frontend dev server
cd frontend && npm run dev

# Deploy to Testnet Conway
bash run.bash
```

### Environment Variables

```bash
# Linera wallet paths
export LINERA_WALLET_1="$LINERA_TMP_DIR/wallet_1.json"
export LINERA_KEYSTORE_1="$LINERA_TMP_DIR/keystore_1.json"
export LINERA_STORAGE_1="rocksdb:$LINERA_TMP_DIR/client_1.db"

# Build optimization
export CARGO_BUILD_JOBS=1
export CARGO_NET_GIT_FETCH_WITH_CLI=true
```

---

**Last Updated**: Based on project state as of current scan
**Maintained By**: Project maintainers
**For Issues**: Please refer to project issue tracker

