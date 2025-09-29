import { LitElement, html, css } from 'lit-html';

export class MPEntityCreator extends LitElement {
  static get properties() {
    return {
      isOpen: { type: Boolean },
      entityType: { type: String },
      entityName: { type: String },
      additionalFields: { type: Object },
      errors: { type: Array }
    };
  }

  constructor() {
    super();
    this.isOpen = false;
    this.entityType = '';
    this.entityName = '';
    this.additionalFields = {};
    this.errors = [];
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
      }

      .modal-overlay.hidden {
        display: none;
      }

      .modal {
        background: white;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      }

      .modal-header {
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        background: #f8f9fa;
        border-radius: 8px 8px 0 0;
      }

      .modal-title {
        font-size: 20px;
        font-weight: bold;
        margin: 0;
        color: #333;
      }

      .modal-subtitle {
        font-size: 14px;
        color: #666;
        margin-top: 5px;
      }

      .modal-content {
        padding: 20px;
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
        min-height: 80px;
        resize: vertical;
        font-family: inherit;
      }

      .field-hint {
        font-size: 12px;
        color: #999;
        margin-top: 5px;
      }

      .entity-type-badge {
        display: inline-block;
        background: var(--primary-color, #007bff);
        color: white;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 12px;
        text-transform: uppercase;
        margin-left: 10px;
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

      .modal-actions {
        padding: 20px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        background: #f8f9fa;
        border-radius: 0 0 8px 8px;
      }

      .button {
        padding: 10px 20px;
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

      .button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .additional-fields {
        border-top: 1px solid #e0e0e0;
        padding-top: 20px;
        margin-top: 20px;
      }

      .additional-fields-title {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 15px;
        color: #333;
      }

      .success-icon {
        display: inline-block;
        width: 20px;
        height: 20px;
        background: #4caf50;
        color: white;
        border-radius: 50%;
        text-align: center;
        line-height: 20px;
        margin-right: 5px;
      }
    `;
  }

  render() {
    return html`
      <div class="modal-overlay ${!this.isOpen ? 'hidden' : ''}">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">
              Create New ${this.getEntityLabel()}
              <span class="entity-type-badge">${this.entityType}</span>
            </h2>
            <div class="modal-subtitle">
              Add a new ${this.getEntityLabel()} to the database
            </div>
          </div>

          <div class="modal-content">
            ${this.errors.length > 0 ? html`
              <div class="error-list">
                ${this.errors.map(error => html`
                  <div class="error-item">• ${error}</div>
                `)}
              </div>
            ` : ''}

            <form @submit=${this.handleSubmit}>
              <div class="form-group">
                <label class="form-label required" for="entityName">
                  ${this.getNameLabel()}
                </label>
                <input
                  type="text"
                  id="entityName"
                  class="form-input"
                  .value=${this.entityName}
                  @input=${this.handleNameInput}
                  placeholder="Enter ${this.getEntityLabel()} name"
                  required>
                <div class="field-hint">
                  This will be the primary name for the ${this.getEntityLabel()}
                </div>
              </div>

              ${this.renderAdditionalFields()}
            </form>
          </div>

          <div class="modal-actions">
            <button class="button button-secondary" @click=${this.handleCancel}>
              Cancel
            </button>
            <button
              class="button button-primary"
              @click=${this.handleCreate}
              ?disabled=${!this.entityName}>
              <span class="success-icon">✓</span>
              Create ${this.getEntityLabel()}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderAdditionalFields() {
    switch(this.entityType) {
      case 'person':
        return this.renderPersonFields();
      case 'theater':
        return this.renderTheaterFields();
      case 'city':
        return this.renderCityFields();
      case 'group':
        return this.renderGroupFields();
      default:
        return '';
    }
  }

  renderPersonFields() {
    return html`
      <div class="additional-fields">
        <div class="additional-fields-title">Additional Information (Optional)</div>

        <div class="form-group">
          <label class="form-label" for="role">Primary Role</label>
          <select
            id="role"
            class="form-select"
            @change=${(e) => this.setAdditionalField('role', e.target.value)}>
            <option value="">Select a role</option>
            <option value="actor">Actor</option>
            <option value="director">Director</option>
            <option value="writer">Writer</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="biography">Biography</label>
          <textarea
            id="biography"
            class="form-textarea"
            placeholder="Brief biography or description"
            @input=${(e) => this.setAdditionalField('biography', e.target.value)}></textarea>
        </div>
      </div>
    `;
  }

  renderTheaterFields() {
    return html`
      <div class="additional-fields">
        <div class="additional-fields-title">Theater Details (Optional)</div>

        <div class="form-group">
          <label class="form-label" for="address">Address</label>
          <input
            type="text"
            id="address"
            class="form-input"
            placeholder="Street address"
            @input=${(e) => this.setAdditionalField('address', e.target.value)}>
        </div>

        <div class="form-group">
          <label class="form-label" for="city">City</label>
          <input
            type="text"
            id="city"
            class="form-input"
            placeholder="City where the theater is located"
            @input=${(e) => this.setAdditionalField('city', e.target.value)}>
        </div>

        <div class="form-group">
          <label class="form-label" for="capacity">Capacity</label>
          <input
            type="number"
            id="capacity"
            class="form-input"
            placeholder="Seating capacity"
            @input=${(e) => this.setAdditionalField('capacity', e.target.value)}>
        </div>
      </div>
    `;
  }

  renderCityFields() {
    return html`
      <div class="additional-fields">
        <div class="additional-fields-title">City Details (Optional)</div>

        <div class="form-group">
          <label class="form-label" for="province">Province/State</label>
          <input
            type="text"
            id="province"
            class="form-input"
            placeholder="Province or state"
            @input=${(e) => this.setAdditionalField('province', e.target.value)}>
        </div>

        <div class="form-group">
          <label class="form-label" for="country">Country</label>
          <input
            type="text"
            id="country"
            class="form-input"
            placeholder="Country"
            value="Netherlands"
            @input=${(e) => this.setAdditionalField('country', e.target.value)}>
        </div>
      </div>
    `;
  }

  renderGroupFields() {
    return html`
      <div class="additional-fields">
        <div class="additional-fields-title">Group/Company Details (Optional)</div>

        <div class="form-group">
          <label class="form-label" for="founded">Founded Year</label>
          <input
            type="number"
            id="founded"
            class="form-input"
            placeholder="Year founded (e.g., 1995)"
            min="1900"
            max="2100"
            @input=${(e) => this.setAdditionalField('founded', e.target.value)}>
        </div>

        <div class="form-group">
          <label class="form-label" for="description">Description</label>
          <textarea
            id="description"
            class="form-textarea"
            placeholder="Brief description of the group or company"
            @input=${(e) => this.setAdditionalField('description', e.target.value)}></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="website">Website</label>
          <input
            type="url"
            id="website"
            class="form-input"
            placeholder="https://example.com"
            @input=${(e) => this.setAdditionalField('website', e.target.value)}>
        </div>
      </div>
    `;
  }

  getEntityLabel() {
    const labels = {
      person: 'Person',
      theater: 'Theater',
      city: 'City',
      group: 'Group/Company'
    };
    return labels[this.entityType] || 'Entity';
  }

  getNameLabel() {
    const labels = {
      person: 'Full Name',
      theater: 'Theater Name',
      city: 'City Name',
      group: 'Group/Company Name'
    };
    return labels[this.entityType] || 'Name';
  }

  handleNameInput(e) {
    this.entityName = e.target.value;
  }

  setAdditionalField(field, value) {
    this.additionalFields = {
      ...this.additionalFields,
      [field]: value
    };
  }

  handleSubmit(e) {
    e.preventDefault();
    this.handleCreate();
  }

  async handleCreate() {
    if (!this.validateForm()) {
      return;
    }

    const entity = {
      name: this.entityName.trim(),
      ...this.additionalFields
    };

    try {
      const result = await this.createEntity();

      this.dispatchEvent(new CustomEvent('entity-created', {
        detail: {
          type: this.entityType,
          entity: { ...entity, id: result.id }
        },
        bubbles: true,
        composed: true
      }));

      this.close();
    } catch (error) {
      this.errors = [`Failed to create ${this.getEntityLabel()}: ${error.message}`];
    }
  }

  async createEntity() {
    return {
      id: this.generateId(),
      name: this.entityName,
      type: this.entityType,
      ...this.additionalFields
    };
  }

  generateId() {
    return 'entity-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  validateForm() {
    this.errors = [];

    if (!this.entityName || this.entityName.trim() === '') {
      this.errors.push(`${this.getNameLabel()} is required`);
    }

    if (this.entityName && this.entityName.trim().length < 2) {
      this.errors.push(`${this.getNameLabel()} must be at least 2 characters`);
    }

    if (this.additionalFields.website) {
      try {
        new URL(this.additionalFields.website);
      } catch {
        this.errors.push('Invalid website URL');
      }
    }

    if (this.additionalFields.capacity && this.additionalFields.capacity < 0) {
      this.errors.push('Capacity must be a positive number');
    }

    this.requestUpdate();
    return this.errors.length === 0;
  }

  handleCancel() {
    this.close();

    this.dispatchEvent(new CustomEvent('entity-cancel', {
      bubbles: true,
      composed: true
    }));
  }

  open(entityType, entityName = '') {
    this.isOpen = true;
    this.entityType = entityType;
    this.entityName = entityName;
    this.additionalFields = {};
    this.errors = [];
    this.requestUpdate();
  }

  close() {
    this.isOpen = false;
    this.entityType = '';
    this.entityName = '';
    this.additionalFields = {};
    this.errors = [];
    this.requestUpdate();
  }
}

customElements.define('mp-entity-creator', MPEntityCreator);