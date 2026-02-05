# =============================================================================
# Pine Analytics - Unified Run Script (PowerShell)
# =============================================================================
# Builds, deploys, and runs the entire stack with one command
#
# Usage: .\run-all.ps1 [OPTIONS]
#   -BuildOnly       Only build, don't run services
#   -NoBuild         Skip building, just run services
#   -Testnet         Deploy to Linera Conway Testnet
#   -Port PORT       Set GraphQL port (default: 8080)
#   -FrontendPort    Set frontend port (default: 3000)
#
# =============================================================================

param(
    [switch]$BuildOnly,
    [switch]$NoBuild,
    [switch]$Testnet,
    [int]$Port = 8080,
    [int]$FrontendPort = 3000
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                     🌲 PINE ANALYTICS                        ║" -ForegroundColor Cyan
Write-Host "║              Blockchain Analytics Platform                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# Step 1: Check Prerequisites
# -----------------------------------------------------------------------------
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Blue

function Test-Command($Command, $InstallHint) {
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        Write-Host "✓ $Command found" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Command not found" -ForegroundColor Red
        Write-Host "   Install: $InstallHint" -ForegroundColor Yellow
        return $false
    }
}

Test-Command "node" "https://nodejs.org/"
Test-Command "npm" "https://nodejs.org/"

# Check for WSL and Linera
$hasWSL = $false
$hasLinera = $false
try {
    $wslCheck = wsl -e bash -c "which linera 2>/dev/null || source ~/.cargo/env 2>/dev/null && which linera" 2>$null
    if ($wslCheck) {
        $hasLinera = $true
        $hasWSL = $true
        Write-Host "✓ linera CLI found (WSL)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Linera CLI not found - will skip deployment" -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
# Step 2: Build Backend (WASM)
# -----------------------------------------------------------------------------
if (-not $NoBuild) {
    Write-Host ""
    Write-Host "[2/6] Building Linera smart contracts..." -ForegroundColor Blue
    
    if ($hasWSL) {
        wsl -e bash -c "source ~/.cargo/env 2>/dev/null; cd /mnt/c/Users/$env:USERNAME/Desktop/pine && cargo build --release --target wasm32-unknown-unknown -p pine-analytics"
        Write-Host "✓ WASM contracts built" -ForegroundColor Green
    } else {
        Write-Host "⚠ WSL not available - skipping WASM build" -ForegroundColor Yellow
    }
} else {
    Write-Host "[2/6] Skipping build (-NoBuild)" -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
# Step 3: Build Frontend
# -----------------------------------------------------------------------------
if (-not $NoBuild) {
    Write-Host ""
    Write-Host "[3/6] Installing frontend dependencies..." -ForegroundColor Blue
    
    Push-Location frontend
    npm install --silent 2>$null
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
    Pop-Location
} else {
    Write-Host "[3/6] Skipping frontend install (-NoBuild)" -ForegroundColor Yellow
}

if ($BuildOnly) {
    Write-Host ""
    Write-Host "✓ Build complete! (-BuildOnly mode)" -ForegroundColor Green
    exit 0
}

# -----------------------------------------------------------------------------
# Step 4: Deploy to Linera
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "[4/6] Deploying to Linera..." -ForegroundColor Blue

if ($hasLinera) {
    try {
        wsl -e bash -c "source ~/.cargo/env; cd /mnt/c/Users/$env:USERNAME/Desktop/pine/pine-analytics && linera project publish-and-create 2>&1" | Out-Null
        Write-Host "✓ Application deployed" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Deployment may have failed or app already exists" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Skipping deployment (no Linera CLI)" -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
# Step 5: Start Linera Service
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "[5/6] Starting Linera GraphQL service..." -ForegroundColor Blue

$lineraJob = $null
if ($hasLinera) {
    $portCheck = netstat -an | Select-String ":$Port "
    if ($portCheck) {
        Write-Host "  Port $Port already in use - service may be running" -ForegroundColor Yellow
    } else {
        $lineraJob = Start-Job -ScriptBlock {
            param($Port)
            wsl -e bash -c "source ~/.cargo/env; linera service --port $Port 2>&1"
        } -ArgumentList $Port
        Start-Sleep -Seconds 3
        Write-Host "✓ Linera service starting on port $Port" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ Skipping Linera service" -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
# Step 6: Start Frontend
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "[6/6] Starting frontend dev server..." -ForegroundColor Blue

Push-Location frontend
$env:VITE_GRAPHQL_ENDPOINT = "http://localhost:$Port"

$frontendJob = Start-Job -ScriptBlock {
    param($Path, $FrontendPort)
    Set-Location $Path
    npm run dev -- --port $FrontendPort 2>&1
} -ArgumentList (Get-Location).Path, $FrontendPort

Pop-Location
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    🚀 PINE ANALYTICS RUNNING                  ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Frontend:    http://localhost:$FrontendPort                         ║" -ForegroundColor Green
Write-Host "║  GraphQL:     http://localhost:$Port                              ║" -ForegroundColor Green
Write-Host "║  GraphiQL:    http://localhost:$Port                              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Cyan
Write-Host ""

# Open browser
Start-Process "http://localhost:$FrontendPort"

# Wait and cleanup
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if jobs are still running
        if ($frontendJob -and $frontendJob.State -eq 'Failed') {
            Write-Host "Frontend crashed! Check logs." -ForegroundColor Red
            break
        }
    }
} finally {
    Write-Host ""
    Write-Host "Shutting down services..." -ForegroundColor Yellow
    
    if ($frontendJob) { Stop-Job $frontendJob -ErrorAction SilentlyContinue; Remove-Job $frontendJob -ErrorAction SilentlyContinue }
    if ($lineraJob) { Stop-Job $lineraJob -ErrorAction SilentlyContinue; Remove-Job $lineraJob -ErrorAction SilentlyContinue }
    
    Write-Host "✓ All services stopped" -ForegroundColor Green
}
