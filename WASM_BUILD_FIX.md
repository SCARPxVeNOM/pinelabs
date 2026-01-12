# WASM Build Fix

## Issue

The build was completing successfully but WASM binaries weren't being generated. The build output showed:
```
Finished `release` profile [optimized + debuginfo] target(s) in 46.14s
Error: Contract WASM not found at target/wasm32-unknown-unknown/release/pine_analytics_contract.wasm
```

## Root Cause

The entry point configuration was incorrect. The `linera_sdk::contract!` and `linera_sdk::service!` macros should only be used for WASM builds, and a `main()` function should only exist for non-WASM builds.

**Previous (incorrect) pattern:**
```rust
linera_sdk::contract!(AnalyticsContract);  // Always called
fn main() { }  // Always present (conflicting with macro)
```

**Correct pattern:**
```rust
#[cfg(not(target_arch = "wasm32"))]
fn main() { }  // Only for non-WASM builds

#[cfg(target_arch = "wasm32")]
linera_sdk::contract!(AnalyticsContract);  // Only for WASM builds
```

## Fix Applied

Updated both `pine-analytics/src/contract.rs` and `pine-analytics/src/service.rs` to use proper conditional compilation:

1. **Contract (`src/contract.rs`):**
   - `main()` function only compiled for non-WASM targets
   - `linera_sdk::contract!` macro only called for WASM targets

2. **Service (`src/service.rs`):**
   - `main()` function only compiled for non-WASM targets
   - `linera_sdk::service!` macro only called for WASM targets

## Expected Behavior

When building for WASM target (`wasm32-unknown-unknown`):
- The `#[cfg(target_arch = "wasm32")]` branch is active
- The `linera_sdk::contract!` and `linera_sdk::service!` macros generate WASM entry points
- The `main()` function is not compiled

When building for regular targets:
- The `#[cfg(not(target_arch = "wasm32"))]` branch is active
- The `main()` function provides a binary entry point
- The macros are not called

## Testing

After this fix, building should generate WASM binaries:
```bash
cargo build --release --target wasm32-unknown-unknown --bins
```

Expected output:
- `target/wasm32-unknown-unknown/release/pine_analytics_contract.wasm`
- `target/wasm32-unknown-unknown/release/pine_analytics_service.wasm`

## Reference

This pattern matches the Linera SDK documentation and examples. The conditional compilation ensures that:
1. WASM builds use the SDK macros to generate proper entry points
2. Non-WASM builds have a valid `main()` function for Rust binary requirements
3. No conflicts between macro-generated code and explicit main functions



