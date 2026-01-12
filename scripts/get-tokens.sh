#!/bin/bash
set -e

echo "================================"
echo "Getting Testnet Tokens"
echo "================================"

# Configuration
WALLET=${WALLET:-1}
FAUCET_URL=${FAUCET_URL:-"https://faucet.testnet-conway.linera.net/"}

echo "Faucet URL: $FAUCET_URL"
echo "Wallet: $WALLET"

# Get wallet address (from default wallet or chain)
echo ""
echo "Getting wallet information..."
WALLET_INFO=$(linera wallet show 2>&1)

# Extract address from wallet show output (try multiple formats)
ADDRESS=$(echo "$WALLET_INFO" | grep -iE "address|account" | head -1 | awk '{print $NF}' | tr -d ':,}' || echo "")
CHAIN_ID=$(echo "$WALLET_INFO" | grep -iE "chain" | head -1 | awk '{print $NF}' | tr -d ':,}' || echo "")

if [ -z "$ADDRESS" ] && [ -z "$CHAIN_ID" ]; then
    echo "Error: Could not get wallet information"
    echo "Wallet info output: $WALLET_INFO"
    echo "Make sure wallet is set up: ./scripts/setup-testnet.sh"
    exit 1
fi

if [ -n "$ADDRESS" ]; then
    echo "Wallet address: $ADDRESS"
fi
if [ -n "$CHAIN_ID" ]; then
    echo "Chain ID: $CHAIN_ID"
    # For testnet, we can use chain ID to request tokens
    ADDRESS="$CHAIN_ID"
fi

# Request tokens from faucet
echo ""
if [ -n "$CHAIN_ID" ]; then
    echo "Requesting tokens for chain from faucet..."
    echo "Chain ID: $CHAIN_ID"
    echo "This may take a moment..."
    
    # Use Linera CLI to request tokens (more reliable than curl)
    linera wallet request-chain --faucet "$FAUCET_URL"
else
    echo "Requesting tokens from faucet..."
    echo "Address: $ADDRESS"
    echo "This may take a moment..."
    
    RESPONSE=$(curl -s -X POST "$FAUCET_URL" \
        -H "Content-Type: application/json" \
        -d "{\"address\": \"$ADDRESS\"}" || echo "")
    
    if [ -z "$RESPONSE" ]; then
        echo "Warning: Direct faucet request failed, trying alternative method..."
        # Try using Linera CLI instead
        linera wallet request-chain --faucet "$FAUCET_URL" || true
    else
        echo "Faucet response: $RESPONSE"
    fi
fi

# Check balance
echo ""
echo "Checking wallet balance..."
sleep 2
linera wallet show

echo ""
echo "================================"
echo "Token Request Complete!"
echo "================================"
echo ""
echo "If tokens were successfully transferred, you can now deploy:"
echo "  ./scripts/deploy-testnet.sh"

