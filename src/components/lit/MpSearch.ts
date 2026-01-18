import { LitElement, html, css } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import algoliasearch, { SearchClient, SearchIndex } from 'algoliasearch/lite';

/**
 * Algolia configuration object
 */
interface AlgoliaConfig {
  applicationId: string;
  searchOnlyAPIKey: string;
  index: string;
}

/**
 * Search result item from Algolia
 */
interface SearchHit {
  objectID: string;
  title?: string;
  name?: string;
  slug?: string;
  groups?: string[];
  reviewDate?: string;
  theater?: string;
  city?: string;
  actors?: string[];
  directors?: string[];
  writers?: string[];
  [key: string]: unknown;
}

/**
 * Facet result item
 */
interface FacetItem {
  value: string;
  count: number;
  category: string;
}

/**
 * Search result item (either facet or title)
 */
interface SearchItem extends Partial<SearchHit> {
  value: string;
  count?: number;
  category?: string;
}

/**
 * MpSearch - Algolia search component for theater journalist website
 *
 * Usage in Astro:
 * ```astro
 * <mp-search client:only="lit" index="reviews"></mp-search>
 * <script>
 *   import '../components/lit/MpSearch';
 * </script>
 * ```
 */
@customElement('mp-search')
export class MpSearch extends LitElement {
  static override styles = css`
    :host,
    :host *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    [hidden] {
      display: none !important;
    }

    :host {
      --mp-border-radius--1: 5px;
      --mp-size--1: 4px;
      --mp-size--2: 8px;
      --mp-size--3: 12px;
      --mp-size--4: 16px;
      --mp-size--5: 20px;
      --mp-size--6: 24px;
      --mp-size--7: 32px;
      --mp-size--8: 40px;
      --mp-color-main: #b2cdff;
      --mp-color-secondary: #f4d18f;
      --mp-color-main--100: #b2cdff;
      --mp-color-main--90: #b9d2ff;
      --mp-color-main--80: #c1d7ff;
      --mp-color-main--70: #c9dcff;
      --mp-color-main--60: #d0e1ff;
      --mp-color-main--50: #d8e6ff;
      --mp-color-main--40: #e0ebff;
      --mp-color-main--30: #e7f0ff;
      --mp-color-main--20: #eff5ff;
      --mp-color-main--10: #f7faff;
      --mp-color-secondary--100: #f4d18f;
      --mp-color-dark--100: #000;
      --mp-color-dark--80: #333;
      --mp-color-dark--70: #4c4c4c;
      --mp-color-dark--60: #666;
      --mp-color-dark--50: #7f7f7f;
      --mp-color-light--100: #fff;
      --mp-color-light--90: rgba(255, 255, 255, 0.9);
      --mp-color-light--70: rgba(255, 255, 255, 0.7);
      --mp-color-light--30: rgba(255, 255, 255, 0.3);
      --mp-text-b-font-family: 'Work Sans', sans-serif;
      --mp-text-b-font-weight: 400;
      --mp-text-b-line-height: 150%;
      --mp-text-b2-font-size: 18px;
      --mp-text-b3-font-size: 16px;
      --mp-text-h-font-family: 'Raleway', serif;
      --mp-text-h-font-weight: 700;
      --mp-text-h4-font-size: 26px;
      --mp-text-h4-font-weight: 600;
      --mp-box-shadow--3: 0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1);

      font-size: 0;
      display: block;
    }

    main {
      width: 100%;
    }

    section {
      display: flex;
      justify-content: flex-start;
    }

    /* Filters container */
    .filters-container {
      display: flex;
      justify-content: flex-start;
      flex-direction: row;
      flex-wrap: wrap;
      width: 100%;
      margin-bottom: var(--mp-size--3);
    }

    .filters-container li {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      font-family: var(--mp-text-b-font-family);
      font-size: var(--mp-text-b2-font-size);
      font-weight: var(--mp-text-b-font-weight);
      line-height: var(--mp-text-b-line-height);
      margin: var(--mp-size--2) var(--mp-size--3) 0 0;
      padding: var(--mp-size--2);
      color: var(--mp-color-dark--100);
      background: var(--mp-color-main--100);
      border-radius: var(--mp-border-radius--1);
    }

    .filters-container li button {
      background: inherit;
      border: none;
      padding: 0 var(--mp-size--3);
      font-family: var(--mp-text-b-font-family);
      font-size: var(--mp-text-b2-font-size);
      font-weight: var(--mp-text-b-font-weight);
      line-height: var(--mp-text-b-line-height);
      cursor: pointer;
      color: inherit;
    }

    .filters-container li[disabled] {
      opacity: 0.4;
    }

    .filters-container li[disabled] button {
      cursor: not-allowed;
    }

    #filters-erase-button {
      opacity: 1;
      transition: opacity 0.4s ease-in-out;
    }

    #filters-erase-button[disabled] {
      opacity: 0;
      transition: opacity 0.4s ease-in-out;
    }

    .filters-container li:last-of-type {
      margin-left: auto;
      margin-right: 0;
    }

    /* Search section */
    #search-section {
      display: flex;
      width: 100%;
    }

    /* Combobox styles */
    .combobox-container {
      flex: 1;
      position: relative;
      height: 48px;
    }

    .combobox-input {
      width: 100%;
      height: 100%;
      padding: var(--mp-size--2);
      border: none;
      border-radius: var(--mp-border-radius--1);
      background-color: var(--mp-color-light--100);
      font-family: var(--mp-text-b-font-family);
      font-size: var(--mp-text-b3-font-size);
      font-weight: var(--mp-text-b-font-weight);
      line-height: var(--mp-text-b-line-height);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    :host([allow-filters]) .combobox-input {
      border-radius: var(--mp-border-radius--1) 0 0 var(--mp-border-radius--1);
    }

    .combobox-input:focus {
      outline: 2px solid var(--mp-color-main--100);
      outline-offset: -2px;
    }

    .results-wrapper {
      position: absolute;
      z-index: 10;
      width: 100%;
      max-height: 400px;
      overflow: auto;
      overscroll-behavior: contain;
      box-shadow: var(--mp-box-shadow--3);
      background: var(--mp-color-main--40);
      border-radius: 0 0 var(--mp-border-radius--1) var(--mp-border-radius--1);
    }

    .results-wrapper.hidden {
      display: none;
    }

    .result-item {
      padding: var(--mp-size--2);
      cursor: pointer;
      font-family: var(--mp-text-b-font-family);
      font-size: var(--mp-text-b3-font-size);
      font-weight: var(--mp-text-b-font-weight);
      line-height: var(--mp-text-b-line-height);
      color: var(--mp-color-dark--100);
      background: var(--mp-color-main--40);
    }

    .result-item:hover,
    .result-item.focused {
      background: var(--mp-color-main--60);
    }

    .result-category {
      color: var(--mp-color-dark--80);
    }

    .result-count {
      color: var(--mp-color-dark--80);
    }

    /* Filter button */
    .filter-button {
      padding: var(--mp-size--2) var(--mp-size--4);
      background: var(--mp-color-main--100);
      border: none;
      border-radius: 0 var(--mp-border-radius--1) var(--mp-border-radius--1) 0;
      cursor: pointer;
      font-family: var(--mp-text-b-font-family);
      font-size: var(--mp-text-b3-font-size);
      font-weight: var(--mp-text-b-font-weight);
      color: var(--mp-color-dark--100);
      white-space: nowrap;
    }

    .filter-button:hover:not(:disabled) {
      background: var(--mp-color-main--80);
    }

    .filter-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Checkbox container */
    #title-check-logo-container {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 100%;
      flex-wrap: wrap;
      align-items: center;
    }

    #titles-checkbox-container {
      font-family: var(--mp-text-b-font-family);
      font-size: var(--mp-text-b2-font-size);
      font-weight: var(--mp-text-b-font-weight);
      line-height: var(--mp-text-b-line-height);
      display: flex;
      margin-top: var(--mp-size--3);
      align-items: center;
      gap: var(--mp-size--2);
    }

    #titles-checkbox-container input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    /* Pagination */
    #pagination-list {
      display: flex;
      flex-direction: row;
      justify-content: center;
      width: 100%;
      flex-wrap: wrap;
      gap: var(--mp-size--2);
      margin-top: var(--mp-size--4);
    }

    .pagination-item {
      cursor: pointer;
      font-family: var(--mp-text-h-font-family);
      font-size: var(--mp-text-h4-font-size);
      font-weight: var(--mp-text-h4-font-weight);
      color: var(--mp-color-dark--50);
      padding: var(--mp-size--1) var(--mp-size--2);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .pagination-item:hover {
      color: var(--mp-color-dark--80);
    }

    .pagination-item[active] {
      color: var(--mp-color-dark--100);
    }

    /* Search results display */
    .search-results {
      display: grid;
      gap: var(--mp-size--3);
      grid-template-columns: repeat(2, 1fr);
      align-items: start;
      margin-top: var(--mp-size--4);
    }

    .review-card {
      display: block;
      height: 100%;
      text-decoration: none;
      color: inherit;
    }

    .recensie-preview {
      display: flex;
      flex-direction: column;
      height: 100%;
      border-radius: var(--mp-border-radius--1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .recensie-preview:hover {
      transform: scale(1.01);
      cursor: pointer;
      box-shadow: var(--mp-box-shadow--3);
    }

    .recensie-preview header {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-end;
      padding: var(--mp-size--4);
      background-color: var(--mp-color-main--60);
      color: var(--mp-color-dark--100);
    }

    .header-main {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      flex: 1;
    }

    .header-main h4 {
      margin: 0;
      font-family: var(--mp-text-h-font-family);
      font-size: var(--mp-text-h4-font-size);
      font-weight: var(--mp-text-h4-font-weight);
      line-height: 1.3;
    }

    .header-main h5 {
      margin: 0;
      font-family: var(--mp-text-h-font-family);
      font-size: 20px;
      font-weight: 500;
    }

    .header-main h6 {
      margin: var(--mp-size--1) 0 0;
      font-family: var(--mp-text-b-font-family);
      font-size: var(--mp-text-b3-font-size);
      font-weight: var(--mp-text-b-font-weight);
    }

    .header-meta {
      flex: 1;
      text-align: right;
    }

    .header-meta ul {
      list-style: none;
      padding: 0;
      margin: 0;
      font-family: var(--mp-text-b-font-family);
      font-size: var(--mp-text-b3-font-size);
    }

    .persons-section {
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      flex-wrap: nowrap;
      padding: var(--mp-size--4);
      background-color: var(--mp-color-secondary--100);
      flex: 1;
    }

    .persons-grid {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: var(--mp-size--3);
    }

    .persons-grid ul {
      list-style: none;
      padding: 0;
      margin: 0;
      font-family: var(--mp-text-b-font-family);
      font-size: var(--mp-text-b3-font-size);
    }

    .persons-grid ul li.label {
      margin-bottom: var(--mp-size--1);
      color: var(--mp-color-dark--60);
    }

    @media only screen and (max-width: 660px) {
      #search-section {
        display: block;
      }

      .filter-button {
        width: 100%;
        margin-top: var(--mp-size--2);
        border-radius: var(--mp-border-radius--1);
      }

      :host([allow-filters]) .combobox-input {
        border-radius: var(--mp-border-radius--1);
      }
    }

    @media (prefers-color-scheme: dark) {
      .result-item {
        background: var(--mp-color-dark--70);
        color: var(--mp-color-light--100);
      }

      .result-item:hover,
      .result-item.focused {
        background: var(--mp-color-dark--60);
      }

      .result-category,
      .result-count {
        color: var(--mp-color-light--70);
      }

      .pagination-item {
        color: var(--mp-color-light--30);
      }

      .pagination-item[active] {
        color: var(--mp-color-light--90);
      }

      .persons-section {
        background-color: var(--mp-color-dark--60);
        color: var(--mp-color-light--100);
      }

      .recensie-preview header {
        background-color: var(--mp-color-main--100);
        color: var(--mp-color-dark--90);
      }

      .persons-grid ul li.label {
        color: var(--mp-color-light--60);
      }
    }

    @media only screen and (max-width: 660px) {
      .search-results {
        grid-template-columns: 1fr;
      }

      .persons-grid {
        grid-template-columns: 1fr;
      }

      .recensie-preview header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-meta {
        text-align: left;
        margin-top: var(--mp-size--2);
      }
    }
  `;

