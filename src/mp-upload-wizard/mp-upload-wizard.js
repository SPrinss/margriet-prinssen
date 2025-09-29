import { LitElement, html, css } from 'lit-html';
import { WizardFile } from '../models/wizard-file.js';
import { ProcessingSession } from '../models/processing-session.js';
import { EntityCache } from '../models/entity-cache.js';
import { TextExtractor } from '../services/text-extractor.js';
import { DataParser } from '../services/data-parser.js';
import { EntityMatcher } from '../services/entity-matcher.js';
import { FirebaseAPI } from '../services/firebase-api.js';

import '../mp-file-drop/mp-file-drop.js';
import '../mp-file-processor/mp-file-processor.js';
import '../mp-review-form/mp-review-form.js';
import '../mp-interview-form/mp-interview-form.js';
import '../mp-entity-matcher/mp-entity-matcher.js';
import '../mp-wizard-progress/mp-wizard-progress.js';
import '../mp-wizard-summary/mp-wizard-summary.js';

export class MPUploadWizard extends LitElement {
  static get properties() {
    return {
      contentType: { type: String },
      wizardStep: { type: String },
      files: { type: Array },
      currentFileIndex: { type: Number },
      session: { type: Object },
      entityCache: { type: Object },
      completedCount: { type: Number },
      skippedCount: { type: Number },
      errorCount: { type: Number },
      mode: { type: String },
      authToken: { type: String }
    };
  }

  constructor() {
    super();
    this.contentType = null;
    this.wizardStep = 'upload';
    this.files = [];
    this.currentFileIndex = -1;
    this.session = new ProcessingSession();
    this.entityCache = new EntityCache();
    this.completedCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
    this.mode = 'wizard';
    this.authToken = null;

    this.textExtractor = new TextExtractor();
    this.dataParser = new DataParser();
    this.entityMatcher = new EntityMatcher();
    this.firebaseAPI = new FirebaseAPI();
  }

  static get styles() {
    return css`
      :host {
        display: block;
        font-family: var(--font-family, sans-serif);
      }

      .wizard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .wizard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
      }

      .wizard-title {
        font-size: 24px;
        font-weight: bold;
      }

      .content-type-selector {
        display: flex;
        gap: 20px;
        justify-content: center;
        padding: 40px;
      }

      .content-type-button {
        padding: 20px 40px;
        font-size: 18px;
        border: 2px solid var(--primary-color, #007bff);
        background: white;
        color: var(--primary-color, #007bff);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .content-type-button:hover {
        background: var(--primary-color, #007bff);
        color: white;
      }

      .content-type-button.selected {
        background: var(--primary-color, #007bff);
        color: white;
      }

      .wizard-content {
        min-height: 400px;
      }

      .error-message {
        background: #fee;
        color: #c00;
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
      }

      .warning-message {
        background: #ffd;
        color: #660;
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
      }

      .toggle-mode-button {
        padding: 8px 16px;
        border: 1px solid #ccc;
        background: white;
        border-radius: 4px;
        cursor: pointer;
      }
    `;
  }

  render() {
    return html`
      <div class="wizard-container">
        <div class="wizard-header">
          <div class="wizard-title">
            ${this.contentType === 'reviews' ? 'Upload Reviews' :
              this.contentType === 'interviews' ? 'Upload Interviews' :
              'File Upload Wizard'}
          </div>
          ${this.wizardStep === 'summary' ? html`
            <button class="toggle-mode-button" @click=${this.toggleToManualMode}>
              Switch to Manual Entry
            </button>
          ` : ''}
        </div>

        <div class="wizard-content">
          ${this.renderWizardStep()}
        </div>
      </div>
    `;
  }

  renderWizardStep() {
    switch(this.wizardStep) {
      case 'upload':
        return this.renderUploadStep();
      case 'process':
        return this.renderProcessStep();
      case 'summary':
        return this.renderSummaryStep();
      default:
        return html`<div class="error-message">Unknown wizard step</div>`;
    }
  }

