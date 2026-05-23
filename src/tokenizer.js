/**
 * Simple English tokenizer for the LLM
 * Implements word-level and subword tokenization
 */

class Tokenizer {
  constructor() {
    this.vocab = new Map();
    this.vocabSize = 0;
    this.specialTokens = {
      PAD: 0,
      UNK: 1,
      BOS: 2,
      EOS: 3,
    };
    this.buildBaseVocab();
  }

  buildBaseVocab() {
    // Initialize with special tokens
    this.vocab.set('<PAD>', this.specialTokens.PAD);
    this.vocab.set('<UNK>', this.specialTokens.UNK);
    this.vocab.set('<BOS>', this.specialTokens.BOS);
    this.vocab.set('<EOS>', this.specialTokens.EOS);
    this.vocabSize = 4;

    // Add common English words
    const commonWords = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
      'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
      'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
      'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
      'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
      'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
      'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
      'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'did', 'does',
      'am', 'are', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'shall',
      'hello', 'hi', 'yes', 'no', 'please', 'thank', 'you', 'welcome', 'bye', 'goodbye',
      'question', 'answer', 'think', 'know', 'understand', 'remember', 'forget', 'learn', 'teach', 'help',
      'what', 'where', 'when', 'why', 'how', 'who', 'which', 'that', 'this', 'these',
      '.', ',', '!', '?', ';', ':', "'", '"', '-', '(', ')',
    ];

    commonWords.forEach(word => {
      if (!this.vocab.has(word)) {
        this.vocab.set(word, this.vocabSize);
        this.vocabSize++;
      }
    });
  }

  encode(text) {
    const tokens = [this.specialTokens.BOS];
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      // Remove punctuation
      const cleanWord = word.replace(/[^\w]/g, '');
      const punctuation = word.match(/[^\w]/g) || [];
      
      if (cleanWord) {
        const tokenId = this.vocab.get(cleanWord) ?? this.specialTokens.UNK;
        tokens.push(tokenId);
      }
      
      // Add punctuation as separate tokens
      for (const punct of punctuation) {
        if (this.vocab.has(punct)) {
          tokens.push(this.vocab.get(punct));
        }
      }
    }
    
    tokens.push(this.specialTokens.EOS);
    return tokens;
  }

  decode(tokens) {
    const words = [];
    for (const tokenId of tokens) {
      let word = null;
      for (const [key, value] of this.vocab.entries()) {
        if (value === tokenId) {
          word = key;
          break;
        }
      }
      if (word && !word.startsWith('<')) {
        words.push(word);
      }
    }
    return words.join(' ');
  }

  getVocabSize() {
    return this.vocabSize;
  }

  addToVocab(word) {
    if (!this.vocab.has(word)) {
      this.vocab.set(word, this.vocabSize);
      this.vocabSize++;
      return this.vocabSize - 1;
    }
    return this.vocab.get(word);
  }
}

export default Tokenizer;
