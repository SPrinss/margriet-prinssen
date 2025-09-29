import { LitElement, html, css } from 'lit-html';

export class MPFileProcessor extends LitElement {
  static get properties() {
    return {
      file: { type: Object },
      contentType: { type: String },
      isProcessing: { type: Boolean }
    };
  }

  constructor() {
    super();
    this.file = null;
    this.contentType = '';
    this.isProcessing = false;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 20px;
      }

      .processor-container {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
      }

      .file-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e0e0e0;
      }

      .file-name {
        font-size: 18px;
        font-weight: 500;
      }

      .file-status {
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
      }

      .status-pending { background: #f0f0f0; color: #666; }
      .status-extracting { background: #e3f2fd; color: #1976d2; }
      .status-parsing { background: #fff3e0; color: #f57c00; }
      .status-validating { background: #f3e5f5; color: #7b1fa2; }
      .status-completed { background: #e8f5e9; color: #388e3c; }
      .status-error { background: #ffebee; color: #c62828; }
      .status-skipped { background: #fafafa; color: #757575; }

      .processing-content {
        min-height: 200px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .processing-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--primary-color, #007bff);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .processing-message {
        font-size: 16px;
        color: #666;
      }

      .extracted-text {
        background: #f8f8f8;
        padding: 15px;
        border-radius: 4px;
        margin: 15px 0;
        max-height: 200px;
        overflow-y: auto;
        font-family: monospace;
        font-size: 14px;
        white-space: pre-wrap;
      }

      .parsed-data {
        background: #f0f8ff;
        padding: 15px;
        border-radius: 4px;
        margin: 15px 0;
      }

      .parsed-field {
        margin: 8px 0;
        display: flex;
        align-items: center;
      }

      .field-label {
        font-weight: 500;
        margin-right: 10px;
        min-width: 120px;
      }

      .field-value {
        color: #666;
      }

      .error-message {
        background: #ffebee;
        color: #c62828;
        padding: 15px;
        border-radius: 4px;
        margin: 15px 0;
      }

      .action-buttons {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        justify-content: flex-end;
      }

      .button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .button-primary {
        background: var(--primary-color, #007bff);
        color: white;
      }

      .button-primary:hover {
        opacity: 0.9;
      }

      .button-secondary {
        background: white;
        border: 1px solid #ccc;
        color: #666;
      }

      .button-secondary:hover {
        background: #f5f5f5;
      }

      .button-skip {
        background: #ff9800;
        color: white;
      }

      .button-skip:hover {
        opacity: 0.9;
      }

      .confidence-indicator {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        margin-left: 10px;
      }

      .confidence-high { background: #e8f5e9; color: #388e3c; }
      .confidence-medium { background: #fff3e0; color: #f57c00; }
      .confidence-low { background: #ffebee; color: #c62828; }

      .ai-badge {
        display: inline-block;
        background: #e3f2fd;
        color: #1976d2;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        margin-left: 10px;
      }
    `;
  }

  render() {
    if (!this.file) {
      return html`<div class="error-message">No file to process</div>`;
    }

    return html`
      <div class="processor-container">
        <div class="file-info">
          <div class="file-name">${this.file.fileName}</div>
          <div class="file-status status-${this.file.status}">
            ${this.getStatusLabel(this.file.status)}
          </div>
        </div>

        ${this.renderProcessingContent()}
      </div>
    `;
  }

  renderProcessingContent() {
    const { status } = this.file;

    switch(status) {
      case 'pending':
        return this.renderPending();
      case 'extracting':
        return this.renderExtracting();
      case 'parsing':
        return this.renderParsing();
      case 'validating':
        return this.renderValidating();
      case 'completed':
        return this.renderCompleted();
      case 'error':
        return this.renderError();
      case 'skipped':
        return this.renderSkipped();
      default:
        return html`<div>Unknown status</div>`;
    }
  }

  renderPending() {
    return html`
      <div class="processing-content">
        <div class="processing-message">Waiting to process...</div>
      </div>
    `;
  }

  renderExtracting() {
    return html`
      <div class="processing-content">
        <div class="processing-spinner"></div>
        <div class="processing-message">Extracting text from DOCX file...</div>
      </div>
    `;
  }

  renderParsing() {
    return html`
      <div class="processing-content">
        <div class="processing-spinner"></div>
        <div class="processing-message">
          Parsing ${this.contentType === 'reviews' ? 'review' : 'interview'} metadata...
          ${this.file.aiParsingUsed ? html`<span class="ai-badge">AI Assisted</span>` : ''}
        </div>
      </div>
    `;
  }

  renderValidating() {
    return html`
      <div class="processing-content">
        ${this.file.extractedText ? html`
          <div class="extracted-text">
            ${this.file.extractedText.substring(0, 500)}${this.file.extractedText.length > 500 ? '...' : ''}
          </div>
        ` : ''}

        ${this.renderParsedData()}

        <div class="processing-message">
          Please verify the extracted information
          ${this.file.userValidationRequired ? html`
            <div style="margin-top: 10px; color: #f57c00;">
              Some fields require your confirmation
            </div>
          ` : ''}
        </div>

        <div class="action-buttons">
          <button class="button button-secondary" @click=${this.handleEdit}>
            Edit
          </button>
          <button class="button button-primary" @click=${this.handleContinue}>
            Continue
          </button>
        </div>
      </div>
    `;
  }

  renderCompleted() {
    return html`
      <div class="processing-content">
        ${this.renderParsedData()}

        <div class="action-buttons">
          <button class="button button-primary" @click=${this.handleProceed}>
            Proceed to Next File
          </button>
        </div>
      </div>
    `;
  }

  renderError() {
    return html`
      <div class="error-message">
        <strong>Error:</strong> ${this.file.errorMessage || 'Processing failed'}
      </div>

      <div class="action-buttons">
        <button class="button button-skip" @click=${this.handleSkip}>
          Skip File
        </button>
        <button class="button button-secondary" @click=${this.handleRetry}>
          Retry
        </button>
        <button class="button button-primary" @click=${this.handleManualEntry}>
          Manual Entry
        </button>
      </div>
    `;
  }

  renderSkipped() {
    return html`
      <div class="processing-content">
        <div class="processing-message">File skipped</div>

        <div class="action-buttons">
          <button class="button button-primary" @click=${this.handleProceed}>
            Continue
          </button>
        </div>
      </div>
    `;
  }

  renderParsedData() {
    if (!this.file.parsedData) return '';

    const data = this.file.parsedData;
    const confidence = this.calculateOverallConfidence();

    return html`
      <div class="parsed-data">
        <h3>
          Extracted Information
          ${confidence < 100 ? html`
            <span class="confidence-indicator confidence-${this.getConfidenceLevel(confidence)}">
              ${confidence}% confidence
            </span>
          ` : ''}
          ${this.file.aiParsingUsed ? html`<span class="ai-badge">AI Assisted</span>` : ''}
        </h3>

        ${this.contentType === 'reviews' ? this.renderReviewData(data) : this.renderInterviewData(data)}
      </div>
    `;
  }

  renderReviewData(data) {
    return html`
      ${data.title ? html`
        <div class="parsed-field">
          <span class="field-label">Title:</span>
          <span class="field-value">${data.title}</span>
        </div>
      ` : ''}

      ${data.theater ? html`
        <div class="parsed-field">
          <span class="field-label">Theater:</span>
          <span class="field-value">${data.theater}</span>
        </div>
      ` : ''}

      ${data.city ? html`
        <div class="parsed-field">
          <span class="field-label">City:</span>
          <span class="field-value">${data.city}</span>
        </div>
      ` : ''}

      ${data.performanceDate ? html`
        <div class="parsed-field">
          <span class="field-label">Date:</span>
          <span class="field-value">${data.performanceDate}</span>
        </div>
      ` : ''}

      ${data.actors && data.actors.length > 0 ? html`
        <div class="parsed-field">
          <span class="field-label">Actors:</span>
          <span class="field-value">${data.actors.join(', ')}</span>
        </div>
      ` : ''}

      ${data.directors && data.directors.length > 0 ? html`
        <div class="parsed-field">
          <span class="field-label">Directors:</span>
          <span class="field-value">${data.directors.join(', ')}</span>
        </div>
      ` : ''}

      ${data.writers && data.writers.length > 0 ? html`
        <div class="parsed-field">
          <span class="field-label">Writers:</span>
          <span class="field-value">${data.writers.join(', ')}</span>
        </div>
      ` : ''}
    `;
  }

  renderInterviewData(data) {
    return html`
      ${data.title ? html`
        <div class="parsed-field">
          <span class="field-label">Title:</span>
          <span class="field-value">${data.title}</span>
        </div>
      ` : ''}

      ${data.persons && data.persons.length > 0 ? html`
        <div class="parsed-field">
          <span class="field-label">Interviewees:</span>
          <span class="field-value">${data.persons.join(', ')}</span>
        </div>
      ` : ''}

      ${data.interviewDate ? html`
        <div class="parsed-field">
          <span class="field-label">Date:</span>
          <span class="field-value">${data.interviewDate}</span>
        </div>
      ` : ''}
    `;
  }

  getStatusLabel(status) {
    const labels = {
      'pending': 'Pending',
      'extracting': 'Extracting Text',
      'parsing': 'Parsing Metadata',
      'validating': 'Validating',
      'completed': 'Completed',
      'error': 'Error',
      'skipped': 'Skipped'
    };
    return labels[status] || status;
  }

  calculateOverallConfidence() {
    if (!this.file.parsingStages || this.file.parsingStages.length === 0) {
      return 100;
    }

    const confidences = this.file.parsingStages.map(s => s.confidence);
    return Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
  }

  getConfidenceLevel(confidence) {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  }

  handleContinue() {
    this.dispatchEvent(new CustomEvent('file-completed', {
      detail: {
        fileIndex: this.file.index,
        formData: this.file.getFinalData()
      },
      bubbles: true,
      composed: true
    }));
  }

  handleSkip() {
    this.dispatchEvent(new CustomEvent('file-skipped', {
      detail: { fileIndex: this.file.index },
      bubbles: true,
      composed: true
    }));
  }

  handleRetry() {
    this.dispatchEvent(new CustomEvent('file-retry', {
      detail: { fileIndex: this.file.index },
      bubbles: true,
      composed: true
    }));
  }

  handleEdit() {
    this.dispatchEvent(new CustomEvent('file-edit', {
      detail: { fileIndex: this.file.index },
      bubbles: true,
      composed: true
    }));
  }

  handleManualEntry() {
    this.dispatchEvent(new CustomEvent('manual-entry', {
      detail: { fileIndex: this.file.index },
      bubbles: true,
      composed: true
    }));
  }

  handleProceed() {
    this.dispatchEvent(new CustomEvent('proceed-next', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('mp-file-processor', MPFileProcessor);