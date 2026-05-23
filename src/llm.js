/**
 * Custom LLM inference engine in JavaScript
 * Implements a simple transformer-like architecture from scratch
 */

import Tokenizer from './tokenizer.js';
import MemorySystem from './memory.js';

class CustomLLM {
  constructor(options = {}) {
    this.tokenizer = new Tokenizer();
    this.memory = new MemorySystem(options.memory);
    
    // Model architecture parameters
    this.vocabSize = this.tokenizer.getVocabSize();
    this.embeddingDim = options.embeddingDim || 128;
    this.contextWindow = options.contextWindow || 512;
    this.temperature = options.temperature || 0.7;
    this.topK = options.topK || 5;
    
    // Initialize embeddings (random for now, in production would load trained weights)
    this.embeddings = this.initializeEmbeddings();
    
    // Attention weights (simplified)
    this.attentionWeights = this.initializeAttentionWeights();
    
    // Feed-forward weights
    this.ffnWeights = this.initializeFFNWeights();
    
    // Output layer
    this.outputWeights = this.initializeOutputWeights();
  }

  /**
   * Initialize random embeddings
   */
  initializeEmbeddings() {
    const embeddings = [];
    for (let i = 0; i < this.vocabSize; i++) {
      const embedding = [];
      for (let j = 0; j < this.embeddingDim; j++) {
        embedding.push((Math.random() - 0.5) * 0.1);
      }
      embeddings.push(embedding);
    }
    return embeddings;
  }

  /**
   * Initialize attention weights
   */
  initializeAttentionWeights() {
    return {
      q: this.randomMatrix(this.embeddingDim, this.embeddingDim),
      k: this.randomMatrix(this.embeddingDim, this.embeddingDim),
      v: this.randomMatrix(this.embeddingDim, this.embeddingDim),
      o: this.randomMatrix(this.embeddingDim, this.embeddingDim)
    };
  }

  /**
   * Initialize feed-forward weights
   */
  initializeFFNWeights() {
    return {
      w1: this.randomMatrix(this.embeddingDim, this.embeddingDim * 4),
      w2: this.randomMatrix(this.embeddingDim * 4, this.embeddingDim)
    };
  }

  /**
   * Initialize output weights
   */
  initializeOutputWeights() {
    return this.randomMatrix(this.embeddingDim, this.vocabSize);
  }

