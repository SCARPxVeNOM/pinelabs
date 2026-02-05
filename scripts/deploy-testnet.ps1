# ================================
# Deploy Pine Analytics to Testnet Conway
# ================================
# PowerShell version of deploy-testnet.sh

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Deploying Pine Analytics to Testnet Conway" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Configuration
$Wallet = if ($env:WALLET) { $env:WALLET } else { "1" }
$Port = if ($env:PORT) { $env:PORT } else { "8080" }
$AdminOwner = if ($env:ADMIN_OWNER) { $env:ADMIN_OWNER } else { "" }

# Check if Linera CLI is installed
$lineraCmd = Get-Command linera -ErrorAction SilentlyContinue
if (-not $lineraCmd) {
    Write-Host "Error: Linera CLI is not installed" -ForegroundColor Red
    Write-Host "Install with: cargo install --locked linera-service@0.15.8" -ForegroundColor Yellow
    exit 1
}

# Check if binaries exist
$ContractWasm = "target/wasm32-unknown-unknown/release/pine_analytics_contract.wasm"
$ServiceWasm = "target/wasm32-unknown-unknown/release/pine_analytics_service.wasm"

if (-not (Test-Path $ContractWasm) -or -not (Test-Path $ServiceWasm)) {
    Write-Host "Error: WASM binaries not found" -ForegroundColor Red
    Write-Host "Run: ./scripts/build.sh" -ForegroundColor Yellow
    exit 1
}

# Get admin owner if not set
if ([string]::IsNullOrEmpty($AdminOwner)) {
    Write-Host "Getting admin owner from wallet..."
    try {
        $walletOutput = & linera wallet show 2>&1
        $ownerLine = $walletOutput | Select-String -Pattern "Default owner" | Select-Object -First 1
        if ($ownerLine) {
            $AdminOwner = ($ownerLine -split '\s+')[-1] -replace '^0x', ''
            if (-not [string]::IsNullOrEmpty($AdminOwner) -and $AdminOwner -ne "No") {
                if (-not $AdminOwner.StartsWith("0x")) {
                    $AdminOwner = "0x$AdminOwner"
                }
            } else {
                $AdminOwner = ""
            }
        }
    } catch {
        Write-Host "Warning: Could not get admin owner from wallet" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Wallet: $Wallet"
Write-Host "  Admin Owner: $AdminOwner"
Write-Host "  Port: $Port"
Write-Host "  Contract: $ContractWasm"
Write-Host "  Service: $ServiceWasm"

# Check wallet balance
Write-Host ""
Write-Host "Checking wallet status..."
& linera wallet show

# Publish and create application
Write-Host ""
Write-Host "Publishing bytecode and creating application on Testnet Conway..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on testnet..."

try {
    if ([string]::IsNullOrEmpty($AdminOwner)) {
        $CreateOutput = & linera publish-and-create $ContractWasm $ServiceWasm --json-argument "{}" 2>&1
    } else {
        $jsonArg = "{`"admin_owner`": `"$AdminOwner`"}"
        $CreateOutput = & linera publish-and-create $ContractWasm $ServiceWasm --json-argument $jsonArg 2>&1
    }
    
    Write-Host ""
    Write-Host "Output:"
    Write-Host $CreateOutput
} catch {
    Write-Host ""
    Write-Host "Error: publish-and-create failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Extract IDs (simplified - may need adjustment based on actual output format)
$AppId = ""
$BytecodeId = ""

# Try to extract from output
$outputString = $CreateOutput -join "`n"
if ($outputString -match '([a-f0-9]{64})') {
    $matches = [regex]::Matches($outputString, '[a-f0-9]{64}')
    if ($matches.Count -ge 1) {
        $BytecodeId = $matches[0].Value
    }
    if ($matches.Count -ge 2) {
        $AppId = $matches[-1].Value
    }
}

if ([string]::IsNullOrEmpty($AppId)) {
    Write-Host "Warning: Could not extract application ID from output" -ForegroundColor Yellow
    Write-Host "Please check the output above and extract manually" -ForegroundColor Yellow
}

# Get chain ID
$ChainId = ""
try {
    $walletOutput = & linera wallet show 2>&1
    $chainLine = $walletOutput | Select-String -Pattern "Chain ID:" | Select-Object -First 1
    if ($chainLine) {
        $ChainId = ($chainLine -split '\s+')[-1]
    }
} catch { }

# Save deployment info
$Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
$DeploymentInfo = @{
    network = "testnet-conway"
    bytecode_id = $BytecodeId
    application_id = $AppId
    chain_id = $ChainId
    admin_owner = $AdminOwner
    port = [int]$Port
    wallet = [int]$Wallet
    deployed_at = $Timestamp
    graphql_endpoint = "http://localhost:$Port/chains/$ChainId/applications/$AppId"
    faucet_url = "https://faucet.testnet-conway.linera.net/"
}

$DeploymentInfo | ConvertTo-Json | Out-File -FilePath "deployment-testnet.json" -Encoding utf8

# Also copy to frontend public folder
$frontendPublic = "frontend/public"
if (Test-Path $frontendPublic) {
    $DeploymentInfo | ConvertTo-Json | Out-File -FilePath "$frontendPublic/deployment-testnet.json" -Encoding utf8
    Write-Host "[OK] Deployment info copied to frontend/public/" -ForegroundColor Green
}

Write-Host ""
Write-Host "[OK] Deployment info saved to deployment-testnet.json" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Network: Testnet Conway"
Write-Host "Application ID: $AppId"
Write-Host "Bytecode ID: $BytecodeId"
Write-Host "Chain ID: $ChainId"
Write-Host "Admin Owner: $AdminOwner"
Write-Host ""
Write-Host "GraphQL Endpoint:"
Write-Host "  http://localhost:$Port/chains/$ChainId/applications/$AppId"
Write-Host ""
Write-Host "To start the service:" -ForegroundColor Cyan
Write-Host "  linera service --port $Port"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the GraphQL service"
Write-Host "2. Start frontend: cd frontend; npm run dev"
