#!/bin/bash
set -e

echo "Debugging WASM build..."

cd pine-analytics

echo ""
echo "1. Checking Cargo.toml..."
cat Cargo.toml | grep -A 5 "\[\[bin\]\]"

echo ""
echo "2. Cleaning build..."
cargo clean

echo ""
echo "3. Building with verbose output..."
cargo build --release --target wasm32-unknown-unknown --bin pine_analytics_contract --bin pine_analytics_service --verbose 2>&1 | tail -100

echo ""
echo "4. Checking target directory..."
if [ -d "target/wasm32-unknown-unknown/release" ]; then
    echo "Directory exists. Contents:"
    ls -la target/wasm32-unknown-unknown/release/ | head -30
    echo ""
    echo "Looking for .wasm files:"
    find target/wasm32-unknown-unknown/release -name "*.wasm" 2>/dev/null || echo "No .wasm files found"
    echo ""
    echo "Looking for binaries:"
    find target/wasm32-unknown-unknown/release -name "pine_analytics_*" 2>/dev/null || echo "No binary files found"
else
    echo "Target directory does not exist!"
fi




