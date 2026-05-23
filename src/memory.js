/**
 * Memory system for the LLM
 * Implements short-term (context) and long-term (persistent) memory
 */

class MemorySystem {
  constructor(options = {}) {
    this.shortTermMemory = [];
    this.shortTermCapacity = options.shortTermCapacity || 10;
    this.longTermMemory = new Map();
    this.memoryEmbeddings = new Map();
    this.retrievalThreshold = options.retrievalThreshold || 0.5;
  }

  /**
   * Add to short-term memory (conversation context)
   */
  addToShortTerm(role, content, metadata = {}) {
    const memoryItem = {
      role,
      content,
      timestamp: Date.now(),
      metadata
    };
    
    this.shortTermMemory.push(memoryItem);
    
    // Maintain capacity
    if (this.shortTermMemory.length > this.shortTermCapacity) {
      this.shortTermMemory.shift();
    }
    
    return memoryItem;
  }

  /**
   * Add to long-term memory (persistent knowledge)
   */
  addToLongTerm(key, content, importance = 1.0) {
    const memoryItem = {
      content,
      importance,
      timestamp: Date.now(),
      accessCount: 0
    };
    
    this.longTermMemory.set(key, memoryItem);
    
    // Create simple embedding (word frequency based)
    const embedding = this.createEmbedding(content);
    this.memoryEmbeddings.set(key, embedding);
    
    return memoryItem;
  }

  /**
   * Retrieve relevant memories based on query
   */
  retrieveMemories(query, limit = 5) {
    const queryEmbedding = this.createEmbedding(query);
    const scoredMemories = [];
    
    for (const [key, memory] of this.longTermMemory.entries()) {
      const memoryEmbedding = this.memoryEmbeddings.get(key);
      const similarity = this.cosineSimilarity(queryEmbedding, memoryEmbedding);
      
      if (similarity >= this.retrievalThreshold) {
        scoredMemories.push({
          key,
          memory,
          similarity
        });
      }
    }
    
    // Sort by similarity and importance
    scoredMemories.sort((a, b) => {
      const scoreA = a.similarity * a.memory.importance;
      const scoreB = b.similarity * b.memory.importance;
      return scoreB - scoreA;
    });
    
    // Update access counts
    scoredMemories.slice(0, limit).forEach(item => {
      item.memory.accessCount++;
    });
    
    return scoredMemories.slice(0, limit);
  }

  /**
   * Get short-term memory as context
   */
  getShortTermContext() {
    return this.shortTermMemory.map(item => ({
      role: item.role,
      content: item.content
    }));
  }

  /**
   * Clear short-term memory
   */
  clearShortTerm() {
    this.shortTermMemory = [];
  }

  /**
   * Clear long-term memory
   */
  clearLongTerm() {
    this.longTermMemory.clear();
    this.memoryEmbeddings.clear();
  }

  /**
   * Create simple word-frequency embedding
   */
  createEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = {};
    
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord) {
        embedding[cleanWord] = (embedding[cleanWord] || 0) + 1;
      }
    }
    
    return embedding;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embeddingA, embeddingB) {
    const wordsA = Object.keys(embeddingA);
    const wordsB = Object.keys(embeddingB);
    const allWords = new Set([...wordsA, ...wordsB]);
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (const word of allWords) {
      const valA = embeddingA[word] || 0;
      const valB = embeddingB[word] || 0;
      
      dotProduct += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Export memory to JSON
   */
  exportMemory() {
    return {
      shortTerm: this.shortTermMemory,
      longTerm: Array.from(this.longTermMemory.entries()),
      embeddings: Array.from(this.memoryEmbeddings.entries())
    };
  }

  /**
   * Import memory from JSON
   */
  importMemory(data) {
    if (data.shortTerm) {
      this.shortTermMemory = data.shortTerm;
    }
    if (data.longTerm) {
      this.longTermMemory = new Map(data.longTerm);
    }
    if (data.embeddings) {
      this.memoryEmbeddings = new Map(data.embeddings);
    }
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      shortTermCount: this.shortTermMemory.length,
      shortTermCapacity: this.shortTermCapacity,
      longTermCount: this.longTermMemory.size,
      totalAccessCount: Array.from(this.longTermMemory.values())
        .reduce((sum, mem) => sum + mem.accessCount, 0)
    };
  }
}

export default MemorySystem;
