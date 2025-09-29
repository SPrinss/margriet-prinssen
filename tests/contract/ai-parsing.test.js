import { DataParser } from '../../src/services/data-parser.js';

describe('AI Parsing Service Contract', () => {
  let parser;

  beforeEach(() => {
    parser = new DataParser();
  });

  describe('POST /parse-segment', () => {
    it('should parse ambiguous metadata segment using AI', async () => {
      const result = await parser.parseWithAI({
        text: 'Leopold Witte / Erik van Muiswinkel, Club Kenau, Milan Sekeris',
        context: 'Club Kenau / Moby Dick, de kerstmusical',
        expectedFields: ['directors', 'actors', 'groups'],
        language: 'nl'
      });

      expect(result).toBeDefined();
      expect(result.parsedFields).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should identify fields requiring user validation', async () => {
      const result = await parser.parseWithAI({
        text: 'Geert Lageveen',
        context: 'Het Verdriet van de Zuiderzee',
        expectedFields: ['directors', 'writers', 'actors']
      });

      if (result.confidence < 80) {
        expect(result.uncertainFields).toBeDefined();
        expect(Array.isArray(result.uncertainFields)).toBe(true);
      }
    });

    it('should handle theater context parsing', async () => {
      const result = await parser.parseWithAI({
        text: 'Orkater en Schouwburg De Lawei',
        context: '',
        expectedFields: ['theater', 'groups']
      });

      expect(result.parsedFields).toHaveProperty('groups');
      expect(result.parsedFields.groups).toContain('Orkater');
      expect(result.parsedFields).toHaveProperty('theater');
      expect(result.parsedFields.theater).toContain('Schouwburg De Lawei');
    });

    it('should parse dates in various formats', async () => {
      const result = await parser.parseWithAI({
        text: 'December 2023',
        context: 'Performance date information',
        expectedFields: ['date']
      });

      expect(result.parsedFields).toHaveProperty('date');
      expect(result.parsedFields.date).toMatch(/2023-12/);
    });

    it('should handle Dutch language content', async () => {
      const result = await parser.parseWithAI({
        text: 'Tekst en regie: Geert Lageveen',
        context: 'Nederlandse theaterproductie',
        expectedFields: ['writers', 'directors'],
        language: 'nl'
      });

      expect(result.parsedFields.writers).toContain('Geert Lageveen');
      expect(result.parsedFields.directors).toContain('Geert Lageveen');
    });

    it('should provide user validation options when confidence is low', async () => {
      const result = await parser.parseWithAI({
        text: 'John Doe',
        context: '',
        expectedFields: ['actors', 'directors', 'writers']
      });

      if (result.userValidationNeeded && result.userValidationNeeded.length > 0) {
        const validation = result.userValidationNeeded[0];
        expect(validation).toHaveProperty('field');
        expect(validation).toHaveProperty('value');
        expect(validation).toHaveProperty('options');
        expect(Array.isArray(validation.options)).toBe(true);
      }
    });

    it('should handle missing context gracefully', async () => {
      const result = await parser.parseWithAI({
        text: 'Amsterdam, Royal Theater',
        expectedFields: ['city', 'theater', 'location']
      });

      expect(result.parsedFields).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should validate required text parameter', async () => {
      try {
        await parser.parseWithAI({
          context: 'Some context',
          expectedFields: ['theater']
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.error).toBe('VALIDATION_ERROR');
        expect(error.message).toContain('text');
        expect(error.message).toContain('required');
      }
    });

    it('should handle rate limiting gracefully', async () => {
      parser.mockRateLimited = true;

      try {
        await parser.parseWithAI({
          text: 'Test text',
          expectedFields: ['theater']
        });
        fail('Should have thrown rate limit error');
      } catch (error) {
        expect(error.error).toBe('RATE_LIMIT_EXCEEDED');
        expect(error.message).toContain('rate limit');
      }
    });

    it('should provide fallback suggestions when AI unavailable', async () => {
      parser.mockServiceUnavailable = true;

      try {
        await parser.parseWithAI({
          text: 'Test text',
          expectedFields: ['theater']
        });
        fail('Should have thrown service error');
      } catch (error) {
        expect(error.error).toBe('AI_SERVICE_UNAVAILABLE');
        expect(error.fallbackSuggestion).toContain('manual');
      }
    });

    it('should parse multiple entities in single text', async () => {
      const result = await parser.parseWithAI({
        text: 'Jasper Stoop, Nick Livramento Silva, Keja Klaasje Kwestro',
        context: 'Spel:',
        expectedFields: ['actors']
      });

      expect(result.parsedFields.actors).toHaveLength(3);
      expect(result.parsedFields.actors).toContain('Jasper Stoop');
      expect(result.parsedFields.actors).toContain('Nick Livramento Silva');
      expect(result.parsedFields.actors).toContain('Keja Klaasje Kwestro');
    });

    it('should identify ambiguous role assignments', async () => {
      const result = await parser.parseWithAI({
        text: 'Geert Lageveen, Belle van Heerikhuizen',
        context: 'Production team',
        expectedFields: ['directors', 'writers', 'actors']
      });

      expect(result.reasoning).toContain('ambiguous');
      expect(result.userValidationNeeded).toBeDefined();
      expect(result.confidence).toBeLessThan(100);
    });
  });
});