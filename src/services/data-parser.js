export class DataParser {
  constructor() {
    this.mockRateLimited = false;
    this.mockServiceUnavailable = false;
    this.aiPromptTemplate = "You are parsing Dutch theater review metadata. Given this text segment: '{segment}' and surrounding context: '{context}', identify the most likely field type and extract structured data. Return JSON with: field type, extracted value, and confidence (0-100). Possible field types: theater, title, writers, directors, actors, groups, city, location, date.";
  }

  async parseReviewMetadata(text) {
    const parsingStages = [];
    let parsedData = {};
    let confidence = 100;
    let userValidationRequired = [];

    const lines = text.split('\n');
    const metadataLine = lines[0];
    const segments = metadataLine.split('/').map(s => s.trim());

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const stage = await this.parseSegment(segment, segments.join(' / '), i);
      parsingStages.push(stage);

      if (stage.output) {
        parsedData = { ...parsedData, ...stage.output };
      }

      if (stage.confidence < 80) {
        userValidationRequired.push(...Object.keys(stage.output));
      }

      confidence = Math.min(confidence, stage.confidence);
    }

    const reviewTitle = lines[2] || '';
    const reviewContent = lines.slice(3).join('\n').trim();

    parsedData.reviewTitle = reviewTitle;
    parsedData.reviewContent = `<p>${reviewContent.split('\n\n').join('</p><p>')}</p>`;

    return {
      parsedData,
      confidence,
      parsingStages,
      userValidationRequired: userValidationRequired.length > 0 ? userValidationRequired : undefined,
      aiParsingUsed: parsingStages.some(s => s.stage === 'ai')
    };
  }

  async parseSegment(segment, context, index) {
    const labelPatterns = {
      'Tekst:': 'writers',
      'Regie:': 'directors',
      'Spel:': 'actors',
      'Schrijver:': 'writers',
      'Regisseur:': 'directors',
      'Acteurs:': 'actors'
    };

    for (const [label, field] of Object.entries(labelPatterns)) {
      if (segment.includes(label)) {
        const value = segment.replace(label, '').trim();
        return {
          stage: 'regex',
          input: segment,
          output: { [field]: this.parseNameList(value) },
          confidence: 100,
          timestamp: Date.now()
        };
      }
    }

    if (index === 0) {
      const parts = segment.split(' en ');
      const groups = parts.length > 1 ? [parts[0]] : [];
      const theater = parts.length > 1 ? parts[1] : segment;
      return {
        stage: 'regex',
        input: segment,
        output: { groups, theater },
        confidence: 90,
        timestamp: Date.now()
      };
    }

    if (index === 1) {
      return {
        stage: 'regex',
        input: segment,
        output: { title: segment },
        confidence: 95,
        timestamp: Date.now()
      };
    }

    if (this.isDateSegment(segment)) {
      return {
        stage: 'regex',
        input: segment,
        output: { performanceDate: this.parseDate(segment) },
        confidence: 100,
        timestamp: Date.now()
      };
    }

    if (segment.includes(',')) {
      const parts = segment.split(',').map(s => s.trim());
      if (parts.length === 2) {
        return {
          stage: 'regex',
          input: segment,
          output: { city: parts[1], location: parts[0] },
          confidence: 85,
          timestamp: Date.now()
        };
      }
    }

    return await this.parseWithAI({ text: segment, context, expectedFields: [] });
  }

  parseNameList(value) {
    return value.split(',').map(name => name.trim()).filter(name => name.length > 0);
  }

  isDateSegment(segment) {
    return /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(segment) ||
           /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(segment);
  }

  parseDate(dateStr) {
    const parts = dateStr.split(/[-/]/);

    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else {
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  async parseWithAI(params) {
    const { text, context = '', expectedFields = [], language = 'nl' } = params;

    if (!text) {
      throw {
        error: 'VALIDATION_ERROR',
        message: 'Text parameter is required for AI parsing'
      };
    }

    if (this.mockRateLimited) {
      throw {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'AI service rate limit exceeded. Please try again later.'
      };
    }

    if (this.mockServiceUnavailable) {
      throw {
        error: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI parsing service is currently unavailable',
        fallbackSuggestion: 'Please use manual entry mode'
      };
    }

    const prompt = this.aiPromptTemplate
      .replace('{segment}', text)
      .replace('{context}', context);

    const mockAIResponse = this.getMockAIResponse(text, expectedFields);

    return {
      stage: 'ai',
      input: text,
      output: mockAIResponse.parsedFields,
      confidence: mockAIResponse.confidence,
      timestamp: Date.now(),
      aiPrompt: prompt,
      aiResponse: JSON.stringify(mockAIResponse),
      ...mockAIResponse
    };
  }

  getMockAIResponse(text, expectedFields) {
    const lowerText = text.toLowerCase();
    const parsedFields = {};
    let confidence = 50;

    if (lowerText.includes('theater') || lowerText.includes('schouwburg')) {
      parsedFields.theater = text;
      confidence = 80;
    } else if (lowerText.includes('amsterdam') || lowerText.includes('rotterdam')) {
      parsedFields.city = text;
      confidence = 90;
    } else if (this.isPersonName(text)) {
      if (expectedFields.includes('directors')) {
        parsedFields.directors = [text];
      } else if (expectedFields.includes('actors')) {
        parsedFields.actors = [text];
      } else {
        parsedFields.persons = [text];
      }
      confidence = 70;
    } else {
      parsedFields.unknown = text;
      confidence = 30;
    }

    const response = {
      parsedFields,
      confidence,
      reasoning: `Analyzed text segment "${text}" with ${confidence}% confidence`
    };

    if (confidence < 80) {
      response.uncertainFields = Object.keys(parsedFields);
      response.userValidationNeeded = [{
        field: Object.keys(parsedFields)[0],
        value: text,
        options: ['actor', 'director', 'writer', 'theater', 'city', 'group']
      }];
    }

    return response;
  }

  isPersonName(text) {
    const nameParts = text.split(' ');
    return nameParts.length >= 2 &&
           nameParts.every(part => /^[A-Z]/.test(part) || /^(van|de|der|den)$/i.test(part));
  }

  parseActorString(text) {
    return this.parseNameList(text.replace('Spel:', '').trim());
  }

  async parseInterviewMetadata(text) {
    const lines = text.split('\n');
    const title = lines[0] || '';
    const persons = [];
    let interviewDate = '';
    let content = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('Date:') || line.includes('Datum:')) {
        interviewDate = this.parseDate(line.split(':')[1].trim());
      } else if (i === 1 && this.isPersonName(line)) {
        persons.push(line);
      }
    }

    content = `<p>${lines.slice(3).join('</p><p>')}</p>`;

    return {
      parsedData: {
        title,
        persons: persons.length > 0 ? persons : ['Unknown'],
        interviewDate: interviewDate || new Date().toISOString().split('T')[0],
        content
      },
      confidence: 85,
      parsingStages: [],
      aiParsingUsed: false
    };
  }
}