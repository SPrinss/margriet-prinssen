import { MPElement, html } from '../mp-element/mp-element';
import { css } from './mp-add-content.css.js';
import '../mp-page/mp-page';
import '../mp-auth/mp-auth';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';

class MPAddContent extends MPElement {
  static get properties() {
    return {
      recensie: {
        observe: true,
        defaultValue: {},
      },
      authToken: {
        observe: true,
        defaultValue: null,
        changedHandler: '_handleAuthTokenChanged',
      }
    };
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

  _handleInput(evt, propName) {
    this[propName] = evt.target.value;
    this.render();
  }

  get template() {
    return html`
      ${this.styles}
      
      

      <section class="edit-section" ?hidden=${!this.authToken}>
        <mp-textarea
          placeholder="Recensie"
          @input=${e => this._handleInput(e, 'review')}
        ></mp-textarea>
        <mp-input
          placeholder="Titel"
          @input=${e => this._handleInput(e, 'title')}
        ></mp-input>
        <mp-input
          placeholder="Recensie datum"
          @input=${e => this._handleInput(e, 'reviewDate')}
        ></mp-input>
        <mp-input
          placeholder="Naam"
          @input=${e => this._handleInput(e, 'name')}
        ></mp-input>
        <mp-button @click=${this.patchDocument}>Sla op</mp-button>
      </section>

      <section class="edit-section" ?hidden=${!this.authToken}>
          <mp-textarea
            placeholder="Interview"
            @input=${e => this._handleInput(e, 'interview')}
          ></mp-textarea>
          <mp-input
            placeholder="Titel"
            @input=${e => this._handleInput(e, 'title')}
          ></mp-input>
          <mp-input
            placeholder="Interview datum"
            @input=${e => this._handleInput(e, 'interviewDate')}
          ></mp-input>
          <mp-button @click=${this.patchDocument}>Sla op</mp-button>
        </section>      
    `;
  }
}

window.customElements.define('mp-add-content', MPAddContent);
