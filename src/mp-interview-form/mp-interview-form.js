import { LitElement, html, css } from 'lit-html';

export class MPInterviewForm extends LitElement {
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
      .form-textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }

      .form-input:focus,
      .form-textarea:focus {
        outline: none;
        border-color: var(--primary-color, #007bff);
        box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
      }

      .form-textarea {
        min-height: 200px;
        resize: vertical;
        font-family: inherit;
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
        <h2 class="form-title">Interview Details</h2>

        ${this.errors.length > 0 ? html`
          <div class="error-list">
            ${this.errors.map(error => html`
              <div class="error-item">• ${error}</div>
            `)}
          </div>
        ` : ''}

        <form @submit=${this.handleSubmit}>
          <div class="form-group">
            <label class="form-label required" for="title">Interview Title</label>
            <input
              type="text"
              id="title"
              name="title"
              class="form-input ${this.isModified('title') ? 'field-modified' : ''}"
              .value=${this.getValue('title')}
              @input=${this.handleInput}
              required>
            <div class="field-hint">The headline or title of the interview</div>
          </div>

          <div class="form-group">
            <label class="form-label required" for="interviewDate">Interview Date</label>
            <input
              type="date"
              id="interviewDate"
              name="interviewDate"
              class="form-input date-input ${this.isModified('interviewDate') ? 'field-modified' : ''}"
              .value=${this.getValue('interviewDate')}
              @input=${this.handleInput}
              required>
            <div class="field-hint">Date when the interview was conducted</div>
          </div>

          <div class="form-group">
            <label class="form-label required">Interviewees</label>
            <div class="array-field">
              ${this.renderPersonsField()}
              <button type="button" class="add-button" @click=${() => this.addPerson()}>
                + Add Person
              </button>
            </div>
            <div class="field-hint">People being interviewed</div>
          </div>

          <div class="form-group">
            <label class="form-label required" for="content">Interview Content</label>
            <textarea
              id="content"
              name="content"
              class="form-textarea ${this.isModified('content') ? 'field-modified' : ''}"
              .value=${this.getValue('content')}
              @input=${this.handleInput}
              required></textarea>
            <div class="field-hint">The full text of the interview</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              class="form-input ${this.isModified('location') ? 'field-modified' : ''}"
              .value=${this.getValue('location')}
              @input=${this.handleInput}>
            <div class="field-hint">Where the interview took place</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="interviewer">Interviewer</label>
            <input
              type="text"
              id="interviewer"
              name="interviewer"
              class="form-input ${this.isModified('interviewer') ? 'field-modified' : ''}"
              .value=${this.getValue('interviewer')}
              @input=${this.handleInput}>
            <div class="field-hint">Person conducting the interview</div>
          </div>

          <div class="form-actions">
            <button type="button" class="button button-secondary" @click=${this.handleCancel}>
              Cancel
            </button>
            <button type="button" class="button button-secondary" @click=${this.handleSaveDraft}>
              Save Draft
            </button>
            <button type="submit" class="button button-primary">
              Save Interview
            </button>
          </div>
        </form>
      </div>
    `;
  }

  renderPersonsField() {
    const persons = this.getValue('persons') || [];

    if (persons.length === 0) {
      return html`
        <div class="array-item">
          <input
            type="text"
            name="persons"
            data-index="0"
            class="form-input"
            placeholder="Enter person's name"
            @input=${(e) => this.handlePersonInput(e, 0)}>
        </div>
      `;
    }

    return persons.map((person, index) => html`
      <div class="array-item">
        <input
          type="text"
          name="persons"
          data-index="${index}"
          class="form-input ${this.isModified(`persons.${index}`) ? 'field-modified' : ''}"
          .value=${person}
          placeholder="Enter person's name"
          @input=${(e) => this.handlePersonInput(e, index)}>
        ${persons.length > 1 ? html`
          <button
            type="button"
            class="remove-button"
            @click=${() => this.removePerson(index)}>
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
    if (fieldName.includes('.')) {
      const [field, index] = fieldName.split('.');
      const originalArray = this.parsedData[field] || [];
      const currentArray = this.getValue(field) || [];
      return originalArray[index] !== currentArray[index];
    }
    return this.userEdits[fieldName] !== undefined &&
           this.userEdits[fieldName] !== this.parsedData[fieldName];
  }

  handleInput(e) {
    const { name, value } = e.target;
    this.setValue(name, value);
  }

  handlePersonInput(e, index) {
    const persons = [...(this.getValue('persons') || [])];
    persons[index] = e.target.value;
    this.setValue('persons', persons.filter(p => p !== ''));
  }

  addPerson() {
    const persons = [...(this.getValue('persons') || []), ''];
    this.setValue('persons', persons);
  }

  removePerson(index) {
    const persons = [...(this.getValue('persons') || [])];
    persons.splice(index, 1);
    this.setValue('persons', persons);
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

    const required = ['title', 'interviewDate', 'content'];

    for (const field of required) {
      const value = this.getValue(field);
      if (!value || value.trim() === '') {
        this.errors.push(`${this.getFieldLabel(field)} is required`);
      }
    }

    const persons = this.getValue('persons') || [];
    const validPersons = persons.filter(p => p && p.trim() !== '');

    if (validPersons.length === 0) {
      this.errors.push('At least one interviewee is required');
    }

    const dateValue = this.getValue('interviewDate');
    if (dateValue && !this.isValidDate(dateValue)) {
      this.errors.push('Invalid interview date format');
    }

    this.requestUpdate();
    return this.errors.length === 0;
  }

  isValidDate(dateStr) {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  }

  getFieldLabel(field) {
    const labels = {
      title: 'Interview Title',
      interviewDate: 'Interview Date',
      content: 'Interview Content',
      persons: 'Interviewees'
    };
    return labels[field] || field;
  }

  getFormData() {
    const data = { ...this.parsedData, ...this.userEdits };

    if (data.persons) {
      data.persons = data.persons.filter(p => p && p.trim() !== '');
    }

    if (!data.persons || data.persons.length === 0) {
      data.persons = [];
    }

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

customElements.define('mp-interview-form', MPInterviewForm);