import { MPElement, html } from '../mp-element/mp-element';
import '../recensie-preview/recensie-preview';
import '../mp-page/mp-page';
import '../mp-search/mp-search';
import algoliasearch from 'https://cdn.jsdelivr.net/npm/algoliasearch@4/dist/algoliasearch-lite.esm.browser.js';

class RecensiesPage extends MPElement {

  static get properties() {
    return { 
      items: {
        observe: true,
        defaultValue: []
      }
    }
  }

  get template() {
    return html`
    <link rel="stylesheet" href="/src/recensies-page/recensies-page.css">

    <mp-page>
      <header slot="header"></header>
      <h1 slot="header-content">recensies</h1>

      <section>
        <mp-search 
          algolia-config='{"applicationId": "QZ9LK09320","searchOnlyAPIKey": "5fe26edd91681f874040eb6110bf8a7f","index": "margriet_prinssen"}'
          facet-attributes='["persons", "groups", "theaters"]'
          @search-results-changed=${(e) => this.items = e.detail.value}
        ></mp-search>
      </section>

      <section>
        <div class="recensie-grid">
          ${this.items.map(item => {
            return html`
              <a href="#">
              <recensie-preview
                .title="${item.title}"
                .groups="${item.groups}"
                .reviewDate="${item.reviewDate}"
                .theater="${item.theaters}"
                .city="${item.city}"
                .actors="${item.persons}"
                .directors="${item.directors}"
                .writers="${item.writers}"
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