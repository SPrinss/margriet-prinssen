import { MPElement, html } from '../mp-element/mp-element';
import '../recensie-preview/recensie-preview';
import '../mp-recensie/mp-recensie';
import '../mp-page/mp-page';
import '../mp-search/mp-search';
import FireStoreParser from 'firestore-parser/index'
import algoliasearch from 'https://cdn.jsdelivr.net/npm/algoliasearch@4/dist/algoliasearch-lite.esm.browser.js';

class RecensiesPage extends MPElement {

  static get properties() {
    return { 
      items: {
        observe: true,
        defaultValue: []
      },
      recensieId: {
        observe: true,
        DOM: true,
        defaultValue: '',
        changedHandler: '_handleRecensieIdChanged'
      },
      weqqwe: {
        observe: true,
        defaultValue: {}
      }
    }
  }

  _handleRecensieIdChanged(oldVal, newVal) {
    if(newVal) this.getRecensieById(newVal);
  }

  async getRecensieById(id) {
    if(!id) return;
    const resp = await fetch(`https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents/reviews/${id}`);
    const data = await resp.json();
    this.weqqwe = FireStoreParser(data).fields;
  }

  get template() {
    return html`
    <link rel="stylesheet" href="/src/recensies-page/recensies-page.css">

    <mp-page ?active="${!this.recensieId}">
      <header slot="header"></header>
      <h1 slot="header-content">recensies</h1>

      <section>
        <mp-search 
          algolia-config='{"applicationId": "QZ9LK09320","searchOnlyAPIKey": "5fe26edd91681f874040eb6110bf8a7f","index": "reviews"}'
          facet-attributes='["actors", "groups", "theater", "writers", "directors", "year", "city"]'
          @search-results-changed=${(e) => this.items = e.detail.value}
        ></mp-search>
      </section>

      <section>
        <div class="recensie-grid">
          ${this.items.map(item => {
            return html`
              <a href="/recensies/${item.objectID}">
              <recensie-preview
                .title=${item.title}
                .groups=${item.groups}
                .reviewDate=${item.reviewDate}
                .theater=${item.theater}
                .city=${item.city}
                .actors=${item.actors}
                .directors=${item.directors}
                .writers=${item.writers}
              >
              </recensie-preview>
              </a>
            `
          })}
        </div>
      </section>

    </mp-page>

    <mp-recensie ?active="${this.recensieId}" .recensie=${this.weqqwe}>

    </mp-recensie>

    

    `;
  }

}

window.customElements.define('recensies-page', RecensiesPage);