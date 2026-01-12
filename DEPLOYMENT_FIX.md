# Deployment Script Fix

## Issue

The `setup-testnet.sh` script was using incorrect Linera CLI syntax:
- ❌ `linera wallet init --wallet <path>` (incorrect)
- ✅ `linera wallet init --faucet <url>` (correct for testnet)

## Fix Applied

Updated `scripts/setup-testnet.sh` to use the correct Linera CLI syntax for Testnet Conway:

### Before
```bash
linera wallet init \
    --wallet "$LINERA_WALLET" \
    --keystore "$LINERA_KEYSTORE" \
    --storage "$LINERA_STORAGE" \
    --with-genesis
```

### After
```bash
linera wallet init --faucet https://faucet.testnet-conway.linera.net
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net
```

## Changes

1. **Removed `--wallet`, `--keystore`, `--storage` flags** - Linera CLI uses default locations
2. **Added `--faucet` flag** - Required for testnet initialization
3. **Added chain request** - Required to get a chain on testnet
4. **Simplified wallet check** - Uses default location `~/.linera/`
5. **Updated `get-tokens.sh`** - Uses Linera CLI for token requests

## Testnet Conway Wallet Setup

The correct process for Testnet Conway:

```bash
# 1. Initialize wallet with faucet
linera wallet init --faucet https://faucet.testnet-conway.linera.net

# 2. Request chain from faucet
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net

# 3. View wallet
linera wallet show
```

## Wallet Location

Linera CLI uses default locations:
- **Wallet**: `~/.linera/wallet_*.json`
- **Storage**: `~/.linera/`
- No need to specify paths manually

## Updated Scripts

- ✅ `scripts/setup-testnet.sh` - Fixed wallet initialization
- ✅ `scripts/get-tokens.sh` - Updated token request method
- ✅ `scripts/deploy-testnet.sh` - Already correct (uses `--with-wallet`)

## Testing

Run the fixed script:

```bash
./scripts/setup-testnet.sh
```

Expected output:
- Wallet initialized successfully
- Chain requested from faucet
- Wallet information displayed

## Reference

- Linera Testnet Conway documentation
- Linera CLI syntax: `linera wallet init --help`
- Faucet URL: https://faucet.testnet-conway.linera.net



