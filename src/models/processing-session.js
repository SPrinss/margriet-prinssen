export class ProcessingSession {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.contentType = null;
    this.files = [];
    this.currentFileIndex = -1;
    this.entities = null;
    this.wizardStep = 'upload';
    this.startTimestamp = Date.now();
    this.completedCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
    this.totalProcessingTime = 0;
  }

  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setContentType(type) {
    const validTypes = ['reviews', 'interviews'];

    if (!validTypes.includes(type)) {
      throw new Error(`Invalid content type: ${type}. Must be 'reviews' or 'interviews'`);
    }

    if (this.files.length > 0) {
      throw new Error('Cannot change content type after files are added');
    }

    this.contentType = type;
  }

  addFiles(files) {
    if (!this.contentType) {
      throw new Error('Content type must be set before adding files');
    }

    this.files.push(...files);

    if (this.wizardStep === 'upload' && this.files.length > 0) {
      this.transitionToProcessStep();
    }
  }

  transitionToProcessStep() {
    if (this.wizardStep !== 'upload') {
      throw new Error('Can only transition to process from upload step');
    }

    this.wizardStep = 'process';
    this.currentFileIndex = 0;
  }

  transitionToSummaryStep() {
    if (this.wizardStep !== 'process') {
      throw new Error('Can only transition to summary from process step');
    }

    this.wizardStep = 'summary';
    this.currentFileIndex = -1;
  }

  getCurrentFile() {
    if (this.currentFileIndex < 0 || this.currentFileIndex >= this.files.length) {
      return null;
    }
    return this.files[this.currentFileIndex];
  }

  moveToNextFile() {
    if (this.currentFileIndex < this.files.length - 1) {
      this.currentFileIndex++;
      return true;
    }

    this.transitionToSummaryStep();
    return false;
  }

  completeCurrentFile() {
    const file = this.getCurrentFile();

    if (!file) {
      throw new Error('No current file to complete');
    }

    if (file.status === 'completed') {
      this.completedCount++;
    } else if (file.status === 'skipped') {
      this.skippedCount++;
    } else if (file.status === 'error') {
      this.errorCount++;
    }

    this.totalProcessingTime += file.getProcessingTime();
    return this.moveToNextFile();
  }

  skipCurrentFile() {
    const file = this.getCurrentFile();

    if (file) {
      file.skip();
      this.skippedCount++;
      return this.moveToNextFile();
    }

    return false;
  }

  setEntityCache(entities) {
    this.entities = entities;
  }

  getProgress() {
    const total = this.files.length;
    const processed = this.completedCount + this.skippedCount + this.errorCount;

    return {
      total,
      processed,
      remaining: total - processed,
      percentComplete: total > 0 ? Math.round((processed / total) * 100) : 0,
      currentFile: this.currentFileIndex + 1,
      completed: this.completedCount,
      skipped: this.skippedCount,
      errors: this.errorCount
    };
  }

  getSessionDuration() {
    return Date.now() - this.startTimestamp;
  }

  getAverageProcessingTime() {
    const processedCount = this.completedCount + this.errorCount;
    return processedCount > 0 ? Math.round(this.totalProcessingTime / processedCount) : 0;
  }

  getSummary() {
    return {
      sessionId: this.sessionId,
      contentType: this.contentType,
      totalFiles: this.files.length,
      completed: this.completedCount,
      skipped: this.skippedCount,
      errors: this.errorCount,
      sessionDuration: this.getSessionDuration(),
      averageProcessingTime: this.getAverageProcessingTime(),
      errorDetails: this.files
        .filter(f => f.status === 'error')
        .map(f => ({
          fileName: f.fileName,
          error: f.errorMessage
        }))
    };
  }

  validate() {
    if (this.currentFileIndex >= this.files.length) {
      throw new Error('Invalid currentFileIndex');
    }

    const totalProcessed = this.completedCount + this.skippedCount + this.errorCount;
    if (totalProcessed > this.files.length) {
      throw new Error('Processed count exceeds total files');
    }

    const validSteps = ['upload', 'process', 'summary'];
    if (!validSteps.includes(this.wizardStep)) {
      throw new Error(`Invalid wizard step: ${this.wizardStep}`);
    }

    return true;
  }

  reset() {
    this.files = [];
    this.currentFileIndex = -1;
    this.wizardStep = 'upload';
    this.completedCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
    this.totalProcessingTime = 0;
    this.startTimestamp = Date.now();
  }

  toJSON() {
    return {
      sessionId: this.sessionId,
      contentType: this.contentType,
      wizardStep: this.wizardStep,
      progress: this.getProgress(),
      summary: this.getSummary()
    };
  }
}