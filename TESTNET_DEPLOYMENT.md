# Pine Analytics - Testnet Conway Deployment Guide

This guide provides step-by-step instructions for testing and deploying Pine Analytics to Linera Testnet Conway.

## Prerequisites

### System Requirements
- **Linux** (Ubuntu 20.04+, Debian 11+, or WSL2 on Windows)
- **macOS** (10.15+)
- **Windows** (WSL2 recommended)

### Required Tools
- **Rust** 1.86.0+ (stable)
- **Node.js** 18.x+ (LTS)
- **Linera CLI** 0.15.7 (must match Testnet Conway)

### Installation

#### 1. Install System Dependencies (Linux/Ubuntu)
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

#### 2. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup toolchain install 1.86.0
rustup default 1.86.0
rustup target add wasm32-unknown-unknown
```

#### 3. Install Linera CLI
```bash
cargo install --locked linera-service@0.15.7
cargo install --locked linera-storage-service@0.15.7
```

#### 4. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt-get install -y nodejs
```

#### 5. Verify Installations
```bash
rustc --version    # Should show 1.86.0+
cargo --version
linera --version   # Should show 0.15.7
node --version     # Should show 18.x+
```

## Testing the Project

### Run All Tests
```bash
chmod +x scripts/test.sh
./scripts/test.sh
```

This will:
- Run all Rust unit tests
- Check WASM compilation
- Verify the project builds correctly

### Manual Testing
```bash
# Run Rust tests
cd pine-analytics
cargo test

# Check WASM compilation
cargo check --target wasm32-unknown-unknown

# Build for release
cargo build --release --target wasm32-unknown-unknown
```

## Deployment to Testnet Conway

### Step 1: Setup Testnet Wallet

```bash
chmod +x scripts/setup-testnet.sh
./scripts/setup-testnet.sh
```

This will:
- Create a new Linera wallet
- Initialize the wallet with testnet configuration
- Display wallet information

**Note**: Save your wallet address and keys securely!

### Step 2: Get Testnet Tokens

```bash
chmod +x scripts/get-tokens.sh
./scripts/get-tokens.sh
```

This will:
- Request testnet tokens from the faucet
- Wait for tokens to arrive
- Display wallet balance

**Faucet URL**: https://faucet.testnet-conway.linera.net/

### Step 3: Build the Project

```bash
chmod +x scripts/build.sh
./scripts/build.sh
```

This will:
- Build contract and service WASM binaries
- Build the frontend
- Verify all binaries are created

**Expected Output**:
- `pine-analytics/target/wasm32-unknown-unknown/release/pine_analytics_contract.wasm`
- `pine-analytics/target/wasm32-unknown-unknown/release/pine_analytics_service.wasm`
- `frontend/dist/` directory

### Step 4: Deploy to Testnet

```bash
chmod +x scripts/deploy-testnet.sh
./scripts/deploy-testnet.sh
```

This will:
- Publish bytecode to Testnet Conway
- Create application instance
- Save deployment information
- Optionally start the GraphQL service

**Environment Variables** (optional):
```bash
export WALLET=1                              # Wallet number
export PORT=8080                             # Service port
export ADMIN_OWNER="your-address-here"      # Admin owner (auto-detected if not set)
export LINERA_TMP_DIR="/tmp/linera"         # Temporary directory
```

### Step 5: Verify Deployment

After deployment, check `deployment-testnet.json`:

```bash
cat deployment-testnet.json
```

You should see:
```json
{
  "network": "testnet-conway",
  "bytecode_id": "...",
  "application_id": "...",
  "chain_id": "...",
  "admin_owner": "...",
  "graphql_endpoint": "http://localhost:8080/chains/.../applications/..."
}
```

### Step 6: Start GraphQL Service

If you didn't start the service during deployment:

```bash
# Get values from deployment-testnet.json
CHAIN_ID=$(cat deployment-testnet.json | jq -r '.chain_id')
APP_ID=$(cat deployment-testnet.json | jq -r '.application_id')
WALLET=$(cat deployment-testnet.json | jq -r '.wallet')
PORT=$(cat deployment-testnet.json | jq -r '.port')

# Start service
linera --with-wallet "$WALLET" service --port "$PORT"
```

The GraphQL endpoint will be available at:
```
http://localhost:$PORT/chains/$CHAIN_ID/applications/$APP_ID
```

### Step 7: Test GraphQL Endpoint