  // Public properties (can be set via attributes)
  @property({ type: String })
  index = 'reviews';

  @property({ type: String })
  placeholder = 'Zoeken...';

  @property({ type: Number, attribute: 'hits-per-page' })
  hitsPerPage = 6;

  @property({ type: Boolean, attribute: 'allow-filters', reflect: true })
  allowFilters = false;

  @property({ type: Boolean, attribute: 'allow-search-titles' })
  allowSearchTitles = false;

  @property({ type: Boolean, attribute: 'search-all-items' })
  searchAllItems = false;

  @property({ type: Boolean, attribute: 'search-for-facet-values' })
  searchForFacetValues = true;

  @property({ type: Array, attribute: 'facet-attributes' })
  facetAttributes: string[] = ['persons', 'groups', 'theater', 'year', 'city'];

  // Private state
  @state()
  private _searchInput = '';

  @state()
  private _items: SearchItem[] = [];

  @state()
  private _selectedFacets: FacetItem[] = [];

  @state()
  private _selectedOption: SearchItem | null = null;

  @state()
  private _searchResults: SearchHit[] = [];

  @state()
  private _pages: number[] = [];

  @state()
  private _page = 1;

  @state()
  private _showDropdown = false;

  @state()
  private _activeIndex = -1;

  // Algolia client and index
  private _algoliaClient: SearchClient | null = null;
  private _algoliaIndex: SearchIndex | null = null;

