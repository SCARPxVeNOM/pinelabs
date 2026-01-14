#!/bin/bash

echo "Stopping Linera service..."

if [ -f "service-testnet.pid" ]; then
    PID=$(cat service-testnet.pid)
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Stopping service (PID: $PID)..."
        kill "$PID"
        sleep 2
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Force stopping..."
            kill -9 "$PID"
        fi
        echo "✓ Service stopped"
    else
        echo "Service not running (PID: $PID)"
    fi
    rm -f service-testnet.pid
else
    echo "No service PID file found"
fi

# Also check for any remaining linera processes
PIDS=$(ps aux | grep "linera.*service" | grep -v grep | awk '{print $2}')
if [ -n "$PIDS" ]; then
    echo "Found additional linera processes: $PIDS"
    read -p "Kill them? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$PIDS" | xargs kill
        echo "✓ Additional processes stopped"
    fi
fi

echo "Done"




