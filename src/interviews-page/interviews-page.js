import { MPElement, html } from '../mp-element/mp-element';
import '../basic-preview/basic-preview';
import '../mp-page/mp-page';
import '../mp-search/mp-search';
import FireStoreParser from 'firestore-parser/index';
import { css } from './interviews-page.css.js';
import {unsafeHTML} from 'lit-html/directives/unsafe-html'

class InterviewsPage extends MPElement {

  static get properties() {
    return { 
      items: {
        observe: true,
        defaultValue: []
      },
      interviewId: {
        observe: true,
        DOM: true,
        defaultValue: '',
        changedHandler: '_handleInterviewIdChanged'
      },
      recensie: {
        observe: true,
        defaultValue: {}
      }
    }
  }

  _handleInterviewIdChanged(oldVal, newVal) {
    if(newVal) this.getRecensieById(newVal);
  }

  async getRecensieById(id) {
    if(!id) return;
    const resp = await fetch(`https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents/interviews/${id}`);
    const data = await resp.json();
    console.log(data)
    this.recensie = FireStoreParser(data).fields || {};
  }

  get styles() {
    return html`<style>${css}</style>`;
  }

  get names() {
    if(!this.recensie.persons) return ''
    return this.recensie.persons.map(person => person.name).join(' - ');
  }

  get template() {
    return html`
    ${this.styles}

    <mp-page ?active="${!this.interviewId}">
      <h2 slot="header">Doorzoek Interviews</h2>

      <section class="intro-section">
        <p>Doorzoek interviews vanaf 2012. Zoeken is mogelijk op theater groepen, personen en jaren.</p>
      </section>

      <section id="search-section">
        <mp-search 
          placeholder="Jacob Derwig, Dood paard, 2020 ..."
          algolia-config='{"applicationId": "QZ9LK09320","searchOnlyAPIKey": "5fe26edd91681f874040eb6110bf8a7f","index": "interviews"}'
          facet-attributes='["persons", "year"]'
          allow-filters
          @search-results-changed=${(e) => this.items = e.detail.value}
        ></mp-search>
      </section>

      <section>
        <div class="recensie-grid">
          ${this.items.map(item => {
            return html`
              <a href="/interviews/${item.objectID}" aria-label="Navigeer naar ${item.title}">
              <basic-preview
                  data-type="interview"
                  .imageSrc=${item.images ? item.images[0] : ''}
                  .title=${item.title}
                  .featureList=${item.persons}
                  .timePublished=${item.interviewDate}
                >
                </basic-preview>
              </a>
            `
          })}
        </div>
      </section>

    </mp-page>

    <mp-page id="interview-page" ?active="${this.interviewId}">
      <h2 slot="header">${this.recensie.title}</h2>
      <h5 slot="header">${this.recensie.interviewDate} ${this.names}</h5>
      
      <main>
        <div id="aside-left-content-wrapper">
          <a arrow-back href="/interviews">Terug naar interviews</a>
        </div>

        <div id="main-content-wrapper">
          ${unsafeHTML(this.recensie.interview)}
        </div>
        <div></div>
      </main>
    </mp-page>

    

    `;
  }

}

window.customElements.define('interviews-page', InterviewsPage);