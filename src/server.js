/**
 * Express API server for the custom LLM
 */

import express from 'express';
import CustomLLM from './llm.js';

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

// Start server
app.listen(PORT, () => {
  console.log(`Custom LLM API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Chat endpoint: http://localhost:${PORT}/chat`);
});

export default app;
