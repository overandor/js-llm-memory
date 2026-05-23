/**
 * Test suite for the custom LLM
 */

import CustomLLM from '../src/llm.js';
import Tokenizer from '../src/tokenizer.js';
import MemorySystem from '../src/memory.js';

console.log('Running Custom LLM Tests...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Tokenizer tests
console.log('--- Tokenizer Tests ---');

test('Tokenizer should initialize with vocabulary', () => {
  const tokenizer = new Tokenizer();
  assert(tokenizer.getVocabSize() > 0, 'Vocabulary should not be empty');
});

test('Tokenizer should encode text', () => {
  const tokenizer = new Tokenizer();
  const tokens = tokenizer.encode('hello world');
  assert(tokens.length > 0, 'Should encode text to tokens');
  assert(tokens[0] === tokenizer.specialTokens.BOS, 'Should start with BOS');
  assert(tokens[tokens.length - 1] === tokenizer.specialTokens.EOS, 'Should end with EOS');
});

test('Tokenizer should decode tokens', () => {
  const tokenizer = new Tokenizer();
  const text = 'hello world';
  const tokens = tokenizer.encode(text);
  const decoded = tokenizer.decode(tokens);
  assert(decoded.length > 0, 'Should decode tokens to text');
});

test('Tokenizer should add new words to vocabulary', () => {
  const tokenizer = new Tokenizer();
  const initialSize = tokenizer.getVocabSize();
  tokenizer.addToVocab('newword123');
  assert(tokenizer.getVocabSize() === initialSize + 1, 'Should add new word to vocabulary');
});

// Memory System tests
console.log('\n--- Memory System Tests ---');

test('Memory system should initialize', () => {
  const memory = new MemorySystem();
  assert(memory.shortTermMemory.length === 0, 'Short-term memory should be empty');
  assert(memory.longTermMemory.size === 0, 'Long-term memory should be empty');
});

test('Memory system should add to short-term', () => {
  const memory = new MemorySystem();
  memory.addToShortTerm('user', 'test message');
  assert(memory.shortTermMemory.length === 1, 'Should have one short-term memory');
});

test('Memory system should maintain short-term capacity', () => {
  const memory = new MemorySystem({ shortTermCapacity: 3 });
  for (let i = 0; i < 5; i++) {
    memory.addToShortTerm('user', `message ${i}`);
  }
  assert(memory.shortTermMemory.length === 3, 'Should maintain capacity');
});

test('Memory system should add to long-term', () => {
  const memory = new MemorySystem();
  memory.addToLongTerm('key1', 'test content', 1.0);
  assert(memory.longTermMemory.size === 1, 'Should have one long-term memory');
});

test('Memory system should retrieve memories', () => {
  const memory = new MemorySystem({ retrievalThreshold: 0.1 });
  memory.addToLongTerm('key1', 'artificial intelligence is amazing', 1.0);
  const retrieved = memory.retrieveMemories('artificial', 5);
  assert(retrieved.length > 0, 'Should retrieve relevant memories');
});

test('Memory system should clear short-term', () => {
  const memory = new MemorySystem();
  memory.addToShortTerm('user', 'test');
  memory.clearShortTerm();
  assert(memory.shortTermMemory.length === 0, 'Should clear short-term memory');
});

test('Memory system should clear long-term', () => {
  const memory = new MemorySystem();
  memory.addToLongTerm('key1', 'test', 1.0);
  memory.clearLongTerm();
  assert(memory.longTermMemory.size === 0, 'Should clear long-term memory');
});

test('Memory system should export and import', () => {
  const memory = new MemorySystem();
  memory.addToShortTerm('user', 'test');
  memory.addToLongTerm('key1', 'content', 1.0);
  
  const exported = memory.exportMemory();
  const newMemory = new MemorySystem();
  newMemory.importMemory(exported);
  
  assert(newMemory.shortTermMemory.length === memory.shortTermMemory.length, 'Should import short-term');
  assert(newMemory.longTermMemory.size === memory.longTermMemory.size, 'Should import long-term');
});

// LLM tests
console.log('\n--- LLM Tests ---');

test('LLM should initialize', () => {
  const llm = new CustomLLM();
  assert(llm.vocabSize > 0, 'Should have vocabulary');
  assert(llm.embeddingDim > 0, 'Should have embedding dimension');
});

test('LLM should generate text', () => {
  const llm = new CustomLLM();
  const response = llm.generate('hello', 10);
  assert(response.length > 0, 'Should generate text');
});

test('LLM should learn from examples', () => {
  const llm = new CustomLLM();
  llm.learn('test input', 'test output', 1.0);
  assert(llm.memory.longTermMemory.size > 0, 'Should store learned information');
});

test('LLM should chat', async () => {
  const llm = new CustomLLM();
  const response = await llm.chat('hello');
  assert(response.length > 0, 'Should respond to chat');
});

test('LLM should save and load state', () => {
  const llm = new CustomLLM();
  const state = llm.saveState();
  assert(state.embeddings, 'Should save embeddings');
  assert(state.memory, 'Should save memory');
  
  const newLlm = new CustomLLM();
  newLlm.loadState(state);
  assert(newLlm.memory.longTermMemory.size === llm.memory.longTermMemory.size, 'Should load state');
});

test('LLM should get info', () => {
  const llm = new CustomLLM();
  const info = llm.getInfo();
  assert(info.vocabSize > 0, 'Should have vocab size');
  assert(info.embeddingDim > 0, 'Should have embedding dim');
  assert(info.contextWindow > 0, 'Should have context window');
});

// Integration tests
console.log('\n--- Integration Tests ---');

test('Full conversation flow', async () => {
  const llm = new CustomLLM();
  
  // Chat
  const response1 = await llm.chat('hello');
  assert(response1.length > 0, 'First response should exist');
  
  // Learn
  llm.learn('What is this?', 'This is a test', 1.0);
  
  // Retrieve
  const memories = llm.memory.retrieveMemories('test', 5);
  assert(memories.length > 0, 'Should retrieve learned memory');
  
  // Chat again
  const response2 = await llm.chat('tell me about this');
  assert(response2.length > 0, 'Second response should exist');
});

// Summary
console.log('\n--- Test Summary ---');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✓ All tests passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}
