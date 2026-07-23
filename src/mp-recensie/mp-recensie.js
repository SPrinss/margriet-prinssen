import { MPElement, html } from '../mp-element/mp-element';
import { css } from './mp-recensie.css.js';
import '../mp-page/mp-page';
import '../mp-auth/mp-auth';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { BooleanConverter } from 'html-element-property-mixins/src/utils/attribute-converters/index.js';

class MPRecensie extends MPElement {
  static get properties() {
    return {
      recensie: {
        observe: true,
        defaultValue: {},
      },
      edit: {
        observe: true,
        defaultValue: false,
      },
      recensieId: {
        attributeName: 'recensie-id',
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

  _getListBlock(values, category) {
    if (!values || values.length === 0) return '';
    return html`
      <ul class="list">
        ${category ? html`<li>${category}</li>` : ''}
        ${values.map(value => html`<li>${value.name}</li>`)}
      </ul>
    `;
  }

  get styles() {
    return html`<style>
      ${css}
    </style>`;
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
      `https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents/reviews/${this.recensieId}?updateMask.fieldPaths=review&updateMask.fieldPaths=reviewDate&updateMask.fieldPaths=name&updateMask.fieldPaths=title&currentDocument.exists=true&access_token=${this.authToken}&alt=json`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          fields: {
            review: {
              stringValue: this.recensie.review,
            },
            title: {
              stringValue: this.recensie.title,
            },
            name: {
              stringValue: this.recensie.name,
            },
            reviewDate: {
              stringValue: this.recensie.reviewDate,
            },
          },
        }),
      }
    ).catch(e => console.log(e));
  }

  get parsedReview() {
    if (!this.recensie || !this.recensie.review) return '';
    const parsedArr = this.recensie.review
      .replace(/↵/g, '\n')
      .split('\n')
      .map(paragraph =>
        !!paragraph.replace(/ /g, '') ? `<p>${paragraph}</p>` : ''
      );
    return unsafeHTML(parsedArr.join(''));
  }

  _handleInput(evt, propName) {
    this.recensie[propName] = evt.target.value;
    this.render();
  }

  get template() {
    return html`
      ${this.styles}

      <mp-page>
        <h2 slot="header">
          ${this.recensie && this.recensie.title
            ? this.recensie.title
            : this.recensie.name}
        </h2>
        <h5 slot="header">
          ${this.recensie && this.recensie.reviewDate
            ? this.recensie.reviewDate
            : ''}
          - ${this.recensie.theater ? this.recensie.theater.name : ''} -
          ${this.recensie.city ? this.recensie.city.name : ''}
        </h5>

        <main>
          <div id="aside-left-content-wrapper">
            <a arrow-back href="/recensies">Terug naar recensies</a>
          </div>

          <div id="main-content-wrapper">
            <article>
              ${this.parsedReview}
            </article>
          </div>
          <div id="aside-right-content-wrapper">
            <h3>
              ${this.recensie && this.recensie.name ? this.recensie.name : ''}
            </h3>
            ${this.recensie.groups
              ? this.recensie.groups.map(value => html`<h5>${value.name}</h5>`)
              : ''}
            ${this._getListBlock(this.recensie.writers, 'Tekst')}
            ${this._getListBlock(this.recensie.directors, 'Regie')}
            ${this._getListBlock(this.recensie.actors, 'Spel')}
          </div>
        </main>
        <footer>
          <div id="footer-content-wrapper">
            <slot name="footer"></slot>
          </div>
        </footer>
      </mp-page>

      <section class="edit-section" ?hidden=${!this.authToken}>
        <mp-textarea
          placeholder="Recensie"
          .value=${this.recensie.review}
          @input=${e => this._handleInput(e, 'review')}
        ></mp-textarea>
        <mp-input
          placeholder="Titel"
          .value=${this.recensie.title}
          @input=${e => this._handleInput(e, 'title')}
        ></mp-input>
        <mp-input
          placeholder="Recensie datum"
          .value=${this.recensie.reviewDate}
          @input=${e => this._handleInput(e, 'reviewDate')}
        ></mp-input>
        <mp-input
          placeholder="Naam"
          .value=${this.recensie.name}
          @input=${e => this._handleInput(e, 'name')}
        ></mp-input>
        <mp-button @click=${this.patchDocument}>Sla op</mp-button>
      </section>
    `;
  }
}

window.customElements.define('mp-recensie', MPRecensie);