  // Query references
  @query('.combobox-input')
  private _inputEl!: HTMLInputElement;

  // Algolia configuration (hardcoded for the Astro migration)
  private readonly _config: AlgoliaConfig = {
    applicationId: 'QZ9LK09320',
    searchOnlyAPIKey: '5fe26edd91681f874040eb6110bf8a7f',
    index: 'reviews'
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this._initializeAlgolia();
    document.addEventListener('click', this._handleOutsideClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has('index')) {
      this._initializeAlgolia();
    }
  }

  private _initializeAlgolia(): void {
    this._algoliaClient = algoliasearch(
      this._config.applicationId,
      this._config.searchOnlyAPIKey
    );
    this._algoliaIndex = this._algoliaClient.initIndex(this.index);
    this._runInitialSearch();
  }

  private async _runInitialSearch(): Promise<void> {
    const results = await this._getTitles('', [], 0, this.searchAllItems ? 10000 : this.hitsPerPage);
    this._searchResults = results;
    this._dispatchSearchResults(results);
  }

  private _handleOutsideClick = (evt: MouseEvent): void => {
    const path = evt.composedPath();
    if (!path.includes(this)) {
      this._hideDropdown();
    }
  };

  private _hideDropdown(): void {
    this._showDropdown = false;
    this._activeIndex = -1;
  }