  renderUploadStep() {
    if (!this.contentType) {
      return html`
        <div class="content-type-selector">
          <button
            class="content-type-button ${this.contentType === 'reviews' ? 'selected' : ''}"
            @click=${() => this.selectContentType('reviews')}>
            Upload Reviews
          </button>
          <button
            class="content-type-button ${this.contentType === 'interviews' ? 'selected' : ''}"
            @click=${() => this.selectContentType('interviews')}>
            Upload Interviews
          </button>
        </div>
      `;
    }

    return html`
      <mp-file-drop
        .contentType=${this.contentType}
        @files-dropped=${this.handleFilesDropped}>
      </mp-file-drop>
    `;
  }

  renderProcessStep() {
    const currentFile = this.getCurrentFile();

    if (!currentFile) {
      return html`<div class="error-message">No file to process</div>`;
    }

    return html`
      <mp-wizard-progress
        .total=${this.files.length}
        .current=${this.currentFileIndex + 1}
        .completed=${this.completedCount}
        .skipped=${this.skippedCount}
        .errors=${this.errorCount}>
      </mp-wizard-progress>

      <mp-file-processor
        .file=${currentFile}
        .contentType=${this.contentType}
        @file-completed=${this.handleFileCompleted}
        @file-skipped=${this.handleFileSkipped}
        @file-error=${this.handleFileError}>
      </mp-file-processor>

      ${currentFile.status === 'completed' && currentFile.parsedData ?
        this.renderForm(currentFile) : ''}

      ${currentFile.status === 'validating' && currentFile.requiresUserValidation() ?
        this.renderEntityMatcher(currentFile) : ''}
    `;
  }

  renderForm(file) {
    if (this.contentType === 'reviews') {
      return html`
        <mp-review-form
          .parsedData=${file.parsedData}
          .userEdits=${file.userEdits}
          @form-submit=${(e) => this.handleFormSubmit(e, file)}>
        </mp-review-form>
      `;
    } else if (this.contentType === 'interviews') {
      return html`
        <mp-interview-form
          .parsedData=${file.parsedData}
          .userEdits=${file.userEdits}
          @form-submit=${(e) => this.handleFormSubmit(e, file)}>
        </mp-interview-form>
      `;
    }
  }

  renderEntityMatcher(file) {
    return html`
      <mp-entity-matcher
        .entities=${this.entityCache.getAllEntities()}
        .parsedData=${file.parsedData}
        @entity-resolved=${(e) => this.handleEntityResolved(e, file)}>
      </mp-entity-matcher>
    `;
  }

  renderSummaryStep() {
    return html`
      <mp-wizard-summary
        .totalCount=${this.files.length}
        .completedCount=${this.completedCount}
        .skippedCount=${this.skippedCount}
        .errorCount=${this.errorCount}
        .files=${this.files}
        @restart-wizard=${this.restartWizard}>
      </mp-wizard-summary>
    `;
  }

  selectContentType(type) {
    this.contentType = type;
    this.session.setContentType(type);
    this.loadEntityCache();
  }

  async loadEntityCache() {
    if (this.authToken) {
      this.firebaseAPI.setAuthToken(this.authToken);
      await this.entityCache.updateFromAPI(this.firebaseAPI);
      this.entityMatcher.setEntities(this.entityCache.getAllEntities());
    }
  }

  async handleFilesDropped(event) {
    const files = event.detail.files;

    const maxFiles = 10;
    if (files.length > maxFiles) {
      this.showWarning(`Maximum ${maxFiles} files allowed. Only first ${maxFiles} will be processed.`);
      files.splice(maxFiles);
    }

    this.files = files.map(f => new WizardFile(f));
    this.session.addFiles(this.files);

    this.wizardStep = 'process';
    this.currentFileIndex = 0;

    this.processCurrentFile();
  }

  async processCurrentFile() {
    const file = this.getCurrentFile();
    if (!file) return;

    try {
      file.startExtraction();

      const extractResult = await this.textExtractor.extract(file.originalFile);
      file.setExtractedText(extractResult.text, extractResult.html);

      const parseResult = this.contentType === 'reviews' ?
        await this.dataParser.parseReviewMetadata(extractResult.text) :
        await this.dataParser.parseInterviewMetadata(extractResult.text);

      file.setParsedData(parseResult.parsedData, parseResult.parsingStages);

      if (file.requiresUserValidation()) {
        this.requestUpdate();
      } else {
        file.complete();
      }
    } catch (error) {
      file.setError(error.message || 'Processing failed');
      this.errorCount++;
    }

    this.requestUpdate();
  }

