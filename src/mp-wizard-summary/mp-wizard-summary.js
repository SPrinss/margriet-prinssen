import { LitElement, html, css } from 'lit-html';

export class MPWizardSummary extends LitElement {
  static get properties() {
    return {
      totalCount: { type: Number },
      completedCount: { type: Number },
      skippedCount: { type: Number },
      errorCount: { type: Number },
      files: { type: Array }
    };
  }

  constructor() {
    super();
    this.totalCount = 0;
    this.completedCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
    this.files = [];
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 20px;
      }

      .summary-container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .summary-header {
        text-align: center;
        margin-bottom: 30px;
      }

      .success-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        background: #4caf50;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        color: white;
      }

      .warning-icon {
        background: #ff9800;
      }

      .error-icon {
        background: #f44336;
      }

      .summary-title {
        font-size: 28px;
        font-weight: bold;
        color: #333;
        margin-bottom: 10px;
      }

      .summary-subtitle {
        font-size: 16px;
        color: #666;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
        margin: 30px 0;
      }

      .stat-box {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        border: 2px solid transparent;
        transition: all 0.3s ease;
      }

      .stat-box:hover {
        border-color: #e0e0e0;
        transform: translateY(-2px);
      }

      .stat-number {
        font-size: 36px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .stat-label {
        font-size: 14px;
        text-transform: uppercase;
        color: #999;
        letter-spacing: 1px;
      }

      .stat-box.success .stat-number {
        color: #4caf50;
      }

      .stat-box.warning .stat-number {
        color: #ff9800;
      }

      .stat-box.error .stat-number {
        color: #f44336;
      }

      .stat-box.total .stat-number {
        color: #2196f3;
      }

      .file-details {
        margin-top: 30px;
        border-top: 1px solid #e0e0e0;
        padding-top: 30px;
      }

      .file-details-title {
        font-size: 20px;
        font-weight: 500;
        margin-bottom: 20px;
        color: #333;
      }

      .file-detail-item {
        display: flex;
        align-items: center;
        padding: 15px;
        margin-bottom: 10px;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 4px solid #e0e0e0;
      }

      .file-detail-item.completed {
        border-left-color: #4caf50;
      }

      .file-detail-item.skipped {
        border-left-color: #ff9800;
      }

      .file-detail-item.error {
        border-left-color: #f44336;
      }

      .file-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        font-size: 20px;
        background: white;
      }

      .file-icon.completed {
        color: #4caf50;
      }

      .file-icon.skipped {
        color: #ff9800;
      }

      .file-icon.error {
        color: #f44336;
      }

      .file-info {
        flex: 1;
      }

      .file-name {
        font-weight: 500;
        color: #333;
        margin-bottom: 5px;
      }

      .file-status-text {
        font-size: 14px;
        color: #666;
      }

      .file-error-message {
        font-size: 13px;
        color: #f44336;
        margin-top: 5px;
      }

      .action-buttons {
        display: flex;
        gap: 15px;
        justify-content: center;
        margin-top: 30px;
        padding-top: 30px;
        border-top: 1px solid #e0e0e0;
      }

      .button {
        padding: 12px 30px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .button-primary {
        background: var(--primary-color, #007bff);
        color: white;
      }

      .button-primary:hover {
        background: #0056b3;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,123,255,0.3);
      }

      .button-secondary {
        background: white;
        border: 2px solid #e0e0e0;
        color: #666;
      }

      .button-secondary:hover {
        background: #f5f5f5;
        border-color: #ccc;
      }

      .success-message {
        background: #e8f5e9;
        border: 1px solid #c8e6c9;
        color: #2e7d32;
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
        text-align: center;
      }

      .warning-message {
        background: #fff3e0;
        border: 1px solid #ffe0b2;
        color: #f57c00;
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
        text-align: center;
      }

      .percentage-bar {
        width: 100%;
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        margin: 20px 0;
      }

      .percentage-fill {
        height: 100%;
        background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
        border-radius: 4px;
        transition: width 0.5s ease;
      }

      .percentage-text {
        text-align: center;
        font-size: 14px;
        color: #666;
        margin-top: 5px;
      }
    `;
  }

  render() {
    const successRate = this.totalCount > 0
      ? Math.round((this.completedCount / this.totalCount) * 100)
      : 0;

    const hasErrors = this.errorCount > 0;
    const hasWarnings = this.skippedCount > 0;
    const allSuccess = this.completedCount === this.totalCount;

    return html`
      <div class="summary-container">
        <div class="summary-header">
          <div class="success-icon ${hasErrors ? 'error-icon' : hasWarnings ? 'warning-icon' : ''}">
            ${hasErrors ? '✗' : hasWarnings ? '!' : '✓'}
          </div>
          <h2 class="summary-title">
            ${allSuccess ? 'All Files Processed Successfully!' :
              hasErrors ? 'Processing Complete with Errors' :
              'Processing Complete'}
          </h2>
          <p class="summary-subtitle">
            Successfully processed ${this.completedCount} of ${this.totalCount} files
          </p>
        </div>

        <div class="percentage-bar">
          <div class="percentage-fill" style="width: ${successRate}%"></div>
        </div>
        <div class="percentage-text">${successRate}% Success Rate</div>

        <div class="stats-grid">
          <div class="stat-box total">
            <div class="stat-number">${this.totalCount}</div>
            <div class="stat-label">Total Files</div>
          </div>

          <div class="stat-box success">
            <div class="stat-number">${this.completedCount}</div>
            <div class="stat-label">Completed</div>
          </div>

          <div class="stat-box warning">
            <div class="stat-number">${this.skippedCount}</div>
            <div class="stat-label">Skipped</div>
          </div>

          <div class="stat-box error">
            <div class="stat-number">${this.errorCount}</div>
            <div class="stat-label">Errors</div>
          </div>
        </div>

        ${this.renderMessages()}
        ${this.renderFileDetails()}

        <div class="action-buttons">
          <button class="button button-secondary" @click=${this.handleDownloadReport}>
            Download Report
          </button>
          <button class="button button-secondary" @click=${this.handleViewDetails}>
            View Details
          </button>
          <button class="button button-primary" @click=${this.handleNewUpload}>
            Upload More Files
          </button>
        </div>
      </div>
    `;
  }

  renderMessages() {
    if (this.completedCount === this.totalCount) {
      return html`
        <div class="success-message">
          🎉 Excellent! All files have been processed and saved successfully.
        </div>
      `;
    }

    if (this.errorCount > 0) {
      return html`
        <div class="warning-message">
          ⚠️ ${this.errorCount} file${this.errorCount > 1 ? 's' : ''} encountered errors.
          Please review the details below.
        </div>
      `;
    }

    if (this.skippedCount > 0) {
      return html`
        <div class="warning-message">
          ℹ️ ${this.skippedCount} file${this.skippedCount > 1 ? 's were' : ' was'} skipped.
        </div>
      `;
    }

    return '';
  }

  renderFileDetails() {
    if (!this.files || this.files.length === 0) {
      return '';
    }

    const problemFiles = this.files.filter(f =>
      f.status === 'error' || f.status === 'skipped'
    );

    if (problemFiles.length === 0) {
      return '';
    }

    return html`
      <div class="file-details">
        <h3 class="file-details-title">File Processing Details</h3>

        ${problemFiles.map(file => html`
          <div class="file-detail-item ${file.status}">
            <div class="file-icon ${file.status}">
              ${file.status === 'error' ? '✗' :
                file.status === 'skipped' ? '⊘' : '✓'}
            </div>
            <div class="file-info">
              <div class="file-name">${file.fileName}</div>
              <div class="file-status-text">
                Status: ${this.getStatusLabel(file.status)}
              </div>
              ${file.errorMessage ? html`
                <div class="file-error-message">${file.errorMessage}</div>
              ` : ''}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  getStatusLabel(status) {
    const labels = {
      completed: 'Successfully processed',
      skipped: 'Skipped by user',
      error: 'Processing failed',
      pending: 'Not processed'
    };
    return labels[status] || status;
  }

  handleNewUpload() {
    this.dispatchEvent(new CustomEvent('restart-wizard', {
      bubbles: true,
      composed: true
    }));
  }

  handleDownloadReport() {
    const report = this.generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upload-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.dispatchEvent(new CustomEvent('download-report', {
      detail: { report },
      bubbles: true,
      composed: true
    }));
  }

  handleViewDetails() {
    this.dispatchEvent(new CustomEvent('view-details', {
      detail: { files: this.files },
      bubbles: true,
      composed: true
    }));
  }

  generateReport() {
    const timestamp = new Date().toLocaleString();
    const lines = [
      'File Upload Processing Report',
      '=' .repeat(40),
      `Generated: ${timestamp}`,
      '',
      'Summary Statistics:',
      `- Total Files: ${this.totalCount}`,
      `- Completed: ${this.completedCount}`,
      `- Skipped: ${this.skippedCount}`,
      `- Errors: ${this.errorCount}`,
      `- Success Rate: ${Math.round((this.completedCount / this.totalCount) * 100)}%`,
      '',
      'File Details:',
      '-'.repeat(40)
    ];

    if (this.files && this.files.length > 0) {
      this.files.forEach((file, index) => {
        lines.push(`${index + 1}. ${file.fileName}`);
        lines.push(`   Status: ${this.getStatusLabel(file.status)}`);
        if (file.errorMessage) {
          lines.push(`   Error: ${file.errorMessage}`);
        }
        if (file.parsedData) {
          lines.push(`   Parsed: ${Object.keys(file.parsedData).length} fields`);
        }
        lines.push('');
      });
    }

    return lines.join('\n');
  }

  reset() {
    this.totalCount = 0;
    this.completedCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
    this.files = [];
    this.requestUpdate();
  }
}

customElements.define('mp-wizard-summary', MPWizardSummary);