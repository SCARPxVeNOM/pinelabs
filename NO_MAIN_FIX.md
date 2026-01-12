# No Main Function Fix

## Issue

Following the pattern from linCasino project, WASM binaries should use `#![cfg_attr(target_arch = "wasm32", no_main)]` at the top of the file and should NOT have a `main()` function.

## Solution

Updated both `pine-analytics/src/contract.rs` and `pine-analytics/src/service.rs` to match the linCasino pattern:

1. **Added `#![cfg_attr(target_arch = "wasm32", no_main)]`** at the top of both files
2. **Removed the `main()` function** entirely

This tells Rust that for WASM builds, there's no `main` function (the macro generates the entry points), and for non-WASM builds, these are WASM-only binaries anyway.

## Pattern from linCasino

The linCasino project uses this pattern:

```rust
#![cfg_attr(target_arch = "wasm32", no_main)]

// ... code ...

linera_sdk::contract!(BankrollContract);
// No main() function
```

## Files Changed

1. **pine-analytics/src/contract.rs**:
   - Added `#![cfg_attr(target_arch = "wasm32", no_main)]` at the top
   - Removed `main()` function
   - Kept `linera_sdk::contract!(AnalyticsContract);` macro

2. **pine-analytics/src/service.rs**:
   - Added `#![cfg_attr(target_arch = "wasm32", no_main)]` at the top
   - Removed `main()` function
   - Kept `linera_sdk::service!(AnalyticsService);` macro

## Expected Behavior

Now the code matches the linCasino pattern exactly. When building for WASM:
- `no_main` is set, so Rust doesn't expect a `main` function
- The macro generates all the necessary entry points
- WASM binaries should be generated successfully



