/**
 * Hugging Face upload script
 * Uploads the custom LLM to Hugging Face Hub
 */

import { HfInference } from '@huggingface/inference';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const HF_TOKEN = process.env.HF_TOKEN;
const MODEL_ID = process.env.MODEL_ID || 'your-username/js-llm-memory';
const REPO_TYPE = 'model';

async function uploadToHuggingFace() {
  if (!HF_TOKEN) {
    console.error('Error: HF_TOKEN environment variable is required');
    console.error('Set it with: export HF_TOKEN=your_token_here');
    process.exit(1);
  }

  console.log('Preparing to upload to Hugging Face...');
  console.log(`Model ID: ${MODEL_ID}`);
  console.log('');

  try {
    // Initialize HF client
    const hf = new HfInference(HF_TOKEN);

    // Create model card
    const modelCard = generateModelCard();
    fs.writeFileSync(path.join(__dirname, '..', 'README.md'), modelCard);
    console.log('✓ Model card created');

    // Create model configuration
    const config = generateConfig();
    fs.writeFileSync(path.join(__dirname, '..', 'config.json'), JSON.stringify(config, null, 2));
    console.log('✓ Model config created');

    // Save model state
    const CustomLLM = (await import('../src/llm.js')).default;
    const llm = new CustomLLM();
    const state = llm.saveState();
    fs.writeFileSync(path.join(__dirname, '..', 'pytorch_model.bin.json'), JSON.stringify(state, null, 2));
    console.log('✓ Model state saved');

    // Create tokenizer config
    const tokenizerConfig = generateTokenizerConfig();
    fs.writeFileSync(path.join(__dirname, '..', 'tokenizer_config.json'), JSON.stringify(tokenizerConfig, null, 2));
    console.log('✓ Tokenizer config created');

    console.log('');
    console.log('Files prepared for upload');
    console.log('');
    console.log('To complete the upload, use the Hugging Face CLI:');
    console.log('');
    console.log('  huggingface-cli login');
    console.log(`  huggingface-cli repo create ${MODEL_ID.split('/')[1]} --type model`);
    console.log('  git clone https://huggingface.co/' + MODEL_ID);
    console.log('  cp -r * ' + MODEL_ID.split('/')[1] + '/');
    console.log('  cd ' + MODEL_ID.split('/')[1]);
    console.log('  git add .');
    console.log('  git commit -m "Initial upload of custom JS LLM with memory"');
    console.log('  git push');
    console.log('');

  } catch (error) {
    console.error('Error during upload preparation:', error);
    process.exit(1);
  }
}

function generateModelCard() {
  return `---
language: en
license: mit
tags:
- llm
- memory
- javascript
- nlp
- custom
---

# Custom LLM with Memory System

A custom Large Language Model implemented from scratch in JavaScript with a sophisticated memory system.

## Model Description

This LLM features:
- **Custom Tokenizer**: English language tokenization with subword support
- **Memory System**: Short-term (conversation context) and long-term (persistent knowledge) memory
- **Attention Mechanism**: Simplified self-attention for context understanding
- **Feed-Forward Networks**: Neural network layers for text generation
- **Learning Capability**: Learns from interactions to improve responses

## Architecture

- **Embedding Dimension**: 128
- **Context Window**: 512 tokens
- **Vocabulary Size**: ~150 tokens (expandable)
- **Memory Types**: Short-term (10 items) and long-term (unlimited)
- **Retrieval**: Cosine similarity-based memory retrieval

## Usage

### JavaScript/Node.js

\`\`\`javascript
import CustomLLM from './src/llm.js';

const llm = new CustomLLM({
  embeddingDim: 128,
  contextWindow: 512,
  temperature: 0.7
});

const response = llm.generate("Hello, how are you?");
console.log(response);
\`\`\`

### API Server

\`\`\`bash
npm start
\`\`\`

Then use the API:

\`\`\`bash
curl -X POST http://localhost:3000/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello"}'
\`\`\`

## Memory System

The model includes a dual memory system:

1. **Short-term Memory**: Maintains conversation context (last 10 exchanges)
2. **Long-term Memory**: Stores persistent knowledge with importance scoring
3. **Retrieval**: Uses cosine similarity to find relevant memories

## Training

This model uses randomly initialized weights. For production use, train on your dataset:

\`\`\`javascript
llm.learn(input, output, importance);
\`\`\`

## Limitations

- Randomly initialized weights (not pre-trained)
- Small vocabulary size
- Simplified attention mechanism
- English language only
- No GPU acceleration

## Intended Use

- Educational purposes
- Prototyping custom LLM architectures
- Memory system research
- JavaScript-based NLP applications

## License

MIT License

## Author

Custom LLM Project

## Citation

\`\`\`bibtex
@software{js_llm_memory,
  title={Custom LLM with Memory System},
  author={Custom LLM Project},
  year={2024},
  url={https://huggingface.co/${MODEL_ID}}
}
\`\`\`
`;
}

function generateConfig() {
  return {
    architecture: "CustomLLM",
    embedding_dim: 128,
    context_window: 512,
    vocab_size: 150,
    temperature: 0.7,
    top_k: 5,
    memory_config: {
      short_term_capacity: 10,
      retrieval_threshold: 0.3
    },
    torch_dtype: "float32",
    transformers_version: "4.0.0"
  };
}

function generateTokenizerConfig() {
  return {
    tokenizer_type: "CustomTokenizer",
    vocab_size: 150,
    special_tokens: {
      pad: 0,
      unk: 1,
      bos: 2,
      eos: 3
    },
    clean_up_tokenization_spaces: true,
    language: "english"
  };
}

// Run upload
uploadToHuggingFace();