  private async _handleInputChange(evt: Event): Promise<void> {
    const input = evt.target as HTMLInputElement;
    this._searchInput = input.value;
    await this._runQuery(this._searchInput);
  }

  private _handleInputFocus(): void {
    this._showDropdown = true;
    this._runQuery(this._searchInput);
  }

  private _handleInputKeydown(evt: KeyboardEvent): void {
    switch (evt.key) {
      case 'ArrowDown':
        evt.preventDefault();
        this._activeIndex = Math.min(this._activeIndex + 1, this._items.length - 1);
        break;
      case 'ArrowUp':
        evt.preventDefault();
        this._activeIndex = Math.max(this._activeIndex - 1, 0);
        break;
      case 'Enter':
        evt.preventDefault();
        if (this._activeIndex >= 0 && this._items[this._activeIndex]) {
          this._selectItem(this._items[this._activeIndex]);
        }
        break;
      case 'Escape':
        this._hideDropdown();
        break;
    }
  }

  private async _runQuery(query: string): Promise<void> {
    if (!this._algoliaIndex) return;

    let facets: SearchItem[] = [];

    if (this.searchForFacetValues) {
      const facetFilters = this._getFacetFilters();
      const queryFilters = facetFilters.length > 0 ? { facetFilters } : {};

      const facetQueries = this.facetAttributes.map(attributeName =>
        this._algoliaIndex!.searchForFacetValues(attributeName, query, {
          ...queryFilters,
          maxFacetHits: this.searchAllItems ? 100 : 10,
          page: 0
        })
      );

      const facetResults = await Promise.all(facetQueries);
      const unfilteredFacets = facetResults.map((result, i) =>
        this._parseFacetResult(result, this.facetAttributes[i])
      );

      facets = this._filterSelectedFacetsFromFacets(unfilteredFacets);
    }

    const titles = this.allowSearchTitles
      ? await this._getTitles(query, this._getFacetFilters())
      : [];

    this._items = [...facets, ...titles.map(hit => ({
      ...hit,
      value: this._parseValueFromHit(hit, query)
    }))];

    this._showDropdown = true;
  }

