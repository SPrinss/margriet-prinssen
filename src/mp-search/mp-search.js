import { MPElement, html } from '../mp-element/mp-element';
import '../mp-button/mp-button'
import '../mp-input/mp-input'
import '../mp-combobox/mp-combobox';
import '../mp-checkbox/mp-checkbox';
import { StringConverter, NumberConverter, BooleanConverter, ObjectConverter } from 'html-element-property-mixins/src/utils/attribute-converters';
import { css } from './mp-search.css.js';
import algoliasearch from 'https://cdn.jsdelivr.net/npm/algoliasearch@4/dist/algoliasearch-lite.esm.browser.js';

// https://cdn.jsdelivr.net/npm/algoliasearch@4/dist/algoliasearch-lite.esm.browser.js
class MPSearch extends MPElement {

	static get properties() {
		return { 
			algoliaConfig: {
				observe: true,
				DOM: true,
				attributeName: "algolia-config",
        fromAttributeConverter: ObjectConverter.fromAttribute,
				changedHandler: "_configChange"
			},
			searchInput: {
				observe: true,
				defaultValue: "",
				changedHandler: "_searchInputChange"
			},
			searchForFacetValues: {
				observe: true,
				DOM: true,
				attributeName: 'search-for-facet-values',
				defaultValue: true
			},
			facetAttributes: {
				observe: true,
				DOM: true,
				attributeName: 'facet-attributes',
				fromAttributeConverter: ObjectConverter.fromAttribute,
				defaultValue: []				
			},
			searchResults: {
				observe: true,
				defaultValue: [],
				changedHandler: '_handleSearchResultsChanged'
			},
			placeholder: {
				observe: true,
				DOM: true
			},
			hitsPerPage: {
				observe: true,
				defaultValue: 6
			},
			pages: {
				observe: true,
				defaultValue: []
			},
			page: {
				observe: true,
				defaultValue: 1,
				changedHandler: "_handleSelecedPageChanged"
			},
			allowFilters: {
				observe: true,
				attributeName: "allow-filters",
				defaultValue: false
			},
			allowSearchTitles: {
				observe: true,
				attributeName: "allow-seach-titles",
				defaultValue: false
			},
			_items: {
				observe: true,
				defaultValue: []
			},
			_selectedFacets: {
				observe: true,
				defaultValue: [],
				changedHandler: "_handleSelecedFacetsChanged"
			},
			_selectedOption: {
				observe: true,
				defaultValue: {},
				changedHandler: "_handleSelectedOptionChanged"
			}
		}
	}

	async _handleSelectedOptionChanged(oldVal, newVal) {
		if(!newVal && this.facetFilters.length === 0) return;
		this.pages = [];
		this._items = [];
		if(!newVal && this.facetFilters.length !== 0) {			
			const titles = await this.getTitles('', [].concat(...this.facetFilters));
			this.searchResults = titles;
		} else if(!!newVal.category) {
			const pagesAmount = Math.ceil(newVal.count / this.hitsPerPage);
			if(pagesAmount > 1) this.pages = [ ...Array(pagesAmount).keys() ].map( i => i+1);
			const titles = await this.getTitles('', [].concat(...this.facetFilters, `${newVal.category}:${newVal.value}`));
			this.searchResults = titles;
		} else {
			this.searchResults = [newVal];
		}
	}

	_handleSearchResultsChanged(oldVal, newVal) {
		this.dispatchEvent(new CustomEvent('search-results-changed', {detail: {value: newVal}}))
	}

	_configChange(oldVal, config) {
		if(!config) return;
		this.algoliaIndex = algoliasearch(config.applicationId, config.searchOnlyAPIKey).initIndex(config.index);
	}

	connectedCallback() {
		this._runInitialSearch()
	}

	async _runInitialSearch() {
		this.searchResults =  await this.getTitles("");
	}

	_searchInputChange(oldVal, newVal) {
		if(newVal) this.runQuery(newVal)
	}

	async _handleSelecedFacetsChanged(oldVal, newVal) {
		if(!newVal || newVal.length === 0) return;
		const titles = await this.getTitles('', this.facetFilters);
		this.searchResults = titles;
	}

	async _handleSelecedPageChanged(oldVal, newVal) {
		if(oldVal !== newVal && (newVal !== 1 || newVal === 1 && oldVal > 1)) {
			const titles = await this.getTitles("", [].concat(...this.facetFilters, `${this._selectedOption.category}:${this._selectedOption.value}`), newVal - 1);
			this.searchResults = titles;
		}
	}

