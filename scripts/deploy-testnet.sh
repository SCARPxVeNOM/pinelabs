#!/bin/bash
set -e

echo "================================"
echo "Deploying Pine Analytics to Testnet Conway"
echo "================================"

# Configuration
WALLET=${WALLET:-1}
PORT=${PORT:-8080}
ADMIN_OWNER=${ADMIN_OWNER:-""}

# Note: Linera CLI uses default wallet location ~/.config/linera

# Check if Linera CLI is installed
if ! command -v linera &> /dev/null; then
    echo "Error: Linera CLI is not installed"
    echo "Install with: cargo install --locked linera-service@0.15.7"
    exit 1
fi

# Check if binaries exist (workspace root target directory)
CONTRACT_WASM="target/wasm32-unknown-unknown/release/pine_analytics_contract.wasm"
SERVICE_WASM="target/wasm32-unknown-unknown/release/pine_analytics_service.wasm"

if [ ! -f "$CONTRACT_WASM" ] || [ ! -f "$SERVICE_WASM" ]; then
    echo "Error: WASM binaries not found"
    echo "Run: ./scripts/build.sh"
    exit 1
fi

# Get admin owner if not set (use default owner from first chain)
if [ -z "$ADMIN_OWNER" ]; then
    echo "Getting admin owner from wallet..."
    ADMIN_OWNER=$(linera wallet show 2>&1 | grep -i "Default owner" | head -1 | awk '{print $NF}' | tr -d '0x' || echo "")
    
    if [ -z "$ADMIN_OWNER" ] || [ "$ADMIN_OWNER" = "No" ]; then
        echo "Warning: Could not get admin owner from wallet"
        echo "Set ADMIN_OWNER environment variable or check wallet: linera wallet show"
        echo "Using empty admin owner (you may need to set ADMIN_OWNER manually)"
        ADMIN_OWNER=""
    else
        # Add 0x prefix if not present
        if [[ ! "$ADMIN_OWNER" =~ ^0x ]]; then
            ADMIN_OWNER="0x$ADMIN_OWNER"
        fi
    fi
fi

echo ""
echo "Configuration:"
echo "  Wallet: $WALLET"
echo "  Admin Owner: $ADMIN_OWNER"
echo "  Port: $PORT"
echo "  Contract: $CONTRACT_WASM"
echo "  Service: $SERVICE_WASM"

# Check wallet balance
echo ""
echo "Checking wallet status..."
linera wallet show

# Publish and create application (combines publish and create in one command)
echo ""
echo "Publishing bytecode and creating application on Testnet Conway..."
echo "This may take a few minutes on testnet..."

# Use publish-and-create to publish bytecode and create application in one step
if [ -z "$ADMIN_OWNER" ]; then
    CREATE_OUTPUT=$(timeout 600 linera publish-and-create \
        "$CONTRACT_WASM" \
        "$SERVICE_WASM" \
        --json-argument "{}" 2>&1 || echo "TIMEOUT_OR_ERROR:$?")
else
    CREATE_OUTPUT=$(timeout 600 linera publish-and-create \
        "$CONTRACT_WASM" \
        "$SERVICE_WASM" \
        --json-argument "{\"admin_owner\": \"$ADMIN_OWNER\"}" 2>&1 || echo "TIMEOUT_OR_ERROR:$?")
fi

echo ""
echo "Output:"
echo "$CREATE_OUTPUT"

# Check if command failed
if echo "$CREATE_OUTPUT" | grep -q "TIMEOUT_OR_ERROR"; then
    echo ""
    echo "Error: publish-and-create timed out or failed"
    echo "This can happen on testnet due to network issues"
    echo "Try running the command manually:"
    if [ -z "$ADMIN_OWNER" ]; then
        echo "  linera publish-and-create $CONTRACT_WASM $SERVICE_WASM --json-argument '{}'"
    else
        echo "  linera publish-and-create $CONTRACT_WASM $SERVICE_WASM --json-argument '{\"admin_owner\": \"$ADMIN_OWNER\"}'"
    fi
    exit 1
fi

