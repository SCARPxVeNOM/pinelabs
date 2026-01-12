# Main Function Fix

## Issue

When building for WASM target, Rust was complaining that `main` function was not found, even though we had conditional compilation:

```rust
#[cfg(not(target_arch = "wasm32"))]
fn main() { }

#[cfg(target_arch = "wasm32")]
linera_sdk::contract!(AnalyticsContract);
```

Error:
```
error[E0601]: `main` function not found in crate `pine_analytics_contract`
```

## Root Cause

Rust's binary crate compilation requires a `main` function to be present, even for WASM builds. The `linera_sdk::contract!` and `linera_sdk::service!` macros generate WASM-specific entry points (exports), but they don't generate a `main` function that Rust's compiler can see.

## Solution

Have BOTH the macro and the `main` function present, without conditional compilation:

```rust
// Entry point - macro generates WASM exports
linera_sdk::contract!(AnalyticsContract);

// Main function required for binary crate compilation
#[allow(dead_code)]
fn main() {
    // For WASM builds, the macro generates the actual entry point
    // For non-WASM builds, this provides a binary entry point
}
```

This pattern:
1. **For WASM builds**: The macro generates WASM entry points (exports), and the `main` function satisfies Rust's binary crate requirement (but isn't used at runtime)
2. **For non-WASM builds**: The `main` function provides the binary entry point, and the macro doesn't interfere

## Files Changed

1. **pine-analytics/src/contract.rs** - Added `main()` function after macro
2. **pine-analytics/src/service.rs** - Added `main()` function after macro

Both files now have:
- The `linera_sdk::contract!` / `linera_sdk::service!` macro call
- A `main()` function with `#[allow(dead_code)]` attribute

The `#[allow(dead_code)]` attribute suppresses warnings about the `main` function not being used in WASM builds, since the macro-generated code handles the actual entry point.



