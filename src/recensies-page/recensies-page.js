import { MPElement, html } from '../mp-element/mp-element';
import '../recensie-preview/recensie-preview';
import '../mp-recensie/mp-recensie';
import '../mp-page/mp-page';
import '../mp-search/mp-search';
import FireStoreParser from 'firestore-parser/index';
import { css } from './recensies-page.css.js';

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
      recensie: {
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
    this.recensie = FireStoreParser(data).fields || {};
  }

  get styles() {
    return html`<style>${css}</style>`;
  }

  get template() {
    return html`
    ${this.styles}

    <mp-page ?active="${!this.recensieId}">
      <h2 slot="header">Doorzoek recensies</h2>

      <section>
        <p>Doorzoek recensies vanaf 1996. Zoeken is mogelijk op theater groepen, personen, theaters, jaartallen, steden en titels. Als je binnen een categorie (e.g. Toneelschuur) wilt zoeken kan je op "Gebruik als filter" klikken.</p>
      </section>

      <section id="search-section">
        <mp-search 
          placeholder="Toneelschuur, Sander Plukaard, 1997, Macbeth ... "
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
                .name=${item.name}
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

    <mp-recensie ?active="${this.recensieId}" .recensie=${this.recensie}>

    </mp-recensie>

    

    `;
  }

}

window.customElements.define('recensies-page', RecensiesPage);