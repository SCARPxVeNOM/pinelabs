# Quick Start: Deploy Pine Analytics to Testnet Conway

This is a quick reference guide for deploying Pine Analytics to Linera Testnet Conway.

## Prerequisites

✅ **Rust 1.86.0+** - Install from [rustup.rs](https://rustup.rs/)
✅ **Linera CLI 0.15.7** - `cargo install --locked linera-service@0.15.7`
✅ **Node.js 18+** - Install LTS version
✅ **WSL2** (if on Windows) - Required for Rust/WASM builds

## Quick Deployment Steps

### 1. Setup Testnet Wallet
```bash
chmod +x scripts/setup-testnet.sh
./scripts/setup-testnet.sh
```

### 2. Get Testnet Tokens
```bash
chmod +x scripts/get-tokens.sh
./scripts/get-tokens.sh
```

### 3. Test the Project
```bash
chmod +x scripts/test.sh
./scripts/test.sh
```

### 4. Build the Project
```bash
chmod +x scripts/build.sh
./scripts/build.sh
```

**Note**: This requires WSL2 on Windows. Run in WSL terminal.

### 5. Deploy to Testnet
```bash
chmod +x scripts/deploy-testnet.sh
./scripts/deploy-testnet.sh
```

## Full Command Sequence

```bash
# 1. Setup (one-time)
./scripts/setup-testnet.sh
./scripts/get-tokens.sh

# 2. Test and Build
./scripts/test.sh
./scripts/build.sh

# 3. Deploy
./scripts/deploy-testnet.sh
```

## Verify Deployment

After deployment, check `deployment-testnet.json`:

```bash
cat deployment-testnet.json
```

You should see:
- `application_id`
- `bytecode_id`
- `chain_id`
- `graphql_endpoint`

## Start GraphQL Service

If not started during deployment:

```bash
# Get values from deployment file
WALLET=$(cat deployment-testnet.json | jq -r '.wallet')
PORT=$(cat deployment-testnet.json | jq -r '.port')

# Start service
linera --with-wallet "$WALLET" service --port "$PORT"
```

## Stop Service

```bash
chmod +x scripts/stop-service.sh
./scripts/stop-service.sh
```

## Test GraphQL Endpoint

```bash
# Get endpoint from deployment file
ENDPOINT=$(cat deployment-testnet.json | jq -r '.graphql_endpoint')

# Test health query
curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ health { status } }"}'
```

## Troubleshooting

### "WSL Required"
- On Windows, use WSL2 terminal
- Install WSL2: `wsl --install`
- Run commands in WSL terminal

### "Linera CLI not found"
```bash
cargo install --locked linera-service@0.15.7
cargo install --locked linera-storage-service@0.15.7
```

### "Insufficient balance"
```bash
./scripts/get-tokens.sh
```

### "Build failed"
- Make sure you're in WSL (on Windows)
- Check Rust version: `rustc --version`
- Install wasm32 target: `rustup target add wasm32-unknown-unknown`

## Next Steps

1. ✅ Verify deployment succeeded
2. ✅ Start GraphQL service
3. ✅ Test GraphQL endpoint
4. ✅ Configure frontend (update `.env` with application ID)
5. ✅ Start frontend: `cd frontend && npm run dev`

## Full Documentation

For detailed instructions, see:
- **TESTNET_DEPLOYMENT.md** - Complete deployment guide
- **README.md** - Project overview
- **docs/deployment-guide.md** - Detailed deployment docs

## Reference

Based on Linera Testnet Conway requirements:
- **Network**: Testnet Conway
- **SDK Version**: 0.15.7 (must match)
- **CLI Version**: 0.15.7 (must match)
- **Faucet**: https://faucet.testnet-conway.linera.net/