  private _parseFacetResult(
    result: { facetHits?: Array<{ value: string; count: number }> },
    category: string
  ): SearchItem[] {
    if (!result?.facetHits) return [];
    return result.facetHits.map(hit => ({
      value: hit.value,
      count: hit.count,
      category
    }));
  }

  private _filterSelectedFacetsFromFacets(facetCategories: SearchItem[][]): SearchItem[] {
    const selectedValues = this._selectedFacets.map(f => f.value);
    if (selectedValues.length === 0) {
      return facetCategories.flat();
    }
    return facetCategories
      .map(category => category.filter(facet => !selectedValues.includes(facet.value)))
      .flat();
  }

  private async _getTitles(
    query: string,
    facetFilters: string[] = [],
    page = 0,
    hitsPerPage = 6
  ): Promise<SearchHit[]> {
    if (!this._algoliaIndex) return [];

    try {
      const response = await this._algoliaIndex.search<SearchHit>(query, {
        facetFilters: facetFilters.length > 0 ? facetFilters : undefined,
        page,
        hitsPerPage
      });

      return response.hits || [];
    } catch (error) {
      console.error('Algolia search error:', error);
      return [];
    }
  }

  private _parseValueFromHit(hit: SearchHit, query: string): string {
    const lowerQuery = query.toLowerCase();
    if (hit.title?.toLowerCase().includes(lowerQuery)) return hit.title;
    if (hit.name?.toLowerCase().includes(lowerQuery)) return hit.name;
    return hit.title || hit.name || '';
  }

  private _getFacetFilters(): string[] {
    return this._selectedFacets.map(filter => `${filter.category}:${filter.value}`);
  }

  private _selectItem(item: SearchItem): void {
    this._selectedOption = item;
    this._searchInput = item.value;
    if (this._inputEl) {
      this._inputEl.value = item.value;
    }
    this._hideDropdown();
    this._handleSelectedOptionChanged();
  }

  private async _handleSelectedOptionChanged(): Promise<void> {
    const option = this._selectedOption;
    const facetFilters = this._getFacetFilters();

    if (!option && facetFilters.length === 0) return;

    this._pages = [];

    if (!option && facetFilters.length > 0) {
      // Get total count for pagination
      const allTitles = await this._getTitles('', facetFilters, 0, 10000);
      const pagesAmount = Math.ceil(allTitles.length / this.hitsPerPage);
      if (pagesAmount > 1) {
        this._pages = Array.from({ length: pagesAmount }, (_, i) => i + 1);
      }

      const titles = await this._getTitles('', facetFilters, 0, this.hitsPerPage);
      this._searchResults = titles;
    } else if (option?.category) {
      const pagesAmount = Math.ceil((option.count || 0) / this.hitsPerPage);
      if (pagesAmount > 1) {
        this._pages = Array.from({ length: pagesAmount }, (_, i) => i + 1);
      }

      const filters = [...facetFilters, `${option.category}:${option.value}`];
      const titles = await this._getTitles('', filters, 0, this.hitsPerPage);
      this._searchResults = titles;
    } else if (option) {
      this._searchResults = [option as SearchHit];
    }

    this._page = 1;
    this._dispatchSearchResults(this._searchResults);
  }

