# Crate Type Fix

## Issue

Added `crate-type = ["cdylib"]` to binary definitions, which caused an error:
```
error: failed to parse manifest at `/mnt/c/Users/aryan/Desktop/pine/pine-analytics/Cargo.toml`
Caused by: the target `pine_analytics_contract` is a binary and can't have any crate-types set (currently "cdylib")
```

## Root Cause

Binary crates (`[[bin]]`) cannot have `crate-type` set. The `crate-type` attribute is only valid for library crates (`[lib]`).

## Solution

Removed `crate-type = ["cdylib"]` from both binary definitions. Binaries for WASM targets should produce `.wasm` files automatically without any special configuration.

## Files Changed

1. **pine-analytics/Cargo.toml** - Removed `crate-type = ["cdylib"]` from both binary definitions

The binaries are now defined as:
```toml
[[bin]]
name = "pine_analytics_contract"
path = "src/contract.rs"

[[bin]]
name = "pine_analytics_service"
path = "src/service.rs"
```

This matches the pattern used in the linCasino project, which successfully builds WASM binaries.

## Next Steps

The build should now work. Binary crates for `wasm32-unknown-unknown` target automatically produce `.wasm` files without any special configuration.



