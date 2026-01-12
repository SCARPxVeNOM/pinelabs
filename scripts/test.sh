#!/bin/bash
set -e

echo "================================"
echo "Testing Pine Analytics"
echo "================================"

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v rustc &> /dev/null; then
    echo "Error: Rust is not installed"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    echo "Error: Cargo is not installed"
    exit 1
fi

# Check Rust version
RUST_VERSION=$(rustc --version | awk '{print $2}')
echo "Rust version: $RUST_VERSION"

# Run Rust tests
echo ""
echo "Running Rust tests..."
cd pine-analytics

echo "Running cargo test..."
cargo test --lib --tests

if [ $? -eq 0 ]; then
    echo "✓ All Rust tests passed"
else
    echo "✗ Rust tests failed"
    exit 1
fi

# Check compilation
echo ""
echo "Checking WASM compilation..."
cargo check --target wasm32-unknown-unknown

if [ $? -eq 0 ]; then
    echo "✓ WASM compilation check passed"
else
    echo "✗ WASM compilation check failed"
    exit 1
fi

cd ..

echo ""
echo "================================"
echo "All Tests Passed!"
echo "================================"



