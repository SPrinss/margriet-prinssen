import { LitElement, html, css } from 'lit-html';

export class MPReviewForm extends LitElement {
  static get properties() {
    return {
      parsedData: { type: Object },
      userEdits: { type: Object },
      mode: { type: String },
      errors: { type: Array }
    };
  }

  constructor() {
    super();
    this.parsedData = {};
    this.userEdits = {};
    this.mode = 'edit';
    this.errors = [];
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 20px;
      }

      .form-container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .form-title {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #333;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #555;
      }

      .form-label.required::after {
        content: ' *';
        color: #c00;
      }

      .form-input,
      .form-select,
      .form-textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }

      .form-input:focus,
      .form-select:focus,
      .form-textarea:focus {
        outline: none;
        border-color: var(--primary-color, #007bff);
        box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
      }

      .form-textarea {
        min-height: 150px;
        resize: vertical;
        font-family: inherit;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .array-field {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .array-item {
        display: flex;
        gap: 10px;
      }

      .array-item input {
        flex: 1;
      }

      .add-button,
      .remove-button {
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }

      .add-button {
        background: #4caf50;
        color: white;
        margin-top: 5px;
      }

      .add-button:hover {
        background: #45a049;
      }

      .remove-button {
        background: #f44336;
        color: white;
        min-width: 30px;
      }

      .remove-button:hover {
        background: #da190b;
      }

      .date-input {
        width: 100%;
      }

      .form-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
      }

      .button {
        padding: 12px 24px;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .button-primary {
        background: var(--primary-color, #007bff);
        color: white;
      }

      .button-primary:hover {
        background: #0056b3;
      }

      .button-secondary {
        background: white;
        border: 1px solid #ccc;
        color: #666;
      }

      .button-secondary:hover {
        background: #f5f5f5;
      }

      .error-list {
        background: #ffebee;
        border: 1px solid #ffcdd2;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 20px;
      }

      .error-item {
        color: #c62828;
        margin-bottom: 5px;
      }

      .field-modified {
        background: #fffde7;
      }

      .field-ai-suggested {
        border-left: 3px solid #2196f3;
        padding-left: 7px;
      }

      .field-hint {
        font-size: 12px;
        color: #999;
        margin-top: 5px;
      }
    `;
  }

  render() {
    return html`
      <div class="form-container">
        <h2 class="form-title">Review Details</h2>

        ${this.errors.length > 0 ? html`
          <div class="error-list">
            ${this.errors.map(error => html`
              <div class="error-item">• ${error}</div>
            `)}
          </div>
        ` : ''}

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label class="form-label required" for="title">Review Title</label>
            <input
              type="text"
              id="title"
              name="title"
              class="form-input ${this.isModified('title') ? 'field-modified' : ''}"
              .value=${this.getValue('title')}
              @input=${this.handleInput}
              required>
            <div class="field-hint">The headline or title of the review</div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required" for="name">Play/Performance Name</label>
              <input
                type="text"
                id="name"
                name="name"
                class="form-input ${this.isModified('name') ? 'field-modified' : ''}"
                .value=${this.getValue('name')}
                @input=${this.handleInput}
                required>
            </div>

            <div class="form-group">
              <label class="form-label required" for="performanceDate">Performance Date</label>
              <input
                type="date"
                id="performanceDate"
                name="performanceDate"
                class="form-input date-input ${this.isModified('performanceDate') ? 'field-modified' : ''}"
                .value=${this.getValue('performanceDate')}
                @input=${this.handleInput}
                required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required" for="theater">Theater</label>
              <input
                type="text"
                id="theater"
                name="theater"
                class="form-input ${this.isModified('theater') ? 'field-modified' : ''}"
                .value=${this.getValue('theater')}
                @input=${this.handleInput}
                required>
            </div>

            <div class="form-group">
              <label class="form-label required" for="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                class="form-input ${this.isModified('city') ? 'field-modified' : ''}"
                .value=${this.getValue('city')}
                @input=${this.handleInput}
                required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="location">Location/Venue</label>
            <input
              type="text"
              id="location"
              name="location"
              class="form-input ${this.isModified('location') ? 'field-modified' : ''}"
              .value=${this.getValue('location')}
              @input=${this.handleInput}>
            <div class="field-hint">Specific venue or location within the theater</div>
          </div>

          <div class="form-group">
            <label class="form-label">Actors</label>
            <div class="array-field">
              ${this.renderArrayField('actors')}
              <button type="button" class="add-button" @click=${() => this.addArrayItem('actors')}>
                + Add Actor
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Directors</label>
            <div class="array-field">
              ${this.renderArrayField('directors')}
              <button type="button" class="add-button" @click=${() => this.addArrayItem('directors')}>
                + Add Director
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Writers</label>
            <div class="array-field">
              ${this.renderArrayField('writers')}
              <button type="button" class="add-button" @click=${() => this.addArrayItem('writers')}>
                + Add Writer
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Groups/Companies</label>
            <div class="array-field">
              ${this.renderArrayField('groups')}
              <button type="button" class="add-button" @click=${() => this.addArrayItem('groups')}>
                + Add Group
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required" for="reviewContent">Review Content</label>
            <textarea
              id="reviewContent"
              name="reviewContent"
              class="form-textarea ${this.isModified('reviewContent') ? 'field-modified' : ''}"
              .value=${this.getValue('reviewContent')}
              @input=${this.handleInput}
              required></textarea>
            <div class="field-hint">The full text of the review</div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="reviewDate">Review Date</label>
              <input
                type="date"
                id="reviewDate"
                name="reviewDate"
                class="form-input date-input ${this.isModified('reviewDate') ? 'field-modified' : ''}"
                .value=${this.getValue('reviewDate')}
                @input=${this.handleInput}>
              <div class="field-hint">Date when the review was written</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="reviewTitle">Review Subtitle</label>
              <input
                type="text"
                id="reviewTitle"
                name="reviewTitle"
                class="form-input ${this.isModified('reviewTitle') ? 'field-modified' : ''}"
                .value=${this.getValue('reviewTitle')}
                @input=${this.handleInput}>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="button button-secondary" @click=${this.handleCancel}>
              Cancel
            </button>
            <button type="button" class="button button-secondary" @click=${this.handleSaveDraft}>
              Save Draft
            </button>
            <button type="submit" class="button button-primary">
              Save Review
            </button>
          </div>
        </form>
      </div>
    `;
  }

  renderArrayField(fieldName) {
    const values = this.getValue(fieldName) || [];

    if (values.length === 0) {
      return html`
        <div class="array-item">
          <input
            type="text"
            name="${fieldName}"
            data-index="0"
            class="form-input"
            @input=${(e) => this.handleArrayInput(e, fieldName, 0)}>
        </div>
      `;
    }

    return values.map((value, index) => html`
      <div class="array-item">
        <input
          type="text"
          name="${fieldName}"
          data-index="${index}"
          class="form-input ${this.isModified(`${fieldName}.${index}`) ? 'field-modified' : ''}"
          .value=${value}
          @input=${(e) => this.handleArrayInput(e, fieldName, index)}>
        ${values.length > 1 ? html`
          <button
            type="button"
            class="remove-button"
            @click=${() => this.removeArrayItem(fieldName, index)}>
            ×
          </button>
        ` : ''}
      </div>
    `);
  }

  getValue(fieldName) {
    return this.userEdits[fieldName] !== undefined
      ? this.userEdits[fieldName]
      : this.parsedData[fieldName] || '';
  }

  setValue(fieldName, value) {
    this.userEdits = {
      ...this.userEdits,
      [fieldName]: value
    };
    this.requestUpdate();
  }

  isModified(fieldName) {
    return this.userEdits[fieldName] !== undefined &&
           this.userEdits[fieldName] !== this.parsedData[fieldName];
  }

  handleInput(e) {
    const { name, value } = e.target;
    this.setValue(name, value);
  }

  handleArrayInput(e, fieldName, index) {
    const values = [...(this.getValue(fieldName) || [])];
    values[index] = e.target.value;
    this.setValue(fieldName, values.filter(v => v !== ''));
  }

  addArrayItem(fieldName) {
    const values = [...(this.getValue(fieldName) || []), ''];
    this.setValue(fieldName, values);
  }

  removeArrayItem(fieldName, index) {
    const values = [...(this.getValue(fieldName) || [])];
    values.splice(index, 1);
    this.setValue(fieldName, values);
  }

  handleSubmit(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    const formData = this.getFormData();

    this.dispatchEvent(new CustomEvent('form-submit', {
      detail: formData,
      bubbles: true,
      composed: true
    }));
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent('form-cancel', {
      bubbles: true,
      composed: true
    }));
  }

  handleSaveDraft() {
    const formData = this.getFormData();

    this.dispatchEvent(new CustomEvent('save-draft', {
      detail: formData,
      bubbles: true,
      composed: true
    }));
  }

  validateForm() {
    this.errors = [];

    const required = ['title', 'name', 'city', 'theater', 'performanceDate', 'reviewContent'];

    for (const field of required) {
      const value = this.getValue(field);
      if (!value || value.trim() === '') {
        this.errors.push(`${this.getFieldLabel(field)} is required`);
      }
    }

    const atLeastOne = ['actors', 'directors', 'writers'];
    const hasOne = atLeastOne.some(field => {
      const values = this.getValue(field);
      return values && values.length > 0 && values.some(v => v.trim() !== '');
    });

    if (!hasOne) {
      this.errors.push('At least one actor, director, or writer is required');
    }

    this.requestUpdate();
    return this.errors.length === 0;
  }

  getFieldLabel(field) {
    const labels = {
      title: 'Review Title',
      name: 'Play Name',
      city: 'City',
      theater: 'Theater',
      performanceDate: 'Performance Date',
      reviewContent: 'Review Content'
    };
    return labels[field] || field;
  }

  getFormData() {
    const data = { ...this.parsedData, ...this.userEdits };

    ['actors', 'directors', 'writers', 'groups'].forEach(field => {
      if (data[field]) {
        data[field] = data[field].filter(v => v && v.trim() !== '');
      }
    });

    return data;
  }

  getValidationErrors() {
    return this.errors;
  }

  populateForm(data) {
    this.parsedData = data;
    this.userEdits = {};
    this.errors = [];
    this.requestUpdate();
  }

  clearForm() {
    this.parsedData = {};
    this.userEdits = {};
    this.errors = [];
    this.requestUpdate();
  }

  submitForm() {
    this.handleSubmit(new Event('submit'));
  }
}

customElements.define('mp-review-form', MPReviewForm);