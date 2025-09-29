export class ParsingStage {
  constructor(stage, input) {
    const validStages = ['regex', 'ai', 'user'];

    if (!validStages.includes(stage)) {
      throw new Error(`Invalid parsing stage: ${stage}. Must be one of: ${validStages.join(', ')}`);
    }

    if (!input || input.trim() === '') {
      throw new Error('Input text cannot be empty');
    }

    this.stage = stage;
    this.input = input;
    this.output = {};
    this.confidence = 0;
    this.timestamp = Date.now();
    this.aiPrompt = null;
    this.aiResponse = null;
    this.userPrompt = null;
  }

  setOutput(output, confidence) {
    if (!output || Object.keys(output).length === 0) {
      throw new Error('Output must contain at least one parsed field');
    }

    if (confidence < 0 || confidence > 100) {
      throw new Error('Confidence must be between 0 and 100');
    }

    this.output = output;
    this.confidence = confidence;

    if (this.stage === 'regex' && Object.keys(output).length > 0) {
      this.confidence = 100;
    } else if (this.stage === 'user') {
      this.confidence = 100;
    }
  }

  setAIDetails(prompt, response) {
    if (this.stage !== 'ai') {
      throw new Error('AI details can only be set for AI parsing stage');
    }

    this.aiPrompt = prompt;
    this.aiResponse = response;
  }

  setUserPrompt(prompt) {
    if (this.stage !== 'user') {
      throw new Error('User prompt can only be set for user parsing stage');
    }

    this.userPrompt = prompt;
  }

  isHighConfidence() {
    return this.confidence >= 80;
  }

  isMediumConfidence() {
    return this.confidence >= 60 && this.confidence < 80;
  }

  isLowConfidence() {
    return this.confidence < 60;
  }

  requiresUserValidation() {
    return this.confidence < 80 || this.stage === 'user';
  }

  getFieldNames() {
    return Object.keys(this.output);
  }

  hasField(fieldName) {
    return this.output.hasOwnProperty(fieldName);
  }

  getFieldValue(fieldName) {
    return this.output[fieldName];
  }

  getConfidenceLevel() {
    if (this.confidence >= 90) return 'very-high';
    if (this.confidence >= 80) return 'high';
    if (this.confidence >= 60) return 'medium';
    if (this.confidence >= 40) return 'low';
    return 'very-low';
  }

  getDuration() {
    return Date.now() - this.timestamp;
  }

  validate() {
    if (!this.input || this.input.trim() === '') {
      throw new Error('Input cannot be empty');
    }

    if (Object.keys(this.output).length === 0) {
      console.warn('ParsingStage has no output fields');
    }

    if (this.stage === 'regex' && this.confidence !== 100 && Object.keys(this.output).length > 0) {
      console.warn('Regex stage should have 100% confidence when successful');
    }

    if (this.stage === 'user' && this.confidence !== 100) {
      console.warn('User stage should always have 100% confidence');
    }

    if (this.stage === 'ai' && !this.aiPrompt) {
      console.warn('AI stage missing prompt');
    }

    return true;
  }

  toJSON() {
    return {
      stage: this.stage,
      input: this.input,
      output: this.output,
      confidence: this.confidence,
      timestamp: this.timestamp,
      aiPrompt: this.aiPrompt,
      aiResponse: this.aiResponse,
      userPrompt: this.userPrompt
    };
  }

  static fromRegex(input, output) {
    const stage = new ParsingStage('regex', input);
    stage.setOutput(output, 100);
    return stage;
  }

  static fromAI(input, output, confidence, prompt, response) {
    const stage = new ParsingStage('ai', input);
    stage.setOutput(output, confidence);
    stage.setAIDetails(prompt, response);
    return stage;
  }

  static fromUser(input, output, prompt) {
    const stage = new ParsingStage('user', input);
    stage.setOutput(output, 100);
    stage.setUserPrompt(prompt);
    return stage;
  }
}