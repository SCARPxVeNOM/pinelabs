#!/bin/bash
set -e

echo "================================"
echo "Building Pine Analytics"
echo "================================"

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v rustc &> /dev/null; then
    echo "Error: Rust is not installed"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    echo "Error: Cargo is not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Check Rust version
RUST_VERSION=$(rustc --version | awk '{print $2}')
echo "Rust version: $RUST_VERSION"

# Check if wasm32 target is installed
if ! rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    echo "Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# Update Cargo.lock to match Cargo.toml constraints
echo ""
echo "Updating dependency versions in Cargo.lock..."
# Update all async-graphql packages to 7.0.17
cargo update -p async-graphql-value --precise 7.0.17
cargo update -p async-graphql-parser --precise 7.0.17  
cargo update -p async-graphql --precise 7.0.17
cargo update -p async-graphql-derive --precise 7.0.17

# Build contract and service
echo ""
echo "Building Rust contract and service..."

# Build from workspace root using package flag (like linCasino)
echo "Running cargo build..."
echo "Building binaries for WASM target..."
cargo build --release --target wasm32-unknown-unknown -p pine-analytics --bins

# Verify binaries (workspace root has target directory)
CONTRACT_WASM="target/wasm32-unknown-unknown/release/pine_analytics_contract.wasm"
SERVICE_WASM="target/wasm32-unknown-unknown/release/pine_analytics_service.wasm"

echo ""
echo "Checking for built binaries..."

# List all .wasm files in the target directory for debugging
if [ -d "target/wasm32-unknown-unknown/release" ]; then
    echo "Files in target directory:"
    ls -la target/wasm32-unknown-unknown/release/*.wasm 2>/dev/null || echo "No .wasm files found"
    echo ""
fi

if [ ! -f "$CONTRACT_WASM" ]; then
    echo "Error: Contract WASM not found at $CONTRACT_WASM"
echo ""
echo "Troubleshooting:"
echo "1. Check if binaries were built: ls -la target/wasm32-unknown-unknown/release/"
echo "2. Try building explicitly: cargo build --release --target wasm32-unknown-unknown --bin pine_analytics_contract --bin pine_analytics_service"
echo "3. Check Cargo.toml for binary definitions"
exit 1
fi

if [ ! -f "$SERVICE_WASM" ]; then
    echo "Error: Service WASM not found at $SERVICE_WASM"
    echo ""
    echo "Troubleshooting:"
echo "1. Check if binaries were built: ls -la target/wasm32-unknown-unknown/release/"
echo "2. Try building explicitly: cargo build --release --target wasm32-unknown-unknown --bin pine_analytics_contract --bin pine_analytics_service"
echo "3. Check Cargo.toml for binary definitions"
exit 1
fi

CONTRACT_SIZE=$(du -h "$CONTRACT_WASM" | cut -f1)
SERVICE_SIZE=$(du -h "$SERVICE_WASM" | cut -f1)

echo "✓ Contract built: $CONTRACT_SIZE"
echo "✓ Service built: $SERVICE_SIZE"

# Build frontend (optional - skip if directory doesn't exist)
echo ""
if [ -d "frontend" ]; then
    echo "Building frontend..."
    cd frontend

    if [ ! -d "node_modules" ]; then
        echo "Installing npm dependencies..."
        npm install
    fi

    echo "Running npm build..."
    npm run build

    if [ ! -d "dist" ]; then
        echo "Error: Frontend dist directory not found"
        exit 1
    fi

    echo "✓ Frontend built successfully"
    cd ..
else
    echo "Frontend directory not found - skipping frontend build"
fi

echo ""
echo "================================"
echo "Build Complete!"
echo "================================"
echo ""
echo "Contract: pine-analytics/$CONTRACT_WASM"
echo "Service:  pine-analytics/$SERVICE_WASM"
echo "Frontend: frontend/dist/"
echo ""
echo "Next steps:"
echo "1. Deploy to Linera: ./scripts/deploy.sh"
echo "2. Or run locally: cd frontend && npm run dev"
