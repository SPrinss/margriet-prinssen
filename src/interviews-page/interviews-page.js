import { MPElement, html } from '../mp-element/mp-element';
import '../basic-preview/basic-preview';
import '../mp-page/mp-page';
import '../mp-search/mp-search';
import FireStoreParser from 'firestore-parser/index';
import { css } from './interviews-page.css.js';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { BooleanConverter } from 'html-element-property-mixins/src/utils/attribute-converters';
import { unsafeSVG } from 'lit-html/directives/unsafe-svg';
import { algoliaLogo } from '../logo/algolia.js';

class InterviewsPage extends MPElement {
  static get properties() {
    return {
      items: {
        observe: true,
        defaultValue: [],
      },
      interviewId: {
        observe: true,
        DOM: true,
        defaultValue: '',
        changedHandler: '_handleInterviewIdChanged',
      },
      interview: {
        observe: true,
        defaultValue: {},
      },
      authToken: {
        observe: true,
        defaultValue: null,
        changedHandler: '_handleAuthTokenChanged',
      },
      editing: {
        observe: true,
        reflect: true,
        defaultValue: false,
        DOM: true,
        attributeName: 'editing',
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },
    };
  }

  _handleInterviewIdChanged(oldVal, newVal) {
    if (newVal) this.getRecensieById(newVal);
  }

  _handleAuthTokenChanged(oldVal, newVal) {
    if (!newVal) return;
    import('../mp-textarea/mp-textarea.js');
    import('../mp-input/mp-input.js');
    import('../mp-button/mp-button.js');
    this.editing = true;
  }

  async patchDocument() {
    if (!this.authToken) return;
    const resp = await fetch(
      `https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents/interviews/${this.interviewId}?updateMask.fieldPaths=interview&updateMask.fieldPaths=interviewDate&updateMask.fieldPaths=title&currentDocument.exists=true&access_token=${this.authToken}&alt=json`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          fields: {
            interview: {
              stringValue: this.interview.interview,
            },
            title: {
              stringValue: this.interview.title,
            },
            interviewDate: {
              stringValue: this.interview.interviewDate,
            },
          },
        }),
      }
    ).catch(e => console.log(e));
  }

  async getRecensieById(id) {
    if (!id) return;
    const resp = await fetch(
      `https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents/interviews/${id}`
    );
    const data = await resp.json();

    this.interview = FireStoreParser(data).fields || {};
  }

  get styles() {
    return html`<style>
      ${css}
    </style>`;
  }

  get names() {
    if (!this.interview.persons) return '';
    return this.interview.persons.map(person => person.name).join(' - ');
  }

  _handleInput(evt, propName) {
    this.interview[propName] = evt.target.value;
    this.render();
  }

  get template() {
    return html`
      ${this.styles}

      <mp-page ?active="${!this.interviewId}">
        <h2 slot="header">Doorzoek interviews</h2>

        <section id="intro-section">
          <p>Zoeken is mogelijk op personen, gezelschappen en jaren .</p>
        </section>

        <section id="search-section">
          <mp-search
            placeholder="Jacob Derwig, Dood paard, 2020 ..."
            algolia-config='{"applicationId": "QZ9LK09320","searchOnlyAPIKey": "5fe26edd91681f874040eb6110bf8a7f","index": "interviews"}'
            facet-attributes='["persons", "year"]'
            search-all-items
            @search-results-changed=${e => (this.items = e.detail.value)}
          ></mp-search>
        </section>

        <section>
          <div class="interviews-grid">
            ${this.items.map(item => {
              return html`
                <a
                  href="/interviews/${item.objectID}"
                  aria-label="Navigeer naar ${item.title}"
                >
                  <basic-preview
                    data-type="interview"
                    .imageSrc=${item.images ? item.images[0] : ''}
                    .title=${item.title}
                    .featureList=${item.persons}
                    .timePublished=${item.interviewDate}
                  >
                  </basic-preview>
                </a>
              `;
            })}
          </div>
          <a href="https://algolia.com" target="_blank"
            ><svg id="algolia-logo" viewBox="0 0 168 24" fill="currentColor">
              ${unsafeSVG(`${algoliaLogo}`)}
            </svg></a
          >
        </section>
      </mp-page>

      <mp-page id="interview-page" ?active="${this.interviewId}">
        <h2 slot="header">${this.interview.title}</h2>
        <h5 slot="header">${this.interview.interviewDate} ${this.names}</h5>

        <main>
          <div id="aside-left-content-wrapper">
            <a arrow-back href="/interviews">Terug naar interviews</a>
          </div>

          <div id="main-content-wrapper">
            ${unsafeHTML(this.interview.interview)}
          </div>
          <div></div>
        </main>

        <section class="edit-section" ?hidden=${!this.authToken}>
          <mp-textarea
            placeholder="Interview"
            .value=${this.interview.interview}
            @input=${e => this._handleInput(e, 'interview')}
          ></mp-textarea>
          <mp-input
            placeholder="Titel"
            .value=${this.interview.title}
            @input=${e => this._handleInput(e, 'title')}
          ></mp-input>
          <mp-input
            placeholder="Interview datum"
            .value=${this.interview.interviewDate}
            @input=${e => this._handleInput(e, 'interviewDate')}
          ></mp-input>
          <mp-button @click=${this.patchDocument}>Sla op</mp-button>
        </section>
      </mp-page>
    `;
  }
}

window.customElements.define('interviews-page', InterviewsPage);