	async runQuery(query, options = {}) {
		let facets = [];
		if(this.searchForFacetValues) {
			const queryFilters = (!this.facetFilters || this.facetFilters.length === 0) ? {} : {
				facetFilters: this.facetFilters
			};

			const facetQueries = this.facetAttributes.map(
				attributeName => {
					return this.algoliaIndex.searchForFacetValues(attributeName, query, queryFilters)
				}
			)
			const facetResults = await Promise.all(facetQueries);

			facets = facetResults.map((facetResult, i) => this.parseFacetResult(facetResult, this.facetAttributes[i]));
		}

		const titles = this.allowSearchTitles ? await this.getTitles(query, this.facetFilters) : [];
		this._items = [].concat(...facets, titles);
	}
	
	parseFacetResult(result, category) {
		if(!result || !result.facetHits) return [];
		return result.facetHits.map(hit => {
			return {
				value: hit.value, 
				count: hit.count, 
				category: category, 
				formatter: (item) => `<span class="result-category">${this.toDutch(item.category)}:</span> <span>${item.value}<span> <span class="result-count">(${item.count})</span>` 
			}
		});
	}

	// Yes, pretty ugly. 
	toDutch(str) {
		switch (str) {
			case 'persons':
				return 'Persoon'
			case 'groups':
				return 'Gezelschap';
			case 'theater':
				return 'Theater';
			case 'year':
				return 'Jaar'
			case 'city':
				return 'Stad'
			default:
				return `${str[0].toUpperCase()}${str.substring(1, str.length)}`
		}

	}

	async getTitles(query, facetFilters = ['*'], page = 0) {
		if(!this.algoliaIndex) return;
		const res = await this.algoliaIndex.search(query, {"facetFilters": facetFilters, page: page} );
		if(!res || !res.hits) return [];
		return res.hits.map(hit => {return {...hit, value: hit.title || hit.name, formatter: (item) => `<span>${item.value}</span>`}});
	}

	get facetFilters() {
		return this._selectedFacets.map((filter, i) => {
			return `${filter.category}:${filter.value}`;
		});
	}

  get styles() {
    return html`<style>${css}</style>`;
  }

	get template() {
		return html`
      ${this.styles}

		<main>
			<section ?hidden=${!this.allowFilters}>
				<ul class="filters-container">

					${this._selectedFacets.map((item, i) => {
							return html`
								<li>${item.value} <button @click=${(e) => this._selectedFacets = this._selectedFacets.filter((item, index) => i != index )}>x</button></li>
							`
						}
						)} 

						<li id="filters-erase-button" ?disabled=${this._selectedFacets.length === 0}>Wis<button ?disabled=${this._selectedFacets.length === 0} @click=${(e) => this._selectedFacets = []}>x</button></li>
				</ul>
			</section>

			<section id="search-section">
				<mp-combobox
					placeholder="${this.placeholder}"
					.items=${this._items} 
					@input=${e => this.searchInput = e.target.input.value} 
					@value-changed=${(e) => this._selectedOption = e.detail.value}
				></mp-combobox>
				<mp-button 
					?hidden=${!this.allowFilters}
					?disabled=${!this._selectedOption || !this._selectedOption.category || this._selectedOption.category === 'titel' || this._selectedFacets.includes(this._selectedOption.value)} 
					@click=${() => {
						this._selectedFacets = [].concat(...this._selectedFacets, this._selectedOption);
						this.shadowRoot.querySelector('mp-combobox').reset();
					}
				}
				>Gebruik als filter</mp-button>
			</section>
			
			<section ?hidden=${!this.allowSearchTitles}>
				<div id="titles-checkbox-container">
					<mp-checkbox @input=${e => {
							this.searchForFacetValues = !this.searchForFacetValues;
							this.runQuery(this.searchInput)
						}}
					></mp-checkbox><span>Zoek alleen titels</span>
				</div>
			</section>

			<section >
				<ul id="pagination-list">
					${this.pages.map((item, i) => {
							return html`
								<li class="pagination-item" ?active=${item === this.page} @click=${() => this.page = item}>${item}</li>
							`
						}
					)} 
				</ul>
			</section>
		</main>
		`
	}
}

window.customElements.define('mp-search', MPSearch)
