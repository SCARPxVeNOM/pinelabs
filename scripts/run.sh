#!/bin/bash
set -e

echo "================================"
echo "Pine Analytics - Build, Deploy & Run"
echo "================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Configuration (can be overridden from env)
WALLET="${WALLET:-1}"
PORT="${PORT:-8080}"

echo ""
echo "Configuration:"
echo "  Wallet: $WALLET"
echo "  Backend Port: $PORT"
echo ""

############################################
# 1. Build backend (WASM) and frontend
############################################
echo "Step 1/3: Building project (backend + frontend)..."
chmod +x ./scripts/build.sh
./scripts/build.sh

############################################
# 2. Deploy backend (Linera) and start service
############################################
echo ""
echo "Step 2/3: Deploying to Linera and starting GraphQL service..."
chmod +x ./scripts/deploy.sh
WALLET="$WALLET" PORT="$PORT" ./scripts/deploy.sh

############################################
# 3. Start frontend (Vite dev server)
############################################
echo ""
echo "Step 3/3: Starting frontend (Vite dev server)..."

FRONTEND_DIR="$ROOT_DIR/frontend"
if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Error: frontend directory not found at $FRONTEND_DIR"
  echo "Make sure the frontend has been created."
  exit 1
fi

cd "$FRONTEND_DIR"

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies (npm install)..."
  npm install
fi

# Ensure VITE_GRAPHQL_ENDPOINT matches running backend
export VITE_GRAPHQL_ENDPOINT="${VITE_GRAPHQL_ENDPOINT:-http://localhost:${PORT}/graphql}"

# Stop previous dev server if running
if [ -f "frontend.pid" ]; then
  OLD_PID="$(cat frontend.pid)"
  if ps -p "$OLD_PID" > /dev/null 2>&1; then
    echo "Stopping existing frontend dev server (PID: $OLD_PID)..."
    kill "$OLD_PID" || true
    sleep 1
  fi
  rm -f frontend.pid
fi

echo "Starting Vite dev server on http://localhost:5173 ..."
nohup npm run dev -- --host 0.0.0.0 > ../frontend-dev.log 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > frontend.pid

echo ""
echo "================================"
echo "Pine Analytics is running!"
echo "================================"
echo "Backend (Linera service):"
echo "  GraphQL:  http://localhost:${PORT}/graphql"
echo "  Health:   http://localhost:${PORT}/health"
echo ""
echo "Frontend (Vite dev server):"
echo "  URL:      http://localhost:5173"
echo ""
echo "Logs:"
echo "  Backend:  tail -f linera-service.log"
echo "  Frontend: tail -f frontend-dev.log"
echo ""
echo "To stop services:"
echo "  Backend:  kill \$(cat service.pid)    # from project root"
echo "  Frontend: kill \$(cat frontend/frontend.pid)"
echo ""


