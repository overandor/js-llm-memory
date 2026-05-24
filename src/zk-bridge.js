/**
 * JavaScript bridge for ZK memory WebAssembly module
 */

class ZKMemoryBridge {
  constructor() {
    this.wasmModule = null;
    this.zkMemory = null;
    this.initialized = false;
  }

  /**
   * Initialize the WASM module
   */
  async init() {
    if (this.initialized) {
      return this;
    }

    try {
      // Import the WASM module
      const wasmModule = await import('../wasm/pkg/zk_memory.js');
      await wasmModule.default();
      
      this.wasmModule = wasmModule;
      this.zkMemory = new wasmModule.ZKMemorySystem();
      this.initialized = true;
      
      console.log('ZK Memory WASM module initialized');
      return this;
    } catch (error) {
      console.error('Failed to initialize WASM module:', error);
      throw new Error('WASM initialization failed. Make sure to build the WASM module first.');
    }
  }

  /**
   * Add a memory entry with ZK commitment
   */
  async addEntry(key, value) {
    this.ensureInitialized();
    
    const hash = this.zkMemory.add_entry(key, value);
    
    return {
      key,
      value,
      hash,
      timestamp: Date.now()
    };
  }

  /**
   * Get a memory entry
   */
  async getEntry(key) {
    this.ensureInitialized();
    
    const value = this.zkMemory.get_entry(key);
    
    if (value === null || value === undefined) {
      return null;
    }
    
    return {
      key,
      value
    };
  }

  /**
   * Verify a memory entry hash
   */
  async verifyEntry(key, hash) {
    this.ensureInitialized();
    
    return this.zkMemory.verify_entry(key, hash);
  }

  /**
   * Generate a ZK commitment for a key
   */
  async generateCommitment(key) {
    this.ensureInitialized();
    
    const commitment = this.zkMemory.generate_commitment(key);
    
    return {
      key,
      commitment,
      timestamp: Date.now()
    };
  }

  /**
   * Create a ZK proof for a memory entry
   */
  async createZKProof(key, value) {
    this.ensureInitialized();
    
    const proof = this.zkMemory.create_zk_proof(key, value);
    
    return {
      key,
      value,
      proof: {
        commitment: proof.commitment,
        proof: proof.proof,
        public_input: proof.public_input,
        timestamp: proof.timestamp
      }
    };
  }

  /**
   * Verify a ZK proof
   */
  async verifyZKProof(proof) {
    this.ensureInitialized();
    
    const proofJson = JSON.stringify(proof);
    const proofObj = JSON.parse(proofJson);
    
    return this.zkMemory.verify_zk_proof(proofObj);
  }

  /**
   * Get the Merkle root of all memory entries
   */
  async getMerkleRoot() {
    this.ensureInitialized();
    
    const root = this.zkMemory.get_merkle_root();
    
    return {
      root,
      entryCount: this.zkMemory.entry_count()
    };
  }

  /**
   * Get all entry hashes
   */
  async getAllHashes() {
    this.ensureInitialized();
    
    const hashes = this.zkMemory.get_all_hashes();
    
    return {
      hashes,
      count: hashes.length
    };
  }

  /**
   * Get the number of entries
   */
  async getEntryCount() {
    this.ensureInitialized();
    
    return this.zkMemory.entry_count();
  }

  /**
   * Clear all memory entries
   */
  async clear() {
    this.ensureInitialized();
    
    this.zkMemory.clear();
    
    return {
      success: true,
      message: 'Memory cleared'
    };
  }

  /**
   * Generate a random salt
   */
  async generateSalt() {
    if (!this.wasmModule) {
      throw new Error('WASM module not initialized');
    }
    
    const salt = this.wasmModule.generate_salt();
    return salt;
  }

  /**
   * Hash data using SHA-256
   */
  async hashData(data) {
    if (!this.wasmModule) {
      throw new Error('WASM module not initialized');
    }
    
    const hash = this.wasmModule.hash_data(data);
    return hash;
  }

  /**
   * Ensure the WASM module is initialized
   */
  ensureInitialized() {
    if (!this.initialized || !this.zkMemory) {
      throw new Error('ZK Memory WASM module not initialized. Call init() first.');
    }
  }

  /**
   * Check if initialized
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Get system info
   */
  async getInfo() {
    return {
      initialized: this.initialized,
      entryCount: this.initialized ? this.zkMemory.entry_count() : 0,
      wasmLoaded: this.wasmModule !== null
    };
  }
}

// Singleton instance
let zkMemoryBridgeInstance = null;

/**
 * Get the singleton ZKMemoryBridge instance
 */
export async function getZKMemoryBridge() {
  if (!zkMemoryBridgeInstance) {
    zkMemoryBridgeInstance = new ZKMemoryBridge();
    await zkMemoryBridgeInstance.init();
  }
  return zkMemoryBridgeInstance;
}

export default ZKMemoryBridge;
