import { MPElement, html } from '../mp-element/mp-element';
import '../mp-select/mp-select'
import '../mp-button/mp-button'
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
			items: {
				observe: true,
				defaultValue: ["try", "it"],
        fromAttributeConverter: ObjectConverter.fromAttribute
			},
			filterItems: {
				observe: true,
				defaultValue: []
			},
			selectedOption: {
				observe: true,
				defaultValue: ''
			}
		}
	}

	_configChange(oldVal, config) {
		if(!config) return;
		this.algoliaIndex = algoliasearch(config.applicationId, config.searchOnlyAPIKey).initIndex(config.index);
		console.log(this.algoliaIndex)
		// this.algoliaIndex.setSettings({
		// 	'attributesForFaceting': ['director', 'theater']
		// })
	}

	_searchInputChange(oldVal, newVal) {
		if(newVal && newVal.length > 3) this.runQuery(newVal)
	}

	async runQuery(query, options = {}) {
		if(!query) return;

		const personsQuery = this.getFaceValues('persons', query);
		const theatersQuery = this.getFaceValues('theaters', query);
		const groupsQuery = this.getFaceValues('groups', query);
		const titlesQuery = this.getTitles(query);
		
		const queryResults = await Promise.all([personsQuery,
			theatersQuery,
			groupsQuery,
			titlesQuery]);
			
		this.items = [].concat(...queryResults);

	}
	
	async getFaceValues(facetName, query) {
		const res = await this.algoliaIndex.searchForFacetValues(facetName, query);
		console.log(res)
		if(!res || !res.facetHits) return [];
		const items = res.facetHits.map(hit => {return {value: hit.value, count: hit.count, category: facetName, }});
    items.forEach(item => item.formatter = (item) => `<span class="result-category">${item.category}:</span> <span>${item.value}<span> <span class="result-count">(${item.count})</span>`)
		return items;
	}

	async getTitles(query) {
		const res = await this.algoliaIndex.search(query);
		if(!res || !res.hits) return [];
		const items = res.hits.map(hit => {return {...hit, value: hit.title}});
		return items;
	}

	get template() {
		return html
		`
		<link rel="stylesheet" href="/src/mp-search/mp-search.css">

		<ul>
    	${this.filterItems.map((item, i) => {
					return html`
						<li>${item} <button @click=${(e) => this.filterItems = this.filterItems.filter((item, index) => i != index )}>x</button></li>
					`
				}
				 )} 
  	</ul>

		<mp-combobox .items=${this.items} @input=${e => this.searchInput = e.target.input.value} @value-changed=${(e) => this.selectedOption = e.detail.value}></mp-combobox>
		<mp-button ?disabled=${!this.selectedOption || this.filterItems.includes(this.selectedOption)} @click=${() => {
			this.filterItems = [].concat(...this.filterItems, this.selectedOption);
			this.shadowRoot.querySelector('mp-combobox').reset();
		}}
		>Gebruik als filter</mp-button>
		`
	}
}

window.customElements.define('mp-search', MPSearch)
