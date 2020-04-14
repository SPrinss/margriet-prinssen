import { MPElement, html } from '../mp-element/mp-element';
import '../recensie-preview/recensie-preview';
import '../mp-page/mp-page';
import algoliasearch from 'https://cdn.jsdelivr.net/npm/algoliasearch@4/dist/algoliasearch-lite.esm.browser.js';

class RecensiesPage extends MPElement {

  static get properties() {
    return { 
      items: {
        observe: true,
        defaultValue: [1, 2, 3]
      },
      searchInput: {
        observe: true,
        defaultValue: "",
        changedHandler: "_handleSearchInputChanged"
      }
    }
  }

  _handleSearchInputChanged(oldVal, newVal) {
    console.log(oldVal, newVal)
    if(!newVal) return;
    this.runQuery(newVal)
  }


  constructor() {
    super();
    this.algoliaIndex = algoliasearch('QZ9LK09320', '5fe26edd91681f874040eb6110bf8a7f').initIndex('margriet_prinssen');
    this.items = []
  }

  async runQuery(query, options = {}) {
    const res = await this.algoliaIndex.search(query, options);
    console.log(res)
  }

  get template() {
    return html`
    <link rel="stylesheet" href="/src/recensies-page/recensies-page.css">

    <mp-page>
      <header slot="header"></header>
      <h1 slot="header-content">recensies</h1>

      <section>
        <input type="text" @input="${(e) => {
          console.log(e)
          this.searchInput = e.target.value}}">
      </section>
      <section>
        <div class="recensie-grid">
          ${this.items.map(item => {
            return html`
              ${Object.values(item)}
              <a href="#">
              <recensie-preview
                title="Freudjes, geen familie"
                groups='["mugmetdegoudentand"]'
                time-performed="08-31-2007"
                theater="Ruïne van Brederode"
                city="Velsen"
                title="Freudjes, geen familie"
                actors='["Ab Gietelink", "Bert Apeldoorn", "Munda de la Marre", "Arthur Geesing"]'
                directors='["Ab Gietelink"]'
                writers='["J. W. Goethe", "Ab Gietelink"]'
              >
              </recensie-preview>
              </a>
            `
          })}
        </div>
      </section>
    </mp-page>

    

    `;
  }

}

window.customElements.define('recensies-page', RecensiesPage);