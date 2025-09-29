import { LitElement, html, css } from 'lit-html';

export class MPEntityMatcher extends LitElement {
  static get properties() {
    return {
      entities: { type: Object },
      parsedData: { type: Object },
      currentField: { type: String },
      currentValue: { type: String },
      matches: { type: Array },
      isOpen: { type: Boolean },
      resolvedEntities: { type: Object }
    };
  }

  constructor() {
    super();
    this.entities = { persons: [], theaters: [], cities: [], groups: [] };
    this.parsedData = {};
    this.currentField = '';
    this.currentValue = '';
    this.matches = [];
    this.isOpen = false;
    this.resolvedEntities = {};
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .dialog-overlay.hidden {
        display: none;
      }

      .dialog {
        background: white;
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      }

      .dialog-header {
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
      }

      .dialog-title {
        font-size: 20px;
        font-weight: bold;
        margin: 0;
        color: #333;
      }

      .dialog-subtitle {
        font-size: 14px;
        color: #666;
        margin-top: 5px;
      }

      .dialog-content {
        padding: 20px;
      }

      .input-value {
        background: #f5f5f5;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 20px;
        font-size: 16px;
        font-weight: 500;
      }

      .matches-list {
        margin-bottom: 20px;
      }

      .match-item {
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .match-item:hover {
        border-color: var(--primary-color, #007bff);
        background: #f8f9fa;
      }

      .match-item.selected {
        border-color: var(--primary-color, #007bff);
        background: #e3f2fd;
      }

      .match-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
      }

      .match-name {
        font-size: 16px;
        font-weight: 500;
        color: #333;
      }

      .match-similarity {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }

      .similarity-high {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .similarity-medium {
        background: #fff3e0;
        color: #f57c00;
      }

      .similarity-low {
        background: #ffebee;
        color: #c62828;
      }

      .match-reason {
        font-size: 14px;
        color: #666;
        margin-top: 5px;
      }

      .match-id {
        font-size: 12px;
        color: #999;
        margin-top: 5px;
      }

      .no-matches {
        text-align: center;
        padding: 30px;
        color: #666;
      }

      .dialog-actions {
        padding: 20px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
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

      .button-success {
        background: #4caf50;
        color: white;
      }

      .button-success:hover {
        background: #45a049;
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

      .create-new-section {
        border-top: 1px solid #e0e0e0;
        padding-top: 20px;
        margin-top: 20px;
      }

      .create-new-title {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 10px;
        color: #333;
      }

      .create-new-hint {
        font-size: 14px;
        color: #666;
        margin-bottom: 15px;
      }

      .confidence-badge {
        display: inline-block;
        background: #e3f2fd;
        color: #1976d2;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        margin-left: 5px;
      }

      .entity-type-badge {
        display: inline-block;
        background: #f5f5f5;
        color: #666;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        margin-left: 5px;
      }
    `;
  }

  render() {
    return html`
      <div class="dialog-overlay ${!this.isOpen ? 'hidden' : ''}">
        <div class="dialog">
          <div class="dialog-header">
            <h2 class="dialog-title">
              Potential Duplicate Detected
              ${this.getEntityTypeBadge()}
            </h2>
            <div class="dialog-subtitle">
              We found similar ${this.getEntityTypeLabel()} in the database
            </div>
          </div>

          <div class="dialog-content">
            <div class="input-value">
              Looking for: "${this.currentValue}"
            </div>

            ${this.matches.length > 0 ? this.renderMatches() : this.renderNoMatches()}

            <div class="create-new-section">
              <div class="create-new-title">Not finding what you're looking for?</div>
              <div class="create-new-hint">
                You can create a new ${this.getEntityTypeLabel()} if none of the above matches
              </div>
            </div>
          </div>

          <div class="dialog-actions">
            <button class="button button-secondary" @click=${this.handleCancel}>
              Cancel
            </button>
            <button class="button button-success" @click=${this.handleCreateNew}>
              Create New ${this.getEntityTypeLabel()}
            </button>
            <button
              class="button button-primary"
              @click=${this.handleUseSelected}
              ?disabled=${!this.getSelectedMatch()}>
              Use Selected
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderMatches() {
    return html`
      <div class="matches-list">
        ${this.matches.map((match, index) => html`
          <div
            class="match-item ${this.isSelected(match) ? 'selected' : ''}"
            @click=${() => this.selectMatch(match)}
            data-index="${index}">
            <div class="match-header">
              <span class="match-name">
                ${match.entity.name}
                ${match.confidence === 'high' ? html`
                  <span class="confidence-badge">Likely Match</span>
                ` : ''}
              </span>
              <span class="match-similarity similarity-${match.confidence}">
                ${match.similarity}% match
              </span>
            </div>
            <div class="match-reason">${match.reason}</div>
            <div class="match-id">ID: ${match.entity.id}</div>
          </div>
        `)}
      </div>
    `;
  }

  renderNoMatches() {
    return html`
      <div class="no-matches">
        <p>No similar ${this.getEntityTypeLabel()} found in the database.</p>
        <p>You can create a new one.</p>
      </div>
    `;
  }

  getEntityTypeBadge() {
    const type = this.getEntityType();
    if (!type) return '';

    return html`
      <span class="entity-type-badge">${type}</span>
    `;
  }

  getEntityType() {
    const fieldTypeMap = {
      actors: 'person',
      directors: 'person',
      writers: 'person',
      persons: 'person',
      theater: 'theater',
      city: 'city',
      groups: 'group'
    };
    return fieldTypeMap[this.currentField] || '';
  }

  getEntityTypeLabel() {
    const labels = {
      person: 'person',
      theater: 'theater',
      city: 'city',
      group: 'group'
    };
    return labels[this.getEntityType()] || 'entity';
  }

  isSelected(match) {
    const selected = this.shadowRoot?.querySelector('.match-item.selected');
    if (!selected) return false;
    const selectedIndex = parseInt(selected.dataset.index);
    const matchIndex = this.matches.indexOf(match);
    return selectedIndex === matchIndex;
  }

  selectMatch(match) {
    const items = this.shadowRoot.querySelectorAll('.match-item');
    items.forEach(item => item.classList.remove('selected'));

    const matchIndex = this.matches.indexOf(match);
    const selectedItem = this.shadowRoot.querySelector(`.match-item[data-index="${matchIndex}"]`);
    if (selectedItem) {
      selectedItem.classList.add('selected');
    }
  }

  getSelectedMatch() {
    const selected = this.shadowRoot?.querySelector('.match-item.selected');
    if (!selected) return null;
    const index = parseInt(selected.dataset.index);
    return this.matches[index];
  }

  async showDuplicateDialog(value, matches, field = '') {
    this.currentValue = value;
    this.currentField = field;
    this.matches = matches;
    this.isOpen = true;

    return new Promise((resolve) => {
      this.resolveDialog = resolve;
    });
  }

  async findDuplicates(parsedData, field) {
    const values = Array.isArray(parsedData[field])
      ? parsedData[field]
      : [parsedData[field]];

    const entityType = this.getEntityType();
    const collection = this.getEntityCollection(entityType);
    const allMatches = [];

    for (const value of values) {
      if (!value || value.trim() === '') continue;

      const matches = this.findSimilarEntities(value, collection, 70);
      if (matches.length > 0) {
        allMatches.push({
          inputName: value,
          candidates: matches
        });
      }
    }

    return allMatches;
  }

  async findDuplicatesForName(name, entityType) {
    const collection = this.getEntityCollection(entityType);
    return this.findSimilarEntities(name, collection, 70);
  }

  findSimilarEntities(name, entities, threshold) {
    const normalizedName = this.normalizeName(name);
    const candidates = [];

    for (const entity of entities) {
      const normalizedEntityName = this.normalizeName(entity.name);
      const similarity = this.calculateSimilarity(normalizedName, normalizedEntityName);

      if (similarity >= threshold) {
        candidates.push({
          entity,
          similarity,
          reason: this.getSimilarityReason(similarity),
          confidence: this.getConfidenceLevel(similarity)
        });
      }
    }

    return candidates.sort((a, b) => b.similarity - a.similarity);
  }

  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 100;

    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;

    return Math.round(similarity);
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  normalizeName(name) {
    return name
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^(van|de|den|der|het|la|le|el)\s+/i, '')
      .replace(/,\s*([^,]+)$/, ' $1');
  }

  getSimilarityReason(similarity) {
    if (similarity === 100) return 'Exact match';
    if (similarity >= 90) return 'Very strong name similarity - likely the same';
    if (similarity >= 85) return 'Strong name similarity - probably the same';
    if (similarity >= 75) return 'Good name similarity - possible match';
    if (similarity >= 70) return 'Moderate similarity - review carefully';
    return 'Weak similarity';
  }

  getConfidenceLevel(similarity) {
    if (similarity >= 85) return 'high';
    if (similarity >= 70) return 'medium';
    return 'low';
  }

  getEntityCollection(type) {
    const collections = {
      person: this.entities.persons || [],
      theater: this.entities.theaters || [],
      city: this.entities.cities || [],
      group: this.entities.groups || []
    };
    return collections[type] || [];
  }

  handleUseSelected() {
    const selected = this.getSelectedMatch();
    if (!selected) return;

    this.resolveEntity(selected.entity);
    this.closeDialog();
  }

  handleCreateNew() {
    this.dispatchEvent(new CustomEvent('create-entity', {
      detail: {
        type: this.getEntityType(),
        name: this.currentValue,
        field: this.currentField
      },
      bubbles: true,
      composed: true
    }));

    this.resolveEntity({ name: this.currentValue, isNew: true });
    this.closeDialog();
  }

  handleCancel() {
    this.resolveEntity(null);
    this.closeDialog();
  }

  resolveEntity(entity) {
    if (entity) {
      this.resolvedEntities[this.currentField] = entity;

      this.dispatchEvent(new CustomEvent('entity-resolved', {
        detail: {
          field: this.currentField,
          value: this.currentValue,
          resolution: entity
        },
        bubbles: true,
        composed: true
      }));
    }

    if (this.resolveDialog) {
      this.resolveDialog(entity);
    }
  }

  closeDialog() {
    this.isOpen = false;
    this.currentValue = '';
    this.currentField = '';
    this.matches = [];
    this.resolveDialog = null;
  }

  async waitForUserDecision() {
    return new Promise((resolve) => {
      this.resolveDialog = resolve;
    });
  }

  cacheResolution(originalName, resolvedEntity) {
    if (!this.resolutionCache) {
      this.resolutionCache = new Map();
    }
    this.resolutionCache.set(originalName, resolvedEntity);
  }

  getCachedResolution(name) {
    return this.resolutionCache?.get(name);
  }

  getResolvedEntity() {
    return this.resolvedEntities[this.currentField];
  }
}

customElements.define('mp-entity-matcher', MPEntityMatcher);