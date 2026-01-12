fn main() {
    // Build script for WASM compilation
    println!("cargo:rerun-if-changed=src/");
}
