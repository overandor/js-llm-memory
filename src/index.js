/**
 * Main entry point for the custom LLM
 */

import CustomLLM from './llm.js';

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

// Example usage
console.log('Custom LLM with Memory System');
console.log('================================');
console.log(llm.getInfo());
console.log('\n');

// Add some initial knowledge to long-term memory
llm.learn('What is AI?', 'AI stands for Artificial Intelligence, which is the simulation of human intelligence by machines.', 1.0);
llm.learn('What is JavaScript?', 'JavaScript is a programming language that enables interactive web pages.', 1.0);
llm.learn('What is memory?', 'Memory is the ability to store and retrieve information over time.', 1.0);

// Interactive chat
async function interactiveChat() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (question) => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };

  console.log('Chat with the LLM (type "exit" to quit, "stats" for memory stats)\n');

  while (true) {
    const input = await ask('You: ');
    
    if (input.toLowerCase() === 'exit') {
      rl.close();
      break;
    }
    
    if (input.toLowerCase() === 'stats') {
      console.log('\nMemory Stats:', llm.memory.getStats());
      console.log('Model Info:', llm.getInfo());
      console.log('');
      continue;
    }
    
    if (input.toLowerCase() === 'clear') {
      llm.memory.clearShortTerm();
      console.log('\nShort-term memory cleared.\n');
      continue;
    }
    
    const response = await llm.chat(input);
    console.log('LLM:', response);
    console.log('');
  }
}

// Start interactive chat
interactiveChat().catch(console.error);

export default CustomLLM;
