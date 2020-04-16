import { MPElement, html } from '../mp-element/mp-element';
import '../mp-select/mp-select'
import '../mp-button/mp-button'
import '../mp-input/mp-input'
import '../mp-combobox/mp-combobox';
import { StringConverter, NumberConverter, BooleanConverter, ObjectConverter } from 'html-element-property-mixins/src/utils/attribute-converters';
import algoliasearch from 'https://cdn.jsdelivr.net/npm/algoliasearch@4/dist/algoliasearch-lite.esm.browser.js';

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
				defaultValue: {}
			}


		}
	}

	_handleSearchResultsChanged(oldVal, newVal) {
		this.dispatchEvent(new CustomEvent('search-results-changed', {detail: {value: newVal}}))
	}

	_configChange(oldVal, config) {
		if(!config) return;
		this.algoliaIndex = algoliasearch(config.applicationId, config.searchOnlyAPIKey).initIndex(config.index);
	}

	_searchInputChange(oldVal, newVal) {
		if(newVal) this.runQuery(newVal)
	}

	async _handleSelecedFacetsChanged(oldVal, newVal) {
		if(!newVal || newVal.length === 0) return;
		const titles = await this.getTitles('');
		this.searchResults = titles;
	}

	async runQuery(query, options = {}) {
		if(!query) return;

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

		const titles = await this.getTitles(query);
		this.searchResults = [].concat(...titles);
		this._items = [].concat(...facets, titles);
	}
	
	parseFacetResult(result, category) {
		if(!result || !result.facetHits) return [];
		return result.facetHits.map(hit => {
			return {
				value: hit.value, 
				count: hit.count, 
				category: category, 
				formatter: (item) => `<span class="result-category">${item.category}:</span> <span>${item.value}<span> <span class="result-count">(${item.count})</span>` 
			}
		});
	}

	async getTitles(query, page = 0) {
		const res = await this.algoliaIndex.search(query, {"facetFilters": this.facetFilters, page: page} );
		if(!res || !res.hits) return [];
		return res.hits.map(hit => {return {...hit, value: hit.title, formatter: (item) => `<span>${item.value}</span>`}});
	}

	get facetFilters() {
		return this._selectedFacets.map((filter, i) => {
			return `${filter.category}:${filter.value}`;
		});
	}



	get template() {
		return html
		`
		<link rel="stylesheet" href="/src/mp-search/mp-search.css">

		<ul>

    	${this._selectedFacets.map((item, i) => {
					return html`
						<li>${item.value}</li><button @click=${(e) => this._selectedFacets = this._selectedFacets.filter((item, index) => i != index )}>X</button>
					`
				}
				 )} 

				<li ?hidden=${this._selectedFacets.length === 0}>Wis</li><button ?hidden=${this._selectedFacets.length === 0} @click=${(e) => this._selectedFacets = []}>X</button>
		</ul>

		<mp-combobox 
			.items=${this._items} 
			@input=${e => this.searchInput = e.target.input.value} 
			@value-changed=${(e) => this._selectedOption = e.detail.value}
		></mp-combobox>
		<mp-button 
			?disabled=${!this._selectedOption || !this._selectedOption.category || this._selectedOption.category === 'titel' || this._selectedFacets.includes(this._selectedOption.value)} 
			@click=${() => {
				this._selectedFacets = [].concat(...this._selectedFacets, this._selectedOption);
				this.shadowRoot.querySelector('mp-combobox').reset();
			}
		}
		>Gebruik als filter</mp-button>

		<mp-input type="checkbox" @input=${e => this.searchForFacetValues = !searchForFacetValues}></mp-input>
		`
	}
}

window.customElements.define('mp-search', MPSearch)
