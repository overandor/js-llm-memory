/**
 * Express API server for the custom LLM
 */

import express from 'express';
import CustomLLM from './llm.js';
import { getZKMemoryBridge } from './zk-bridge.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize LLM
const llm = new CustomLLM({
  embeddingDim: 128,
  contextWindow: 512,
  temperature: 0.7,
  topK: 5,
  memory: {
    shortTermCapacity: 10,
    retrievalThreshold: 0.3
  }
});

// Initialize ZK Memory Bridge
let zkMemory = null;

async function initZKMemory() {
  try {
    zkMemory = await getZKMemoryBridge();
    console.log('ZK Memory initialized successfully');
  } catch (error) {
    console.error('Failed to initialize ZK Memory:', error.message);
    console.log('ZK endpoints will be disabled');
  }
}

// Initialize ZK memory on startup
initZKMemory();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', model: llm.getInfo() });
});

/**
 * Generate text endpoint
 */
app.post('/generate', async (req, res) => {
  try {
    const { prompt, maxLength = 100 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const response = llm.generate(prompt, maxLength);
    
    res.json({
      prompt,
      response,
      model: llm.getInfo()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Chat endpoint
 */
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const response = await llm.chat(message);
    
    res.json({
      message,
      response,
      context: llm.memory.getShortTermContext()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Learn endpoint
 */
app.post('/learn', async (req, res) => {
  try {
    const { input, output, importance = 1.0 } = req.body;
    
    if (!input || !output) {
      return res.status(400).json({ error: 'Input and output are required' });
    }
    
    llm.learn(input, output, importance);
    
    res.json({
      success: true,
      memoryStats: llm.memory.getStats()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Memory endpoints
 */
app.get('/memory/short-term', (req, res) => {
  res.json({
    context: llm.memory.getShortTermContext(),
    stats: llm.memory.getStats()
  });
});

app.get('/memory/long-term', (req, res) => {
  const memories = Array.from(llm.memory.longTermMemory.entries());
  res.json({
    memories,
    stats: llm.memory.getStats()
  });
});

app.post('/memory/retrieve', (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const memories = llm.memory.retrieveMemories(query, limit);
    
    res.json({
      query,
      memories,
      count: memories.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/memory/short-term', (req, res) => {
  llm.memory.clearShortTerm();
  res.json({ success: true, message: 'Short-term memory cleared' });
});

app.delete('/memory/long-term', (req, res) => {
  llm.memory.clearLongTerm();
  res.json({ success: true, message: 'Long-term memory cleared' });
});

/**
 * Model state endpoints
 */
app.get('/model/info', (req, res) => {
  res.json(llm.getInfo());
});

app.get('/model/state', (req, res) => {
  res.json(llm.saveState());
});

app.post('/model/state', (req, res) => {
  try {
    llm.loadState(req.body);
    res.json({ success: true, message: 'Model state loaded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export model state
 */
app.get('/model/export', (req, res) => {
  const state = llm.saveState();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=model-state.json');
  res.json(state);
});

/**
 * ZK Memory endpoints
 */

/**
 * Check ZK memory status
 */
app.get('/zk/status', (req, res) => {
  if (!zkMemory) {
    return res.status(503).json({ error: 'ZK Memory not initialized' });
  }
  zkMemory.getInfo().then(info => res.json(info));
});

/**
 * Add entry to ZK memory
 */
app.post('/zk/entry', async (req, res) => {
  try {
    if (!zkMemory) {
      return res.status(503).json({ error: 'ZK Memory not initialized' });
    }
    
    const { key, value } = req.body;
    
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }
    
    const entry = await zkMemory.addEntry(key, value);
    res.json({ success: true, entry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get entry from ZK memory
 */
app.get('/zk/entry/:key', async (req, res) => {
  try {
    if (!zkMemory) {
      return res.status(503).json({ error: 'ZK Memory not initialized' });
    }
    
    const { key } = req.params;
    const entry = await zkMemory.getEntry(key);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json({ entry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify entry hash
 */
app.post('/zk/verify', async (req, res) => {
  try {
    if (!zkMemory) {
      return res.status(503).json({ error: 'ZK Memory not initialized' });
    }
    
    const { key, hash } = req.body;
    
    if (!key || !hash) {
      return res.status(400).json({ error: 'Key and hash are required' });
    }
    
    const valid = await zkMemory.verifyEntry(key, hash);
    res.json({ valid, key, hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate ZK commitment
 */
app.post('/zk/commitment', async (req, res) => {
  try {
    if (!zkMemory) {
      return res.status(503).json({ error: 'ZK Memory not initialized' });
    }
    
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }
    
    const commitment = await zkMemory.generateCommitment(key);
    res.json({ commitment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create ZK proof
 */
app.post('/zk/proof', async (req, res) => {
  try {
    if (!zkMemory) {
      return res.status(503).json({ error: 'ZK Memory not initialized' });
    }
    
    const { key, value } = req.body;
    
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }
    
    const result = await zkMemory.createZKProof(key, value);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify ZK proof
 */
app.post('/zk/verify-proof', async (req, res) => {
  try {
    if (!zkMemory) {
      return res.status(503).json({ error: 'ZK Memory not initialized' });
    }
    
    const { proof } = req.body;
    
    if (!proof) {
      return res.status(400).json({ error: 'Proof is required' });
    }
    
    const valid = await zkMemory.verifyZKProof(proof);
    res.json({ valid, proof });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Merkle root
 */
app.get('/zk/merkle-root', async (req, res) => {
  try {
    if (!zkMemory) {
      return res.status(503).json({ error: 'ZK Memory not initialized' });
    }
    
    const result = await zkMemory.getMerkleRoot();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all hashes
 */
app.get('/zk/hashes', async (req, res) => {
  try {
    if (!zkMemory) {
      return res.status(503).json({ error: 'ZK Memory not initialized' });
    }
    
    const result = await zkMemory.getAllHashes();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get entry count
 */
app.get('/zk/count', async (req, res) => {
  try {
    if (!zkMemory) {
      return res.status(503).json({ error: 'ZK Memory not initialized' });
    }
    
    const count = await zkMemory.getEntryCount();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear ZK memory
 */
app.delete('/zk/clear', async (req, res) => {
  try {
    if (!zkMemory) {
      return res.status(503).json({ error: 'ZK Memory not initialized' });
    }
    
    const result = await zkMemory.clear();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Custom LLM API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Chat endpoint: http://localhost:${PORT}/chat`);
});

export default app;
