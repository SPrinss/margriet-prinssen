import { LitElement, html, css } from 'lit-html';

export class MPWizardProgress extends LitElement {
  static get properties() {
    return {
      total: { type: Number },
      current: { type: Number },
      completed: { type: Number },
      skipped: { type: Number },
      errors: { type: Number }
    };
  }

  constructor() {
    super();
    this.total = 0;
    this.current = 0;
    this.completed = 0;
    this.skipped = 0;
    this.errors = 0;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 20px;
      }

      .progress-container {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .progress-title {
        font-size: 18px;
        font-weight: 500;
        color: #333;
      }

      .progress-current {
        font-size: 16px;
        color: #666;
      }

      .progress-bar-container {
        background: #f5f5f5;
        border-radius: 8px;
        height: 8px;
        overflow: hidden;
        margin-bottom: 20px;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg,
          var(--primary-color, #007bff) 0%,
          var(--primary-color, #007bff) 100%);
        transition: width 0.3s ease;
        border-radius: 8px;
      }

      .progress-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 15px;
      }

      .stat-card {
        background: #f8f9fa;
        border-radius: 6px;
        padding: 12px;
        text-align: center;
      }

      .stat-value {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      .stat-label {
        font-size: 12px;
        text-transform: uppercase;
        color: #666;
        letter-spacing: 0.5px;
      }

      .stat-completed .stat-value {
        color: #4caf50;
      }

      .stat-skipped .stat-value {
        color: #ff9800;
      }

      .stat-errors .stat-value {
        color: #f44336;
      }

      .stat-remaining .stat-value {
        color: #2196f3;
      }

      .progress-percentage {
        font-size: 14px;
        font-weight: 500;
        color: var(--primary-color, #007bff);
        margin-left: 10px;
      }

      .file-list {
        margin-top: 20px;
        border-top: 1px solid #e0e0e0;
        padding-top: 20px;
      }

      .file-item {
        display: flex;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .file-item:last-child {
        border-bottom: none;
      }

      .file-number {
        display: inline-block;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #e0e0e0;
        color: #666;
        text-align: center;
        line-height: 30px;
        font-size: 14px;
        font-weight: 500;
        margin-right: 15px;
      }

      .file-number.current {
        background: var(--primary-color, #007bff);
        color: white;
      }

      .file-number.completed {
        background: #4caf50;
        color: white;
      }

      .file-number.skipped {
        background: #ff9800;
        color: white;
      }

      .file-number.error {
        background: #f44336;
        color: white;
      }

      .file-name {
        flex: 1;
        font-size: 14px;
        color: #333;
      }

      .file-status {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        background: #f5f5f5;
        color: #666;
      }

      .time-estimate {
        margin-top: 15px;
        padding: 10px;
        background: #e3f2fd;
        border-radius: 6px;
        text-align: center;
        font-size: 14px;
        color: #1976d2;
      }

      .pulse {
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }

      .icon {
        display: inline-block;
        width: 16px;
        height: 16px;
        margin-right: 5px;
        vertical-align: middle;
      }

      .icon-check { color: #4caf50; }
      .icon-skip { color: #ff9800; }
      .icon-error { color: #f44336; }
      .icon-processing { color: var(--primary-color, #007bff); }
    `;
  }

  render() {
    const processed = this.completed + this.skipped + this.errors;
    const remaining = this.total - processed;
    const percentage = this.total > 0 ? Math.round((processed / this.total) * 100) : 0;

    return html`
      <div class="progress-container">
        <div class="progress-header">
          <div class="progress-title">
            Processing Files
            <span class="progress-percentage">${percentage}%</span>
          </div>
          <div class="progress-current">
            ${this.current > 0 && this.current <= this.total ?
              html`File ${this.current} of ${this.total}` :
              html`${processed} of ${this.total} processed`}
          </div>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${percentage}%"></div>
        </div>

        <div class="progress-stats">
          <div class="stat-card stat-completed">
            <div class="stat-value">${this.completed}</div>
            <div class="stat-label">Completed</div>
          </div>

          <div class="stat-card stat-skipped">
            <div class="stat-value">${this.skipped}</div>
            <div class="stat-label">Skipped</div>
          </div>

          <div class="stat-card stat-errors">
            <div class="stat-value">${this.errors}</div>
            <div class="stat-label">Errors</div>
          </div>

          <div class="stat-card stat-remaining">
            <div class="stat-value">${remaining}</div>
            <div class="stat-label">Remaining</div>
          </div>
        </div>

        ${this.renderTimeEstimate(remaining)}

        ${this.renderFileList()}
      </div>
    `;
  }

  renderTimeEstimate(remaining) {
    if (remaining === 0) {
      return html`
        <div class="time-estimate">
          All files processed!
        </div>
      `;
    }

    const estimatedSeconds = remaining * 10; // 10 seconds per file estimate
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = estimatedSeconds % 60;

    return html`
      <div class="time-estimate pulse">
        Estimated time remaining: ${minutes > 0 ? `${minutes}m ` : ''}${seconds}s
      </div>
    `;
  }

  renderFileList() {
    if (this.total === 0) return '';

    return html`
      <div class="file-list">
        ${Array.from({ length: this.total }, (_, i) => i + 1).map(num => {
          const status = this.getFileStatus(num);
          return html`
            <div class="file-item">
              <span class="file-number ${status}">${num}</span>
              <span class="file-name">
                ${this.getStatusIcon(status)}
                File ${num}
              </span>
              <span class="file-status">${this.getStatusLabel(status)}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  getFileStatus(fileNumber) {
    const processed = this.completed + this.skipped + this.errors;

    if (fileNumber === this.current && this.current <= this.total) {
      return 'current';
    }

    if (fileNumber <= this.completed) {
      return 'completed';
    }

    if (fileNumber <= this.completed + this.skipped) {
      return 'skipped';
    }

    if (fileNumber <= processed) {
      return 'error';
    }

    return 'pending';
  }

  getStatusIcon(status) {
    switch(status) {
      case 'completed':
        return html`<span class="icon icon-check">✓</span>`;
      case 'skipped':
        return html`<span class="icon icon-skip">⊘</span>`;
      case 'error':
        return html`<span class="icon icon-error">✗</span>`;
      case 'current':
        return html`<span class="icon icon-processing">⟳</span>`;
      default:
        return '';
    }
  }

  getStatusLabel(status) {
    const labels = {
      completed: 'Completed',
      skipped: 'Skipped',
      error: 'Error',
      current: 'Processing...',
      pending: 'Pending'
    };
    return labels[status] || status;
  }

  updateProgress(data) {
    if (data.total !== undefined) this.total = data.total;
    if (data.current !== undefined) this.current = data.current;
    if (data.completed !== undefined) this.completed = data.completed;
    if (data.skipped !== undefined) this.skipped = data.skipped;
    if (data.errors !== undefined) this.errors = data.errors;
    this.requestUpdate();
  }

  reset() {
    this.total = 0;
    this.current = 0;
    this.completed = 0;
    this.skipped = 0;
    this.errors = 0;
    this.requestUpdate();
  }
}

customElements.define('mp-wizard-progress', MPWizardProgress);