  /**
   * Create random matrix
   */
  randomMatrix(rows, cols) {
    const matrix = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        row.push((Math.random() - 0.5) * 0.1);
      }
      matrix.push(row);
    }
    return matrix;
  }

  /**
   * Matrix multiplication
   */
  matmul(A, B) {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    
    const result = [];
    for (let i = 0; i < rowsA; i++) {
      const row = [];
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += A[i][k] * B[k][j];
        }
        row.push(sum);
      }
      result.push(row);
    }
    return result;
  }

  /**
   * Apply attention mechanism
   */
  applyAttention(input) {
    // Simplified self-attention
    const Q = this.matmul(input, this.attentionWeights.q);
    const K = this.matmul(input, this.attentionWeights.k);
    const V = this.matmul(input, this.attentionWeights.v);
    
    // Compute attention scores (simplified)
    const attentionScores = this.computeAttentionScores(Q, K);
    const weightedValues = this.applyAttentionWeights(attentionScores, V);
    
    return this.matmul(weightedValues, this.attentionWeights.o);
  }

  /**
   * Compute attention scores
   */
  computeAttentionScores(Q, K) {
    // Simplified: just use dot product
    const scores = [];
    for (let i = 0; i < Q.length; i++) {
      const row = [];
      for (let j = 0; j < K.length; j++) {
        let sum = 0;
        for (let k = 0; k < Q[i].length; k++) {
          sum += Q[i][k] * K[j][k];
        }
        row.push(sum);
      }
      scores.push(row);
    }
    return this.softmax(scores);
  }

  /**
   * Apply attention weights to values
   */
  applyAttentionWeights(scores, V) {
    const result = [];
    for (let i = 0; i < scores.length; i++) {
      const row = [];
      for (let j = 0; j < V[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < scores[i].length; k++) {
          sum += scores[i][k] * V[k][j];
        }
        row.push(sum);
      }
      result.push(row);
    }
    return result;
  }

  /**
   * Softmax activation
   */
  softmax(matrix) {
    const result = [];
    for (let i = 0; i < matrix.length; i++) {
      const row = matrix[i];
      const max = Math.max(...row);
      const expRow = row.map(x => Math.exp(x - max));
      const sum = expRow.reduce((a, b) => a + b, 0);
      result.push(expRow.map(x => x / sum));
    }
    return result;
  }

  /**
   * Feed-forward network
   */
  feedForward(input) {
    // First layer with ReLU
    const hidden = this.matmul(input, this.ffnWeights.w1);
    const activated = hidden.map(row => row.map(x => Math.max(0, x)));
    
    // Second layer
    const output = this.matmul(activated, this.ffnWeights.w2);
    return output;
  }

  /**
   * Forward pass through the model
   */
  forward(inputTokens) {
    // Convert tokens to embeddings
    const embeddings = inputTokens.map(tokenId => {
      return this.embeddings[tokenId] || this.embeddings[1]; // UNK token
    });
    
    // Apply attention
    const attentionOutput = this.applyAttention(embeddings);
    
    // Apply feed-forward
    const ffnOutput = this.feedForward(attentionOutput);
    
    // Get last token's output
    const lastTokenOutput = ffnOutput[ffnOutput.length - 1];
    
    // Project to vocabulary
    const logits = this.matmul([lastTokenOutput], this.outputWeights)[0];
    
    return logits;
  }

  /**
   * Sample next token
   */
  sampleToken(logits) {
    // Apply temperature
    const scaledLogits = logits.map(x => x / this.temperature);
    
    // Get top-k tokens
    const indexed = scaledLogits.map((logit, i) => ({ logit, index: i }));
    indexed.sort((a, b) => b.logit - a.logit);
    const topK = indexed.slice(0, this.topK);
    
    // Apply softmax to top-k
    const max = Math.max(...topK.map(x => x.logit));
    const expVals = topK.map(x => Math.exp(x.logit - max));
    const sum = expVals.reduce((a, b) => a + b, 0);
    const probs = expVals.map(x => x / sum);
    
    // Sample
    let rand = Math.random();
    for (let i = 0; i < probs.length; i++) {
      rand -= probs[i];
      if (rand <= 0) {
        return topK[i].index;
      }
    }
    
    return topK[0].index;
  }

  /**
   * Generate text
   */
  generate(inputText, maxLength = 100) {
    // Retrieve relevant memories
    const relevantMemories = this.memory.retrieveMemories(inputText, 3);
    
    // Build context with memories
    let context = inputText;
    if (relevantMemories.length > 0) {
      context = relevantMemories.map(m => m.memory.content).join(' ') + ' ' + inputText;
    }
    
    // Encode input
    const inputTokens = this.tokenizer.encode(context);
    
    // Generate tokens
    const generatedTokens = [...inputTokens];
    
    for (let i = 0; i < maxLength; i++) {
      const logits = this.forward(generatedTokens);
      const nextToken = this.sampleToken(logits);
      
      // Check for EOS
      if (nextToken === this.tokenizer.specialTokens.EOS) {
        break;
      }
      
      generatedTokens.push(nextToken);
      
      // Check context window
      if (generatedTokens.length > this.contextWindow) {
        generatedTokens.shift();
      }
    }
    
    // Decode
    const generatedText = this.tokenizer.decode(generatedTokens);
    
    // Store in short-term memory
    this.memory.addToShortTerm('user', inputText);
    this.memory.addToShortTerm('assistant', generatedText);
    
    return generatedText;
  }

  /**
   * Learn from interaction
   */
  learn(input, output, importance = 1.0) {
    // Store in long-term memory
    const key = `${input.substring(0, 50)}_${Date.now()}`;
    this.memory.addToLongTerm(key, `${input} -> ${output}`, importance);
  }

  /**
   * Chat interface
   */
  async chat(message) {
    const response = this.generate(message);
    this.learn(message, response, 1.0);
    return response;
  }

  /**
   * Get model info
   */
  getInfo() {
    return {
      vocabSize: this.vocabSize,
      embeddingDim: this.embeddingDim,
      contextWindow: this.contextWindow,
      temperature: this.temperature,
      topK: this.topK,
      memoryStats: this.memory.getStats()
    };
  }

  /**
   * Save model state
   */
  saveState() {
    return {
      embeddings: this.embeddings,
      attentionWeights: this.attentionWeights,
      ffnWeights: this.ffnWeights,
      outputWeights: this.outputWeights,
      memory: this.memory.exportMemory()
    };
  }

  /**
   * Load model state
   */
  loadState(state) {
    if (state.embeddings) this.embeddings = state.embeddings;
    if (state.attentionWeights) this.attentionWeights = state.attentionWeights;
    if (state.ffnWeights) this.ffnWeights = state.ffnWeights;
    if (state.outputWeights) this.outputWeights = state.outputWeights;
    if (state.memory) this.memory.importMemory(state.memory);
  }
}

export default CustomLLM;
