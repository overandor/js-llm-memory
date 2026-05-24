#!/bin/bash

# Build script for WebAssembly module

set -e

echo "Building WebAssembly module..."

# Install wasm-pack if not installed
if ! command -v wasm-pack &> /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WASM package
cd wasm
wasm-pack build --target web --out-dir pkg

echo "WebAssembly module built successfully!"
echo "Output: wasm/pkg/"
