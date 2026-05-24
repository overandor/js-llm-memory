# Custom LLM with Memory System

A custom Large Language Model implemented from scratch in JavaScript with a sophisticated memory system and zero-knowledge proof capabilities.

## Features

- **Custom Tokenizer**: English language tokenization with subword support
- **Memory System**: Short-term (conversation context) and long-term (persistent knowledge) memory
- **ZK Memory**: Zero-knowledge proof memory system using WebAssembly
- **Attention Mechanism**: Simplified self-attention for context understanding
- **Feed-Forward Networks**: Neural network layers for text generation
- **Learning Capability**: Learns from interactions to improve responses
- **REST API**: Express-based API server for easy integration
- **Hugging Face Ready**: Scripts for uploading to Hugging Face Hub
- **CI/CD Pipeline**: Automated testing and deployment

## Installation

```bash
npm install
```

### Building WebAssembly Module

The ZK memory system requires a WebAssembly module built from Rust:

```bash
# Install Rust if not already installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack

# Build the WASM module
npm run build:wasm
```

Or manually:

```bash
cd wasm
wasm-pack build --target web --out-dir pkg
```

## Usage

### Interactive CLI

```bash
npm start
```

### API Server

```bash
node src/server.js
```

The API will be available at `http://localhost:3000`

### API Endpoints

#### LLM Endpoints
- `POST /chat` - Chat with the LLM
- `POST /generate` - Generate text from a prompt
- `POST /learn` - Teach the LLM from examples
- `GET /memory/short-term` - Get conversation context
- `GET /memory/long-term` - Get persistent memories
- `POST /memory/retrieve` - Retrieve relevant memories
- `GET /model/info` - Get model information
- `GET /model/export` - Export model state

#### ZK Memory Endpoints
- `GET /zk/status` - Check ZK memory system status
- `POST /zk/entry` - Add entry to ZK memory
- `GET /zk/entry/:key` - Get entry from ZK memory
- `POST /zk/verify` - Verify entry hash
- `POST /zk/commitment` - Generate ZK commitment
- `POST /zk/proof` - Create ZK proof for entry
- `POST /zk/verify-proof` - Verify ZK proof
- `GET /zk/merkle-root` - Get Merkle root of all entries
- `GET /zk/hashes` - Get all entry hashes
- `GET /zk/count` - Get entry count
- `DELETE /zk/clear` - Clear ZK memory

### Example API Usage

```bash
# Chat
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'

# Generate text
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "The future of AI is", "maxLength": 50}'

# Learn from example
curl -X POST http://localhost:3000/learn \
  -H "Content-Type: application/json" \
  -d '{"input": "What is JS?", "output": "JavaScript is a programming language", "importance": 1.0}'

# ZK Memory - Add entry
curl -X POST http://localhost:3000/zk/entry \
  -H "Content-Type: application/json" \
  -d '{"key": "user123", "value": "secret data"}'

# ZK Memory - Create proof
curl -X POST http://localhost:3000/zk/proof \
  -H "Content-Type: application/json" \
  -d '{"key": "user123", "value": "secret data"}'

# ZK Memory - Get Merkle root
curl http://localhost:3000/zk/merkle-root
```

## Architecture

### Model Components

- **Tokenizer** (`src/tokenizer.js`): English tokenization with vocabulary management
- **Memory System** (`src/memory.js`): Dual memory system with retrieval
- **LLM Engine** (`src/llm.js`): Core inference engine with attention and feed-forward layers
- **API Server** (`src/server.js`): Express-based REST API
- **ZK Bridge** (`src/zk-bridge.js`): JavaScript bridge for WASM ZK operations
- **ZK WASM** (`wasm/src/lib.rs`): Rust WebAssembly module for ZK proofs

### Memory System

The model includes a dual memory system:

1. **Short-term Memory**: Maintains conversation context (last 10 exchanges)
2. **Long-term Memory**: Stores persistent knowledge with importance scoring
3. **Retrieval**: Uses cosine similarity to find relevant memories

### ZK Memory System

The zero-knowledge memory system provides cryptographic guarantees:

1. **ZK Proofs**: Generate and verify zero-knowledge proofs for memory entries
2. **Commitments**: Create cryptographic commitments for memory keys
3. **Merkle Tree**: Maintain Merkle root for all memory entries
4. **Hash Verification**: Verify entry integrity using SHA-256 hashes
5. **WebAssembly**: High-performance ZK operations via Rust WASM

### Model Parameters

- **Embedding Dimension**: 128
- **Context Window**: 512 tokens
- **Vocabulary Size**: ~150 tokens (expandable)
- **Temperature**: 0.7 (configurable)
- **Top-K Sampling**: 5 (configurable)

## Development

### Project Structure

```
js-llm-memory/
├── src/
│   ├── tokenizer.js      # Tokenization logic
│   ├── memory.js         # Memory system
│   ├── llm.js            # Core LLM engine
│   ├── server.js         # API server
│   └── index.js          # CLI entry point
├── scripts/
│   └── upload-hf.js      # Hugging Face upload script
├── test/
│   └── test.js           # Test suite
├── package.json
└── README.md
```

### Testing

```bash
npm test
```

## Hugging Face Upload

To upload to Hugging Face:

1. Set your Hugging Face token:
```bash
export HF_TOKEN=your_token_here
export MODEL_ID=your-username/js-llm-memory
```

2. Run the upload preparation script:
```bash
npm run upload-hf
```

3. Follow the printed instructions to complete the upload using the Hugging Face CLI

## GitHub

This project is ready for GitHub. The repository is already initialized.

To push to GitHub:

```bash
git add .
git commit -m "Initial commit: Custom LLM with memory system"
git branch -M main
git remote add origin https://github.com/your-username/js-llm-memory.git
git push -u origin main
```

## Limitations

- Randomly initialized weights (not pre-trained)
- Small vocabulary size
- Simplified attention mechanism
- English language only
- No GPU acceleration
- Educational/prototype quality

## Intended Use

- Educational purposes
- Prototyping custom LLM architectures
- Memory system research
- JavaScript-based NLP applications

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Future Improvements

- [ ] Pre-trained weights integration
- [ ] Larger vocabulary
- [ ] Multi-language support
- [ ] GPU acceleration via WebGPU
- [ ] Training pipeline
- [ ] Fine-tuning capabilities
- [ ] More sophisticated attention mechanisms
- [ ] Vector database integration for memory
