# ================================
# Setup Linera Testnet Conway
# ================================
# PowerShell version of setup-testnet.sh

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setting up Linera Testnet Conway" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if Linera CLI is installed
$lineraCmd = Get-Command linera -ErrorAction SilentlyContinue
if (-not $lineraCmd) {
    Write-Host "Error: Linera CLI is not installed" -ForegroundColor Red
    Write-Host "Install with: cargo install --locked linera-service@0.15.8" -ForegroundColor Yellow
    exit 1
}

# Check Linera version
$lineraVersion = & linera --version 2>&1 | Select-Object -First 1
Write-Host "Linera version: $lineraVersion"

# Configuration
$Wallet = if ($env:WALLET) { $env:WALLET } else { "1" }
$FaucetUrl = if ($env:FAUCET_URL) { $env:FAUCET_URL } else { "https://faucet.testnet-conway.linera.net" }

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Wallet: $Wallet"
Write-Host "  Faucet: $FaucetUrl"
Write-Host "  Wallet directory: ~/.config/linera (default)"
Write-Host ""

# Check if wallet already exists
Write-Host ""
Write-Host "Checking if wallet exists..."
$walletExists = $false
try {
    $walletOutput = & linera wallet show 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Wallet already exists" -ForegroundColor Green
        $walletExists = $true
    }
} catch {
    $walletExists = $false
}

if (-not $walletExists) {
    Write-Host "Wallet not found. Creating new wallet for Testnet Conway..."
    
    # Initialize wallet with faucet
    try {
        $initOutput = & linera wallet init --faucet "$FaucetUrl" 2>&1
        if ($initOutput -match "already exists") {
            Write-Host "[OK] Wallet already exists (found existing keystore)" -ForegroundColor Green
            $walletExists = $true
        } else {
            Write-Host "[OK] Wallet initialized" -ForegroundColor Green
        }
    } catch {
        Write-Host "Warning: Wallet init may have encountered an issue" -ForegroundColor Yellow
    }
    
    # Request chain for testnet (only if wallet was just created)
    if (-not $walletExists) {
        Write-Host ""
        Write-Host "Requesting chain from testnet..."
        try {
            & linera wallet request-chain --faucet "$FaucetUrl" 2>&1
            Write-Host "[OK] Chain requested" -ForegroundColor Green
        } catch {
            Write-Host "Note: Chain request may have failed if chain already exists" -ForegroundColor Yellow
        }
    }
}

# Get wallet info
Write-Host ""
Write-Host "Wallet information:" -ForegroundColor Cyan
& linera wallet show

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Testnet Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Wallet location: ~/.config/linera (default)"
Write-Host ""
if ($walletExists) {
    Write-Host "[OK] Wallet is ready" -ForegroundColor Green
    Write-Host ""
    Write-Host "If you need additional chains:"
    Write-Host "  linera wallet request-chain --faucet $FaucetUrl"
    Write-Host ""
}
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Build project: ./scripts/build.sh (or cargo build)"
Write-Host "2. Deploy: ./scripts/deploy-testnet.ps1"