# Extract bytecode ID and application ID (publish-and-create returns both)
BYTECODE_ID=$(echo "$CREATE_OUTPUT" | grep -oE 'Bytecode ID: [a-f0-9]+' | awk '{print $NF}' || \
              echo "$CREATE_OUTPUT" | grep -oE 'bytecode.*[a-f0-9]{64}' | grep -oE '[a-f0-9]{64}' | head -1 || \
              echo "$CREATE_OUTPUT" | grep -oE '[a-f0-9]{64}' | head -1 || echo "")

APP_ID=$(echo "$CREATE_OUTPUT" | grep -oE 'Application ID: [a-f0-9]+' | awk '{print $NF}' || \
         echo "$CREATE_OUTPUT" | grep -oE 'application.*[a-f0-9]{64}' | grep -oE '[a-f0-9]{64}' | head -1 || \
         echo "$CREATE_OUTPUT" | grep -oE '[a-f0-9]{64}' | tail -1 || echo "")

if [ -z "$APP_ID" ]; then
    echo "Error: Failed to extract application ID"
    echo "Output: $CREATE_OUTPUT"
    exit 1
fi

if [ -n "$BYTECODE_ID" ]; then
    echo ""
    echo "✓ Bytecode published: $BYTECODE_ID"
fi

echo ""
echo "✓ Application created: $APP_ID"

# Get chain ID (use first chain)
CHAIN_ID=$(linera wallet show 2>&1 | grep -i "Chain ID:" | head -1 | awk '{print $NF}' || echo "")

# Save deployment info
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
cat > deployment-testnet.json <<EOF
{
  "network": "testnet-conway",
  "bytecode_id": "$BYTECODE_ID",
  "application_id": "$APP_ID",
  "chain_id": "$CHAIN_ID",
  "admin_owner": "$ADMIN_OWNER",
  "port": $PORT,
  "wallet": $WALLET,
  "deployed_at": "$TIMESTAMP",
  "graphql_endpoint": "http://localhost:$PORT/chains/$CHAIN_ID/applications/$APP_ID",
  "faucet_url": "https://faucet.testnet-conway.linera.net/"
}
EOF

echo ""
echo "✓ Deployment info saved to deployment-testnet.json"

# Start service (optional - user can start manually)
echo ""
read -p "Start GraphQL service now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting GraphQL service on port $PORT..."
    
    # Kill existing service if running
    if [ -f "service-testnet.pid" ]; then
        OLD_PID=$(cat service-testnet.pid)
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            echo "Stopping existing service (PID: $OLD_PID)..."
            kill "$OLD_PID" || true
            sleep 2
        fi
        rm -f service-testnet.pid
    fi
    
    # Start new service
    nohup linera service --port "$PORT" > linera-service-testnet.log 2>&1 &
    SERVICE_PID=$!
    echo $SERVICE_PID > service-testnet.pid
    
    echo "✓ Service started (PID: $SERVICE_PID)"
    echo "  Logs: tail -f linera-service-testnet.log"
    
    # Wait for service to be ready
    echo ""
    echo "Waiting for service to be ready..."
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    SERVICE_URL="http://localhost:$PORT/chains/$CHAIN_ID/applications/$APP_ID"
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if curl -s "$SERVICE_URL" > /dev/null 2>&1; then
            echo "✓ Service is ready!"
            break
        fi
        ATTEMPT=$((ATTEMPT + 1))
        echo -n "."
        sleep 1
    done
    
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo ""
        echo "Warning: Service did not respond within $MAX_ATTEMPTS seconds"
        echo "Check logs: tail -f linera-service-testnet.log"
    fi
fi

echo ""
echo "================================"
echo "Deployment Complete!"
echo "================================"
echo ""
echo "Network: Testnet Conway"
echo "Application ID: $APP_ID"
echo "Bytecode ID: $BYTECODE_ID"
echo "Chain ID: $CHAIN_ID"
echo "Admin Owner: $ADMIN_OWNER"
echo ""
echo "GraphQL Endpoint:"
echo "  http://localhost:$PORT/chains/$CHAIN_ID/applications/$APP_ID"
echo ""
echo "To start the service manually:"
echo "  linera service --port $PORT"
echo ""
echo "To stop the service:"
echo "  kill \$(cat service-testnet.pid)"
echo ""
echo "Next steps:"
echo "1. Test the GraphQL endpoint"
echo "2. Update frontend .env with application ID"
echo "3. Start frontend: cd frontend && npm run dev"

