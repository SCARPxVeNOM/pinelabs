#!/bin/bash
# Quick script to check wallet status

echo "Checking Linera wallet status..."
echo ""

if ! command -v linera &> /dev/null; then
    echo "Error: Linera CLI is not installed"
    exit 1
fi

echo "Wallet information:"
linera wallet show

echo ""
echo "To request a new chain (if needed):"
echo "  linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net"



