# Fixes Applied

## Issue: Missing main functions for binaries

### Problem
The `linera_sdk::contract!` and `linera_sdk::service!` macros were failing because binaries need `main` functions for non-WASM targets.

### Solution
Added conditional compilation:
- `#[cfg(not(target_arch = "wasm32"))]` - Provides main function for regular builds
- `#[cfg(target_arch = "wasm32")]` - Uses the macro for WASM builds

### Files Changed
1. **pine-analytics/src/contract.rs** - Added conditional main function
2. **pine-analytics/src/service.rs** - Added conditional main function

### Result
The project should now compile successfully for both regular and WASM targets.