  private async _handlePageChange(page: number): Promise<void> {
    if (this._page === page) return;

    this._page = page;
    const selectedOption = this._selectedOption?.category
      ? `${this._selectedOption.category}:${this._selectedOption.value}`
      : null;

    const filters = selectedOption
      ? [...this._getFacetFilters(), selectedOption]
      : this._getFacetFilters();

    const titles = await this._getTitles('', filters, page - 1, this.hitsPerPage);
    this._searchResults = titles;
    this._dispatchSearchResults(this._searchResults);
  }

  private _addFilter(): void {
    if (!this._selectedOption?.category) return;

    this._selectedFacets = [...this._selectedFacets, this._selectedOption as FacetItem];
    this._resetInput();
    this._handleSelectedFacetsChanged();
  }

  private _removeFilter(index: number): void {
    this._selectedFacets = this._selectedFacets.filter((_, i) => i !== index);
    this._handleSelectedFacetsChanged();
  }

  private _clearFilters(): void {
    this._selectedFacets = [];
    this._handleSelectedFacetsChanged();
  }

  private async _handleSelectedFacetsChanged(): Promise<void> {
    if (this._selectedFacets.length === 0) {
      await this._runInitialSearch();
      return;
    }

    const titles = await this._getTitles('', this._getFacetFilters(), 0, this.hitsPerPage);
    this._searchResults = titles;
    this._dispatchSearchResults(this._searchResults);
  }

  private _resetInput(): void {
    this._searchInput = '';
    this._selectedOption = null;
    if (this._inputEl) {
      this._inputEl.value = '';
    }
  }

  private _toggleSearchForFacetValues(): void {
    this.searchForFacetValues = !this.searchForFacetValues;
    this._runQuery(this._searchInput);
  }

  private _dispatchSearchResults(results: SearchHit[]): void {
    this.dispatchEvent(
      new CustomEvent('search-results-changed', {
        detail: { value: results },
        bubbles: true,
        composed: true
      })
    );
  }

  private _toDutch(str: string): string {
    const translations: Record<string, string> = {
      persons: 'Persoon',
      groups: 'Gezelschap',
      theater: 'Theater',
      year: 'Jaar',
      city: 'Stad'
    };
    return translations[str] || `${str[0].toUpperCase()}${str.substring(1)}`;
  }

  private _getResultUrl(hit: SearchHit): string {
    const slug = hit.slug || hit.objectID;
    const basePath = this.index === 'reviews' ? '/recensies' : '/interviews';
    return `${basePath}/${slug}`;
  }

  private _renderItem(item: SearchItem, index: number) {
    const isCategory = !!item.category;

    return html`
      <li
        class="result-item ${this._activeIndex === index ? 'focused' : ''}"
        role="option"
        @click=${() => this._selectItem(item)}
        @mouseenter=${() => { this._activeIndex = index; }}
      >
        ${isCategory
          ? html`
              <span class="result-category">${this._toDutch(item.category!)}:</span>
              <span>${item.value}</span>
              <span class="result-count">(${item.count})</span>
            `
          : html`<span>${item.value}</span>`
        }
      </li>
    `;
  }

