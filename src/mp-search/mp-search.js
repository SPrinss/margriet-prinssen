import { MPElement, html } from '../mp-element/mp-element';
import '../mp-button/mp-button'
import '../mp-input/mp-input'
import '../mp-combobox/mp-combobox';
import '../mp-checkbox/mp-checkbox';
import { BooleanConverter, ObjectConverter } from 'html-element-property-mixins/src/utils/attribute-converters';
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
				defaultValue: [],
				changedHandler: "_handlePagesChanged"
			},
			page: {
				observe: true,
				defaultValue: 1,
				changedHandler: "_handleSelecedPageChanged"
			},
			allowFilters: {
				observe: true,
				DOM: true,
				attributeName: "allow-filters",
        fromAttributeConverter: BooleanConverter.fromAttribute,
				defaultValue: false
			},
			allowSearchTitles: {
				observe: true,
				DOM: true,
				attributeName: "allow-seach-titles",
        fromAttributeConverter: BooleanConverter.fromAttribute,
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

	_handlePagesChanged(oldVal, newVal) {
		this.page = 1;	
	}

	async _handleSelectedOptionChanged(oldVal, newVal) {
		if(!newVal && this.facetFilters.length === 0) return;
		this.pages = [];
		this._items = [];
		if(!newVal && this.facetFilters.length !== 0) {			
			// VERY UGLY REFACTOR LATER. Problem is getting a total result (to set the pages) when removing the selected option while having facets selected. Normally this is done via the attribute count of the selected option, but since we're deselecting an option, we don't have a count and have to request the count based on the selectedFacets + and empty String.
			// Could be done  
			const titlesForPageAmount = await this.getTitles('', [].concat(...this.facetFilters), 0, 10000);
			const pagesAmount = Math.ceil(titlesForPageAmount.length / this.hitsPerPage);
			if(pagesAmount > 1) this.pages = [ ...Array(pagesAmount).keys() ].map( i => i+1);

			const titles = await this.getTitles('', [].concat(...this.facetFilters), 0);
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

	_handleSearchResultsChanged(oldVal, newVal = []) {
		this.dispatchEvent(new CustomEvent('search-results-changed', {detail: {value: newVal}}))
	}

	_configChange(oldVal, config) {
		if(!config) return;
		this.algoliaIndex = algoliasearch(config.applicationId, config.searchOnlyAPIKey).initIndex(config.index);
		this._runInitialSearch()
	}

	async _runInitialSearch() {
		this.searchResults =  await this.getTitles("");
	}

	_searchInputChange(oldVal, newVal) {
		this.runQuery(newVal || '')
	}

	async _handleSelecedFacetsChanged(oldVal, newVal) {
		if(!newVal || newVal.length === 0) return;
		const titles = await this.getTitles('', this.facetFilters);
		this.searchResults = titles;
	}

	async _handleSelecedPageChanged(oldVal, newVal) {
		if(oldVal !== newVal && (newVal !== 1 || newVal === 1 && oldVal > 1)) {
			const selectedOption = (this._selectedOption && Object.keys(this._selectedOption).length > 0) ? `${this._selectedOption.category}:${this._selectedOption.value}` : [];
			const titles = await this.getTitles("", [].concat(...this.facetFilters, selectedOption), newVal - 1);
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
			const unfilteredFacets = facetResults.map((facetResult, i) => this.parseFacetResult(facetResult, this.facetAttributes[i]));
			facets = this._filterSelectedFacetFromFacets(unfilteredFacets, this._selectedFacets);
			
		}

		const titles = this.allowSearchTitles ? await this.getTitles(query, this.facetFilters) : [];
		this._items = [].concat(...facets, titles);
	}

	_filterSelectedFacetFromFacets(facetsCategories, selectedFacets) {
		const selectedFactetValues = selectedFacets.map(facet => facet.value);
		if(!selectedFacets || selectedFacets.length === 0) return facetsCategories;
		const filteredFacets = facetsCategories.map(facetCategory => {
			return facetCategory.filter(facet => {
				return selectedFactetValues.includes(facet.value) === false
			})
		});
		return filteredFacets;
	}
	
	parseFacetResult(result, category) {
		if(!result || !result.facetHits) return [];
		return result.facetHits.map(hit => {
			return {
				value: hit.value, 
				count: hit.count, 
				category: category, 
				formatter: (item) => `<span class="result-category">${this.toDutch(item.category)}:</span> <span>${item.value}</span> <span class="result-count">(${item.count})</span>` 
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

	async getTitles(query, facetFilters = ['*'], page = 0, hitsPerPage = 6) {
		if(!this.algoliaIndex) return;
		const res = await this.algoliaIndex.search(query, {"facetFilters": facetFilters, page: page, hitsPerPage: hitsPerPage} );
		if(!res || !res.hits) return [];
		
		return res.hits.map(hit => {return {...hit, value: this._parseValueFromHit(hit, query), formatter: (item) => `<span>${item.value}</span>`}});
	}

	_parseValueFromHit(hit, query) {
		if(hit.title && hit.title.toLowerCase().includes(query.toLowerCase())) return hit.title;
		if(hit.name && hit.name.toLowerCase().includes(query.toLowerCase())) return hit.name;
		return hit.title || hit.name || '';

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
