#!/bin/bash
set -e

echo "================================"
echo "Setting up Linera Testnet Conway"
echo "================================"

# Check if Linera CLI is installed
if ! command -v linera &> /dev/null; then
    echo "Error: Linera CLI is not installed"
    echo "Install with: cargo install --locked linera-service@0.15.7"
    exit 1
fi

# Check Linera version
LINERA_VERSION=$(linera --version 2>&1 | head -1 || echo "unknown")
echo "Linera version: $LINERA_VERSION"

# Configuration
WALLET=${WALLET:-1}
FAUCET_URL=${FAUCET_URL:-"https://faucet.testnet-conway.linera.net"}

echo ""
echo "Configuration:"
echo "  Wallet: $WALLET"
echo "  Faucet: $FAUCET_URL"
echo "  Wallet directory: ~/.config/linera (default)"
echo ""

# Check if wallet already exists by trying to show it
echo ""
echo "Checking if wallet exists..."
if linera wallet show > /dev/null 2>&1; then
    echo "✓ Wallet already exists"
    WALLET_EXISTS=true
else
    echo "Wallet not found. Creating new wallet for Testnet Conway..."
    WALLET_EXISTS=false
    
    # For testnet, initialize wallet with faucet
    if linera wallet init --faucet "$FAUCET_URL" 2>&1 | grep -q "already exists"; then
        echo "✓ Wallet already exists (found existing keystore)"
        WALLET_EXISTS=true
    else
        echo "✓ Wallet initialized"
    fi
    
    # Request chain for testnet (only if wallet was just created)
    if [ "$WALLET_EXISTS" = false ]; then
        echo ""
        echo "Requesting chain from testnet..."
        linera wallet request-chain --faucet "$FAUCET_URL" 2>&1 || echo "Note: Chain request may have failed if chain already exists"
    fi
fi

# Get wallet info
echo ""
echo "Wallet information:"
linera wallet show

echo ""
echo "================================"
echo "Testnet Setup Complete!"
echo "================================"
echo ""
echo "Wallet location: ~/.config/linera (default)"
echo ""
if [ "$WALLET_EXISTS" = true ]; then
    echo "✓ Wallet is ready"
    echo ""
    echo "If you need additional chains:"
    echo "  linera wallet request-chain --faucet $FAUCET_URL"
    echo ""
fi
echo "Next steps:"
echo "1. Build project: ./scripts/build.sh"
echo "2. Deploy: ./scripts/deploy-testnet.sh"

