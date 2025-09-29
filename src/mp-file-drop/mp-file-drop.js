import { LitElement, html, css } from 'lit-html';

export class MPFileDrop extends LitElement {
  static get properties() {
    return {
      contentType: { type: String },
      isDragging: { type: Boolean },
      files: { type: Array }
    };
  }

  constructor() {
    super();
    this.contentType = '';
    this.isDragging = false;
    this.files = [];
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .drop-zone {
        border: 3px dashed #ccc;
        border-radius: 8px;
        padding: 60px 40px;
        text-align: center;
        background: #fafafa;
        transition: all 0.3s ease;
        cursor: pointer;
        min-height: 300px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .drop-zone.dragging {
        border-color: var(--primary-color, #007bff);
        background: #f0f8ff;
      }

      .drop-zone:hover {
        border-color: #999;
      }

      .drop-icon {
        font-size: 64px;
        color: #999;
        margin-bottom: 20px;
      }

      .drop-text {
        font-size: 20px;
        color: #666;
        margin-bottom: 10px;
      }

      .drop-hint {
        font-size: 14px;
        color: #999;
      }

      input[type="file"] {
        display: none;
      }

      .file-list {
        margin-top: 20px;
        text-align: left;
      }

      .file-item {
        padding: 10px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .file-name {
        font-weight: 500;
      }

      .file-size {
        color: #999;
        font-size: 14px;
        margin-left: 10px;
      }

      .remove-file {
        background: none;
        border: none;
        color: #c00;
        cursor: pointer;
        font-size: 20px;
        padding: 0 5px;
      }

      .upload-button {
        margin-top: 20px;
        padding: 12px 24px;
        background: var(--primary-color, #007bff);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
      }

      .upload-button:hover {
        opacity: 0.9;
      }

      .upload-button:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .error {
        color: #c00;
        margin-top: 10px;
      }
    `;
  }

  render() {
    return html`
      <div
        class="drop-zone ${this.isDragging ? 'dragging' : ''}"
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
        @click=${this.handleClick}>

        ${this.files.length === 0 ? html`
          <div class="drop-icon">📄</div>
          <div class="drop-text">
            Drop ${this.contentType || 'DOCX'} files here
          </div>
          <div class="drop-hint">
            or click to browse
          </div>
        ` : ''}

        <input
          type="file"
          id="fileInput"
          multiple
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          @change=${this.handleFileSelect}>
      </div>

      ${this.files.length > 0 ? html`
        <div class="file-list">
          ${this.files.map((file, index) => html`
            <div class="file-item">
              <div>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
              </div>
              <button
                class="remove-file"
                @click=${() => this.removeFile(index)}>
                ×
              </button>
            </div>
          `)}
        </div>

        <button
          class="upload-button"
          @click=${this.startUpload}
          ?disabled=${this.files.length === 0}>
          Start Processing ${this.files.length} file${this.files.length > 1 ? 's' : ''}
        </button>
      ` : ''}
    `;
  }

  handleClick() {
    this.shadowRoot.getElementById('fileInput').click();
  }

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;

    const files = Array.from(e.dataTransfer.files);
    this.addFiles(files);
  }

  handleFileSelect(e) {
    const files = Array.from(e.target.files);
    this.addFiles(files);
  }

  addFiles(files) {
    const validFiles = files.filter(file => {
      const isValid = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                     file.name.toLowerCase().endsWith('.docx');

      if (!isValid) {
        this.showError(`${file.name} is not a valid DOCX file`);
      }

      return isValid;
    });

    this.files = [...this.files, ...validFiles];

    if (this.files.length > 10) {
      this.showError('Maximum 10 files allowed');
      this.files = this.files.slice(0, 10);
    }

    this.requestUpdate();
  }

  removeFile(index) {
    this.files.splice(index, 1);
    this.requestUpdate();
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  startUpload() {
    this.dispatchEvent(new CustomEvent('files-dropped', {
      detail: { files: this.files },
      bubbles: true,
      composed: true
    }));

    this.files = [];
    this.requestUpdate();
  }

  showError(message) {
    this.dispatchEvent(new CustomEvent('file-error', {
      detail: { message },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('mp-file-drop', MPFileDrop);