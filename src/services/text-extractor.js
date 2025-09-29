import mammoth from 'mammoth';

export class TextExtractor {
  constructor() {
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
  }

  async extract(file) {
    const startTime = Date.now();

    try {
      this.validateFile(file);

      const arrayBuffer = await this.fileToArrayBuffer(file);
      const result = await mammoth.convertToHtml({ arrayBuffer });

      const text = this.htmlToText(result.value);
      const wordCount = this.countWords(text);
      const processingTime = Date.now() - startTime;

      return {
        text,
        html: result.value,
        metadata: {
          wordCount,
          processingTime
        }
      };
    } catch (error) {
      if (error.error) {
        throw error;
      }
      throw {
        error: 'EXTRACTION_FAILED',
        message: `Failed to extract text from DOCX: ${error.message}`,
        details: error.stack
      };
    }
  }

  validateFile(file) {
    if (!file) {
      throw {
        error: 'INVALID_FORMAT',
        message: 'No file provided'
      };
    }

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!validTypes.includes(file.type)) {
      throw {
        error: 'INVALID_FORMAT',
        message: 'File must be a DOCX document'
      };
    }

    if (file.size > this.maxFileSize) {
      throw {
        error: 'FILE_TOO_LARGE',
        message: `File exceeds 5MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      };
    }
  }

  async fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  htmlToText(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  async extractMultiple(files) {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.extract(file);
        results.push({ file: file.name, success: true, ...result });
      } catch (error) {
        results.push({ file: file.name, success: false, error });
      }
    }

    return results;
  }
}