```bash
# Health check
curl http://localhost:$PORT/chains/$CHAIN_ID/applications/$APP_ID

# Test GraphQL query
curl -X POST http://localhost:$PORT/chains/$CHAIN_ID/applications/$APP_ID \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health { status } }"}'
```

### Step 8: Configure Frontend

Update `frontend/.env`:

```bash
cd frontend
cat > .env <<EOF
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/chains/YOUR_CHAIN_ID/applications/YOUR_APP_ID
VITE_WS_ENDPOINT=ws://localhost:8080/chains/YOUR_CHAIN_ID/applications/YOUR_APP_ID
VITE_APP_ID=YOUR_APP_ID
EOF
```

Replace `YOUR_CHAIN_ID` and `YOUR_APP_ID` with values from `deployment-testnet.json`.

### Step 9: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at: `http://localhost:3000`

## Troubleshooting

### Common Issues

#### 1. "Linera CLI not found"
```bash
cargo install --locked linera-service@0.15.7
cargo install --locked linera-storage-service@0.15.7
```

#### 2. "WASM binaries not found"
```bash
./scripts/build.sh
```

#### 3. "Wallet not found"
```bash
./scripts/setup-testnet.sh
```

#### 4. "Insufficient balance"
```bash
./scripts/get-tokens.sh
```

#### 5. "Failed to publish bytecode"
- Check wallet balance: `linera --with-wallet 1 wallet show`
- Verify WASM binaries exist
- Check network connection
- Verify Linera CLI version matches Testnet Conway (0.15.7)

#### 6. "Service not responding"
- Check if service is running: `ps aux | grep linera`
- Check logs: `tail -f linera-service-testnet.log`
- Verify port is not in use: `lsof -i :8080`
- Restart service: `kill $(cat service-testnet.pid) && ./scripts/deploy-testnet.sh`

#### 7. "GraphQL endpoint returns 404"
- Verify chain ID and application ID in the URL
- Check that service is running and connected to the correct chain
- Verify deployment was successful: `cat deployment-testnet.json`

### Version Compatibility

| Component | Required Version | Notes |
|-----------|------------------|-------|
| Rust | 1.86.0+ | Stable channel |
| Linera SDK | 0.15.7 | Must match Testnet Conway |
| Linera CLI | 0.15.7 | Must match SDK version |
| Node.js | 18.x+ | LTS recommended |

### Network Information

- **Network**: Testnet Conway
- **Faucet URL**: https://faucet.testnet-conway.linera.net/
- **Chain ID**: Auto-assigned during wallet creation
- **GraphQL Endpoint Pattern**: `http://localhost:{PORT}/chains/{CHAIN_ID}/applications/{APP_ID}`

## Quick Reference

### Essential Commands

```bash
# Setup
./scripts/setup-testnet.sh        # Setup wallet
./scripts/get-tokens.sh           # Get testnet tokens

# Testing
./scripts/test.sh                 # Run all tests

# Building
./scripts/build.sh                # Build everything

# Deployment
./scripts/deploy-testnet.sh       # Deploy to testnet

# Service Management
linera --with-wallet 1 service --port 8080    # Start service
kill $(cat service-testnet.pid)               # Stop service
tail -f linera-service-testnet.log            # View logs

# Wallet Management
linera --with-wallet 1 wallet show            # Show wallet info
```

### Environment Variables

```bash
export WALLET=1
export PORT=8080
export ADMIN_OWNER="your-address"
export LINERA_TMP_DIR="/tmp/linera"
export LINERA_WALLET="/tmp/linera/wallet_1.json"
export LINERA_KEYSTORE="/tmp/linera/keystore_1.json"
export LINERA_STORAGE="rocksdb:/tmp/linera/client_1.db"
```

## Next Steps

After successful deployment:

1. **Test the Application**
   - Use GraphQL queries to interact with the service
   - Test adding monitored applications
   - Test event capture and querying

2. **Integrate Frontend**
   - Configure frontend with application ID
   - Test all frontend features
   - Verify real-time updates

3. **Monitor**
   - Check service logs
   - Monitor wallet balance
   - Track application usage

4. **Documentation**
   - Update README with deployment details
   - Document API usage
   - Create user guide

## Support

For issues or questions:
- Check Linera documentation: https://linera.io/docs
- Review deployment logs
- Check Testnet Conway status
- Verify all prerequisites are met

---

**Last Updated**: Based on Linera Testnet Conway requirements
**Compatible Versions**: Linera SDK 0.15.7, Rust 1.86.0+



