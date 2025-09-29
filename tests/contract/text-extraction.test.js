import { TextExtractor } from '../../src/services/text-extractor.js';

describe('Text Extraction Service Contract', () => {
  let extractor;

  beforeEach(() => {
    extractor = new TextExtractor();
  });

  describe('POST /extract', () => {
    it('should extract text from valid DOCX file', async () => {
      const mockFile = new File(['test content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await extractor.extract(mockFile);

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.html).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.wordCount).toBeGreaterThan(0);
      expect(result.metadata.processingTime).toBeLessThan(10000);
    });

    it('should return error for invalid file format', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      try {
        await extractor.extract(invalidFile);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.error).toBe('INVALID_FORMAT');
        expect(error.message).toContain('DOCX');
      }
    });

    it('should return error for corrupted DOCX file', async () => {
      const corruptedFile = new File(['invalid'], 'corrupted.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      try {
        await extractor.extract(corruptedFile);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.error).toBe('EXTRACTION_FAILED');
        expect(error.message).toBeDefined();
      }
    });

    it('should handle files larger than 5MB with warning', async () => {
      const largeContent = new Array(6 * 1024 * 1024).join('a');
      const largeFile = new File([largeContent], 'large.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      try {
        await extractor.extract(largeFile);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.error).toBe('FILE_TOO_LARGE');
        expect(error.message).toContain('5MB');
      }
    });

    it('should preserve HTML structure in output', async () => {
      const mockFile = new File(['<p>Test paragraph</p>'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const result = await extractor.extract(mockFile);
      expect(result.html).toContain('<p>');
      expect(result.html).toContain('</p>');
    });
  });
});