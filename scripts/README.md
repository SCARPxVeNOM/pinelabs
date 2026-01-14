# Pine Analytics - Deployment Scripts

This directory contains scripts for testing and deploying Pine Analytics to Linera Testnet Conway.

## Scripts Overview

### Setup Scripts

#### `setup-testnet.sh`
Sets up Linera testnet wallet and configuration.
- Creates wallet
- Initializes keystore
- Configures storage
- **Usage**: `./scripts/setup-testnet.sh`

#### `get-tokens.sh`
Requests testnet tokens from the faucet.
- Gets wallet address
- Requests tokens
- Checks balance
- **Usage**: `./scripts/get-tokens.sh`

### Testing Scripts

#### `test.sh`
Runs all project tests.
- Runs Rust unit tests
- Checks WASM compilation
- **Usage**: `./scripts/test.sh`

### Build Scripts

#### `build.sh`
Builds the entire project.
- Builds contract and service WASM binaries
- Builds frontend
- **Usage**: `./scripts/build.sh`

#### `run.sh` (recommended)
Builds, deploys, starts the Linera GraphQL service, and starts the frontend dev server.
- Builds backend WASM + frontend
- Deploys and creates the application
- Starts Linera service (GraphQL) on `PORT` (default `8080`)
- Starts Vite dev server on `5173`
- **Usage**: `./scripts/run.sh`

### Deployment Scripts

#### `deploy-testnet.sh`
Deploys to Linera Testnet Conway.
- Publishes bytecode
- Creates application instance
- Saves deployment info
- Optionally starts service
- **Usage**: `./scripts/deploy-testnet.sh`

#### `deploy.sh`
Deploys to local Linera network (alternative).
- Similar to deploy-testnet.sh
- For local development
- **Usage**: `./scripts/deploy.sh`

### Service Management

#### `stop-service.sh`
Stops the running Linera service.
- Kills service process
- Cleans up PID file
- **Usage**: `./scripts/stop-service.sh`

## Quick Start

### First Time Setup

```bash
# 1. Setup wallet
chmod +x scripts/setup-testnet.sh
./scripts/setup-testnet.sh

# 2. Get tokens
chmod +x scripts/get-tokens.sh
./scripts/get-tokens.sh
```

### Regular Deployment

```bash
# 1. Test
chmod +x scripts/test.sh
./scripts/test.sh

# 2. Build
chmod +x scripts/build.sh
./scripts/build.sh

# 3. Deploy
chmod +x scripts/deploy-testnet.sh
./scripts/deploy-testnet.sh
```

## Environment Variables

All scripts support these environment variables:

```bash
export WALLET=1                    # Wallet number (default: 1)
export PORT=8080                   # Service port (default: 8080)
export ADMIN_OWNER="address"       # Admin owner (auto-detected)
export LINERA_TMP_DIR="/tmp/linera" # Temp directory
```

## Output Files

### Deployment Files

- `deployment-testnet.json` - Testnet deployment info
- `deployment-info.json` - Local deployment info
- `service-testnet.pid` - Service process ID
- `linera-service-testnet.log` - Service logs

### Example deployment-testnet.json

```json
{
  "network": "testnet-conway",
  "bytecode_id": "...",
  "application_id": "...",
  "chain_id": "...",
  "admin_owner": "...",
  "port": 8080,
  "wallet": 1,
  "deployed_at": "2025-01-12T00:00:00Z",
  "graphql_endpoint": "http://localhost:8080/chains/.../applications/..."
}
```

## Troubleshooting

### Scripts not executable
```bash
chmod +x scripts/*.sh
```

### Scripts not found
- Make sure you're in the project root directory
- Use absolute paths if needed: `/full/path/to/scripts/script.sh`

### Permission denied
```bash
chmod +x scripts/script-name.sh
```

### Script errors
- Check error messages
- Verify prerequisites (Rust, Linera CLI, Node.js)
- Check environment variables
- Review logs: `tail -f linera-service-testnet.log`

## Requirements

All scripts require:
- **Bash** shell (Linux/macOS/WSL2)
- **Linera CLI** 0.15.7
- **Rust** 1.86.0+
- **Node.js** 18+

## Notes

- Scripts use `set -e` to exit on errors
- All scripts are idempotent (safe to run multiple times)
- Scripts create necessary directories automatically
- Environment variables can override defaults

## References

- **TESTNET_DEPLOYMENT.md** - Complete deployment guide
- **QUICK_START_DEPLOYMENT.md** - Quick reference
- **DEPENDENCIES.md** - Dependency requirements




