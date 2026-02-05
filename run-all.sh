#!/usr/bin/env bash
# =============================================================================
# Pine Analytics - Unified Run Script
# =============================================================================
# Builds, deploys, and runs the entire stack with one command
#
# Usage: ./run-all.sh [OPTIONS]
#   --build-only     Only build, don't run services
#   --no-build       Skip building, just run services
#   --testnet        Deploy to Linera Conway Testnet
#   --port PORT      Set GraphQL port (default: 8080)
#   --frontend-port  Set frontend port (default: 3000)
#
# // turbo-all
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PORT=${PORT:-8080}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
BUILD_ONLY=false
NO_BUILD=false
TESTNET=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build-only) BUILD_ONLY=true; shift ;;
        --no-build) NO_BUILD=true; shift ;;
        --testnet) TESTNET=true; shift ;;
        --port) PORT="$2"; shift 2 ;;
        --frontend-port) FRONTEND_PORT="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                     🌲 PINE ANALYTICS                        ║"
echo "║              Blockchain Analytics Platform                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# -----------------------------------------------------------------------------
# Step 1: Check Prerequisites
# -----------------------------------------------------------------------------
echo -e "${BLUE}[1/6] Checking prerequisites...${NC}"

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        echo "   Install with: $2"
        exit 1
    fi
    echo -e "${GREEN}✓ $1 found${NC}"
}

check_command "cargo" "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
check_command "node" "https://nodejs.org/"
check_command "npm" "https://nodejs.org/"

if command -v linera &> /dev/null; then
    echo -e "${GREEN}✓ linera CLI found${NC}"
    LINERA_VERSION=$(linera --version 2>&1 | head -1)
    echo "   Version: $LINERA_VERSION"
else
    echo -e "${YELLOW}⚠ linera CLI not found - will skip deployment${NC}"
fi

# Check for wasm target
if rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    echo -e "${GREEN}✓ wasm32-unknown-unknown target installed${NC}"
else
    echo -e "${YELLOW}Installing wasm32-unknown-unknown target...${NC}"
    rustup target add wasm32-unknown-unknown
fi

# -----------------------------------------------------------------------------
# Step 2: Build Backend (WASM)
# -----------------------------------------------------------------------------
if [ "$NO_BUILD" = false ]; then
    echo ""
    echo -e "${BLUE}[2/6] Building Linera smart contracts...${NC}"
    
    cargo build --release --target wasm32-unknown-unknown -p pine-analytics
    
    if [ -f "target/wasm32-unknown-unknown/release/pine_analytics_contract.wasm" ]; then
        CONTRACT_SIZE=$(du -h target/wasm32-unknown-unknown/release/pine_analytics_contract.wasm | cut -f1)
        SERVICE_SIZE=$(du -h target/wasm32-unknown-unknown/release/pine_analytics_service.wasm | cut -f1)
        echo -e "${GREEN}✓ Contract built: $CONTRACT_SIZE${NC}"
        echo -e "${GREEN}✓ Service built: $SERVICE_SIZE${NC}"
    else
        echo -e "${RED}❌ WASM build failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}[2/6] Skipping build (--no-build)${NC}"
fi

# -----------------------------------------------------------------------------
# Step 3: Build Frontend
# -----------------------------------------------------------------------------
if [ "$NO_BUILD" = false ]; then
    echo ""
    echo -e "${BLUE}[3/6] Building frontend...${NC}"
    
    cd frontend
    npm install --silent
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    cd ..
else
    echo -e "${YELLOW}[3/6] Skipping frontend build (--no-build)${NC}"
fi

if [ "$BUILD_ONLY" = true ]; then
    echo ""
    echo -e "${GREEN}✓ Build complete! (--build-only mode)${NC}"
    exit 0
fi

# -----------------------------------------------------------------------------
# Step 4: Deploy to Linera
# -----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[4/6] Deploying to Linera...${NC}"

if command -v linera &> /dev/null; then
    # Check if wallet exists
    if linera wallet show &> /dev/null; then
        echo -e "${GREEN}✓ Wallet configured${NC}"
        
        # Get chain ID
        CHAIN_ID=$(linera wallet show --short 2>/dev/null | head -1 || echo "")
        if [ -n "$CHAIN_ID" ]; then
            echo "  Default chain: ${CHAIN_ID:0:16}..."
        fi
        
        # Deploy application
        if [ "$TESTNET" = true ]; then
            echo "  Deploying to Conway Testnet..."
        fi
        
        # Try to deploy (ignore errors if already deployed)
        cd pine-analytics
        linera project publish-and-create 2>&1 || echo -e "${YELLOW}  (App may already be deployed)${NC}"
        cd ..
        
        # Save deployment info
        OWNER=$(linera wallet show 2>&1 | grep -i "owner" | head -1 | awk '{print $NF}' || echo "")
        APP_ID=$(linera wallet show 2>&1 | grep -i "application" | head -1 | awk '{print $NF}' || echo "")
        
        cat > frontend/public/deployment-testnet.json << EOF
{
  "network": "testnet-conway",
  "chain_id": "$CHAIN_ID",
  "admin_owner": "$OWNER",
  "application_id": "$APP_ID",
  "port": $PORT,
  "graphql_endpoint": "http://localhost:$PORT",
  "faucet_url": "https://faucet.testnet-conway.linera.net/"
}
EOF
        echo -e "${GREEN}✓ Deployment config saved${NC}"
    else
        echo -e "${YELLOW}⚠ No wallet configured - using mock data${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Linera CLI not available - skipping deployment${NC}"
fi

# -----------------------------------------------------------------------------
# Step 5: Start Linera Service
# -----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[5/6] Starting Linera GraphQL service...${NC}"

if command -v linera &> /dev/null && linera wallet show &> /dev/null; then
    # Check if port is already in use
    if lsof -i:$PORT &> /dev/null; then
        echo -e "${YELLOW}  Port $PORT already in use - service may be running${NC}"
    else
        linera service --port $PORT &
        LINERA_PID=$!
        echo -e "${GREEN}✓ Linera service started (PID: $LINERA_PID)${NC}"
        echo "  GraphQL: http://localhost:$PORT"
        sleep 2
    fi
else
    echo -e "${YELLOW}⚠ Skipping Linera service (no CLI or wallet)${NC}"
fi

# -----------------------------------------------------------------------------
# Step 6: Start Frontend
# -----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[6/6] Starting frontend dev server...${NC}"

cd frontend
VITE_GRAPHQL_ENDPOINT="http://localhost:$PORT" \
VITE_PORT=$FRONTEND_PORT \
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 3

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🚀 PINE ANALYTICS RUNNING                  ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Frontend:    http://localhost:$FRONTEND_PORT                         ║${NC}"
echo -e "${GREEN}║  GraphQL:     http://localhost:$PORT                              ║${NC}"
echo -e "${GREEN}║  GraphiQL:    http://localhost:$PORT                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Press Ctrl+C to stop all services${NC}"

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    [ -n "$LINERA_PID" ] && kill $LINERA_PID 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