  private _renderReviewCard(hit: SearchHit) {
    const hasActors = hit.actors && hit.actors.length > 0;
    const hasDirectors = hit.directors && hit.directors.length > 0;
    const hasWriters = hit.writers && hit.writers.length > 0;
    const hasPersons = hasActors || hasDirectors || hasWriters;

    return html`
      <a
        href=${this._getResultUrl(hit)}
        aria-label="Navigeer naar ${hit.title || hit.name}"
        class="review-card"
      >
        <article class="recensie-preview">
          <header>
            <div class="header-main">
              ${hit.title ? html`<h4>${hit.title}</h4>` : ''}
              ${hit.name ? html`<h5>${hit.name}</h5>` : ''}
              ${hit.groups && hit.groups.length > 0 ? html`
                <div class="groups">
                  ${hit.groups.map(group => html`<h6>${group}</h6>`)}
                </div>
              ` : ''}
            </div>
            <div class="header-meta">
              <ul>
                ${hit.reviewDate ? html`<li>${hit.reviewDate}</li>` : ''}
                ${hit.theater ? html`<li>${hit.theater}</li>` : ''}
                ${hit.city ? html`<li>${hit.city}</li>` : ''}
              </ul>
            </div>
          </header>
          ${hasPersons ? html`
            <section class="persons-section">
              <div class="persons-grid">
                ${hasActors ? html`
                  <ul>
                    <li class="label">${hit.actors!.length > 1 ? 'Spelers' : 'Speler'}</li>
                    ${hit.actors!.map(actor => html`<li>${actor}</li>`)}
                  </ul>
                ` : ''}
                ${hasDirectors ? html`
                  <ul>
                    <li class="label">${hit.directors!.length > 1 ? 'Regisseurs' : 'Regisseur'}</li>
                    ${hit.directors!.map(director => html`<li>${director}</li>`)}
                  </ul>
                ` : ''}
                ${hasWriters ? html`
                  <ul>
                    <li class="label">${hit.writers!.length > 1 ? 'Schrijvers' : 'Schrijver'}</li>
                    ${hit.writers!.map(writer => html`<li>${writer}</li>`)}
                  </ul>
                ` : ''}
              </div>
            </section>
          ` : ''}
        </article>
      </a>
    `;
  }

  override render() {
    const canAddFilter = this._selectedOption?.category &&
      this._selectedOption.category !== 'titel' &&
      !this._selectedFacets.some(f => f.value === this._selectedOption?.value);

    return html`
      <main>
        <!-- Filters section -->
        <section ?hidden=${!this.allowFilters}>
          <ul class="filters-container">
            ${this._selectedFacets.map((item, i) => html`
              <li>
                ${item.value}
                <button @click=${() => this._removeFilter(i)}>x</button>
              </li>
            `)}
            <li
              id="filters-erase-button"
              ?disabled=${this._selectedFacets.length === 0}
            >
              Wis
              <button
                ?disabled=${this._selectedFacets.length === 0}
                @click=${this._clearFilters}
              >x</button>
            </li>
          </ul>
        </section>

        <!-- Search section -->
        <section id="search-section">
          <div class="combobox-container">
            <input
              type="text"
              class="combobox-input"
              placeholder=${this.placeholder}
              .value=${this._searchInput}
              @input=${this._handleInputChange}
              @focus=${this._handleInputFocus}
              @keydown=${this._handleInputKeydown}
              aria-autocomplete="list"
              aria-controls="search-listbox"
              aria-expanded=${this._showDropdown}
              role="combobox"
            />
            <ul
              id="search-listbox"
              class="results-wrapper ${this._showDropdown && this._items.length > 0 ? '' : 'hidden'}"
              role="listbox"
            >
              ${this._items.map((item, index) => this._renderItem(item, index))}
            </ul>
          </div>

          <button
            class="filter-button"
            ?hidden=${!this.allowFilters}
            ?disabled=${!canAddFilter}
            @click=${this._addFilter}
          >
            Gebruik als filter
          </button>
        </section>

        <!-- Titles checkbox section -->
        <section id="title-check-logo-container">
          <div id="titles-checkbox-container" ?hidden=${!this.allowSearchTitles}>
            <input
              type="checkbox"
              id="search-titles-checkbox"
              @change=${this._toggleSearchForFacetValues}
              .checked=${!this.searchForFacetValues}
            />
            <label for="search-titles-checkbox">Zoek alleen titels</label>
          </div>
        </section>

        <!-- Pagination section -->
        <section>
          <ul id="pagination-list">
            ${this._pages.map(page => html`
              <li
                class="pagination-item"
                ?active=${page === this._page}
                @click=${() => this._handlePageChange(page)}
              >
                ${page}
              </li>
            `)}
          </ul>
        </section>

        <!-- Search results display -->
        <section class="search-results" id="search-results">
          ${this._searchResults.map(hit => this._renderReviewCard(hit))}
        </section>
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-search': MpSearch;
  }
}
