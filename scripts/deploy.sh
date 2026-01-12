#!/bin/bash
set -e

echo "================================"
echo "Deploying Pine Analytics"
echo "================================"

# Configuration
ADMIN_OWNER=${ADMIN_OWNER:-""}
PORT=${PORT:-8080}
WALLET=${WALLET:-1}

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
    echo "Error: WASM binaries not found. Run ./scripts/build.sh first"
    exit 1
fi

echo ""
echo "Configuration:"
echo "  Admin Owner: $ADMIN_OWNER"
echo "  Port: $PORT"
echo "  Wallet: $WALLET"
echo ""

# Publish and create application (combines publish and create in one command)
echo ""
echo "Publishing bytecode and creating application..."
echo "This may take a few minutes..."

# Use publish-and-create to publish bytecode and create application in one step
if [ -z "$ADMIN_OWNER" ]; then
    CREATE_OUTPUT=$(timeout 600 linera --with-wallet $WALLET publish-and-create \
        "$CONTRACT_WASM" \
        "$SERVICE_WASM" \
        --json-argument "{}" 2>&1 || echo "TIMEOUT_OR_ERROR:$?")
else
    CREATE_OUTPUT=$(timeout 600 linera --with-wallet $WALLET publish-and-create \
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
    echo "This can happen due to network issues"
    echo "Try running the command manually:"
    if [ -z "$ADMIN_OWNER" ]; then
        echo "  linera --with-wallet $WALLET publish-and-create $CONTRACT_WASM $SERVICE_WASM --json-argument '{}'"
    else
        echo "  linera --with-wallet $WALLET publish-and-create $CONTRACT_WASM $SERVICE_WASM --json-argument '{\"admin_owner\": \"$ADMIN_OWNER\"}'"
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

# Save deployment info
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
cat > deployment-info.json <<EOF
{
  "bytecode_id": "$BYTECODE_ID",
  "application_id": "$APP_ID",
  "admin_owner": "$ADMIN_OWNER",
  "port": $PORT,
  "wallet": $WALLET,
  "deployed_at": "$TIMESTAMP"
}
EOF

echo "✓ Deployment info saved to deployment-info.json"

# Start service
echo ""
echo "Starting GraphQL service..."
echo "Port: $PORT"
echo "Wallet: $WALLET"

# Kill existing service if running
if [ -f "service.pid" ]; then
    OLD_PID=$(cat service.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "Stopping existing service (PID: $OLD_PID)..."
        kill $OLD_PID
        sleep 2
    fi
    rm service.pid
fi

# Start new service
nohup linera --with-wallet $WALLET service --port $PORT > linera-service.log 2>&1 &
SERVICE_PID=$!
echo $SERVICE_PID > service.pid

echo "✓ Service started (PID: $SERVICE_PID)"
echo "  Logs: tail -f linera-service.log"

# Wait for service to be ready
echo ""
echo "Waiting for service to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
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
    echo "Check logs: tail -f linera-service.log"
fi

echo ""
echo "================================"
echo "Deployment Complete!"
echo "================================"
echo ""
echo "Application ID: $APP_ID"
echo "Bytecode ID: $BYTECODE_ID"
echo "GraphQL Endpoint: http://localhost:$PORT/graphql"
echo "Health Check: http://localhost:$PORT/health"
echo ""
echo "Next steps:"
echo "1. Test health: curl http://localhost:$PORT/health"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Add monitored apps via GraphQL mutations"
echo ""
echo "To stop service: kill \$(cat service.pid)"
