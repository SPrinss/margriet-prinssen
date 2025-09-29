export class WizardFile {
  constructor(originalFile) {
    this.originalFile = originalFile;
    this.fileName = originalFile.name;
    this.extractedText = '';
    this.parsedData = null;
    this.userEdits = {};
    this.parsingStages = [];
    this.status = 'pending';
    this.matchingEntities = {};
    this.errorMessage = null;
    this.processingTimestamp = null;
    this.aiParsingUsed = false;
    this.userValidationRequired = null;
    this.metadata = {
      size: originalFile.size,
      type: originalFile.type,
      lastModified: originalFile.lastModified
    };
  }

  validate() {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!validTypes.includes(this.originalFile.type)) {
      throw new Error('File must be DOCX format');
    }

    if (this.status === 'error' && !this.errorMessage) {
      throw new Error('Error status requires errorMessage');
    }

    if (this.status !== 'error' && !this.extractedText && this.status !== 'pending') {
      throw new Error('ExtractedText required for non-error status');
    }

    const validStatuses = ['pending', 'extracting', 'parsing', 'validating', 'completed', 'skipped', 'error'];
    if (!validStatuses.includes(this.status)) {
      throw new Error(`Invalid status: ${this.status}`);
    }

    return true;
  }

  updateStatus(newStatus) {
    const statusTransitions = {
      'pending': ['extracting', 'error', 'skipped'],
      'extracting': ['parsing', 'error', 'skipped'],
      'parsing': ['validating', 'completed', 'error', 'skipped'],
      'validating': ['completed', 'error', 'skipped'],
      'completed': [],
      'skipped': [],
      'error': ['pending']
    };

    const currentTransitions = statusTransitions[this.status] || [];

    if (!currentTransitions.includes(newStatus)) {
      console.warn(`Invalid status transition from ${this.status} to ${newStatus}`);
      return false;
    }

    this.status = newStatus;

    if (newStatus === 'extracting' || newStatus === 'parsing') {
      this.processingTimestamp = Date.now();
    }

    return true;
  }

  startExtraction() {
    this.updateStatus('extracting');
    this.processingTimestamp = Date.now();
  }

  setExtractedText(text, html = '') {
    this.extractedText = text;
    this.htmlContent = html;
    if (this.status === 'extracting') {
      this.updateStatus('parsing');
    }
  }

  setParsedData(data, stages = []) {
    this.parsedData = data;
    this.parsingStages = stages;

    if (stages.some(s => s.stage === 'ai')) {
      this.aiParsingUsed = true;
    }

    const lowConfidenceStages = stages.filter(s => s.confidence < 80);
    if (lowConfidenceStages.length > 0) {
      this.userValidationRequired = lowConfidenceStages.map(s => Object.keys(s.output)).flat();
      if (this.status === 'parsing') {
        this.updateStatus('validating');
      }
    } else if (this.status === 'parsing') {
      this.updateStatus('completed');
    }
  }

  applyUserEdits(edits) {
    this.userEdits = { ...this.userEdits, ...edits };
  }

  setMatchingEntities(matches) {
    this.matchingEntities = matches;
  }

  setError(message) {
    this.updateStatus('error');
    this.errorMessage = message;
  }

  skip() {
    this.updateStatus('skipped');
  }

  complete() {
    this.updateStatus('completed');
  }

  getFinalData() {
    return {
      ...this.parsedData,
      ...this.userEdits
    };
  }

  getProcessingTime() {
    if (!this.processingTimestamp) return 0;
    return Date.now() - this.processingTimestamp;
  }

  requiresUserValidation() {
    return this.userValidationRequired && this.userValidationRequired.length > 0;
  }

  toJSON() {
    return {
      fileName: this.fileName,
      status: this.status,
      parsedData: this.parsedData,
      userEdits: this.userEdits,
      errorMessage: this.errorMessage,
      aiParsingUsed: this.aiParsingUsed,
      processingTime: this.getProcessingTime()
    };
  }
}