  getCurrentFile() {
    if (this.currentFileIndex >= 0 && this.currentFileIndex < this.files.length) {
      return this.files[this.currentFileIndex];
    }
    return null;
  }

  processNextFile() {
    this.currentFileIndex++;

    if (this.currentFileIndex >= this.files.length) {
      this.wizardStep = 'summary';
    } else {
      this.processCurrentFile();
    }
  }

  handleFileCompleted(event) {
    const file = this.getCurrentFile();
    if (file) {
      file.complete();
      this.completedCount++;
    }
    this.processNextFile();
  }

  handleFileSkipped(event) {
    const file = this.getCurrentFile();
    if (file) {
      file.skip();
      this.skippedCount++;
    }
    this.processNextFile();
  }

  handleFileError(event) {
    const file = this.getCurrentFile();
    if (file) {
      file.setError(event.detail.error);
      this.errorCount++;
    }
    this.processNextFile();
  }

  async handleFormSubmit(event, file) {
    const formData = event.detail;

    try {
      if (this.contentType === 'reviews') {
        const result = await this.firebaseAPI.createReview(formData);
        console.log('Review saved:', result);
      } else {
        const result = await this.firebaseAPI.createInterview(formData);
        console.log('Interview saved:', result);
      }

      file.complete();
      this.completedCount++;
      this.processNextFile();
    } catch (error) {
      console.error('Save failed:', error);
      file.setError(error.message);
      this.errorCount++;
      this.processNextFile();
    }
  }

  handleEntityResolved(event, file) {
    const { field, resolution } = event.detail;
    file.applyUserEdits({ [field]: resolution });
    this.requestUpdate();
  }

  async prepareFormData(fileIndex) {
    const file = this.files[fileIndex];
    return file.getFinalData();
  }

  async saveWithRetry(formData, retries = 2) {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.firebaseAPI.saveDocument(
          this.contentType,
          formData
        );
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  getSessionSummary() {
    return this.session.getSummary();
  }

  formatError(errorType) {
    const errorMessages = {
      'FILE_TOO_LARGE': 'File exceeds 5MB limit',
      'INVALID_FORMAT': 'DOCX files only',
      'EXTRACTION_FAILED': 'Could not extract text from file',
      'PARSING_FAILED': 'Could not parse metadata',
      'NETWORK_ERROR': 'Network error. Check your connection',
      'UNAUTHORIZED': 'Please sign in to continue'
    };

    return errorMessages[errorType] || 'An error occurred';
  }

  showWarning(message) {
    this.dispatchEvent(new CustomEvent('show-warning', {
      detail: { message },
      bubbles: true,
      composed: true
    }));
  }

  toggleToManualMode() {
    this.mode = 'manual';
    this.dispatchEvent(new CustomEvent('mode-changed', {
      detail: { mode: 'manual' },
      bubbles: true,
      composed: true
    }));
  }

  restartWizard() {
    this.session.reset();
    this.files = [];
    this.currentFileIndex = -1;
    this.wizardStep = 'upload';
    this.completedCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
    this.requestUpdate();
  }

  async refreshEntityCache() {
    await this.loadEntityCache();
    return this.entityCache.getAllEntities();
  }

  async resolveAllEntities(parsedData) {
    const resolutions = {};

    for (const [field, values] of Object.entries(parsedData)) {
      if (Array.isArray(values)) {
        resolutions[field] = [];
        for (const value of values) {
          const matches = await this.entityMatcher.findDuplicatesForName(
            value,
            this.getEntityTypeForField(field)
          );

          if (matches.length > 0 && matches[0].similarity >= 85) {
            resolutions[field].push(matches[0].entity);
          } else {
            resolutions[field].push({ name: value, isNew: true });
          }
        }
      }
    }

    return resolutions;
  }

  getEntityTypeForField(field) {
    const fieldTypeMap = {
      actors: 'person',
      directors: 'person',
      writers: 'person',
      persons: 'person',
      theater: 'theater',
      city: 'city',
      groups: 'group'
    };
    return fieldTypeMap[field] || 'person';
  }
}

customElements.define('mp-upload-wizard', MPUploadWizard);