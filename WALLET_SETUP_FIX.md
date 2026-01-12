# Wallet Setup Fix

## Issue

The wallet setup script was trying to initialize a wallet that already existed, causing an error:
```
ERROR linera: Error is Keystore already exists: /home/aryan/.config/linera/keystore.json
```

But when running `linera wallet show`, the wallet already exists and has 3 chains.

## Solution

Updated `scripts/setup-testnet.sh` to:
1. Check if wallet exists by running `linera wallet show` first
2. Skip initialization if wallet already exists
3. Handle the case where keystore already exists gracefully

## Changes Made

### 1. Wallet Detection
- Changed from checking file existence to checking if `linera wallet show` succeeds
- This is more reliable as Linera CLI handles wallet locations

### 2. Default Wallet Location
- Linera CLI uses `~/.config/linera/` by default (not `~/.linera/`)
- Removed manual path configuration - let Linera CLI use defaults
- Removed `--with-wallet` flags - not needed with default wallet

### 3. Updated Deploy Script
- Removed `--with-wallet` flags from deploy script
- Uses default wallet location
- Updated to get admin owner from wallet show output

## Current Wallet Status

Your wallet is already set up with 3 chains:
1. **Chain ID: 9acf0978...** (DEFAULT) - Default owner: 0x6c49ef85...
2. **Chain ID: 8fd4233c...** (ADMIN) - No owner key
3. **Chain ID: 5df67c90...** - Default owner: 0x9d523264...

## Next Steps

Since your wallet is already set up, you can:

1. **Build the project:**
   ```bash
   ./scripts/build.sh
   ```

2. **Deploy to testnet:**
   ```bash
   ./scripts/deploy-testnet.sh
   ```

The deploy script will automatically:
- Use the default wallet
- Extract the admin owner from the first chain
- Publish bytecode
- Create the application instance

## Updated Scripts

- ✅ `scripts/setup-testnet.sh` - Now handles existing wallets
- ✅ `scripts/deploy-testnet.sh` - Removed `--with-wallet` flags
- ✅ `scripts/check-wallet.sh` - New utility to check wallet status

## Default Wallet Location

Linera CLI uses: `~/.config/linera/`

Files:
- `wallet.json` - Wallet file
- `keystore.json` - Keystore file
- Other chain data

## Reference

Your wallet is ready to use. No need to run `setup-testnet.sh` again unless you want to create a new wallet.



