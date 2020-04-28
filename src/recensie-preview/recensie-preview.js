import { MPElement, html } from '../mp-element/mp-element';
import { StringConverter, NumberConverter, BooleanConverter, ObjectConverter } from 'html-element-property-mixins/src/utils/attribute-converters';
import { css } from './recensie-preview.css.js';

class RecensiePreview extends MPElement {

  static get properties() {
    return {
      name: {
        observe: true,
        DOM: true,
        fromAttributeConverter: StringConverter.fromAttribute
      },
      title: {
        observe: true,
        DOM: true,
        fromAttributeConverter: StringConverter.fromAttribute
      },
      groups: {
        observe: true,
        DOM: true,
        fromAttributeConverter: ObjectConverter.fromAttribute
      },
      reviewDate: {
        observe: true,
        DOM: true,
        attributeName: 'review-date',
        fromAttributeConverter: StringConverter.fromAttribute
      },
      theater: {
        observe: true,
        DOM: true,
        fromAttributeConverter: StringConverter.fromAttribute
      },
      city: {
        observe: true,
        DOM: true,
        fromAttributeConverter: StringConverter.fromAttribute
      },
      actors: {
        observe: true,
        defaultValue: [],
        DOM: true,
        fromAttributeConverter: ObjectConverter.fromAttribute
      },
      directors: {
        observe: true,
        defaultValue: [],
        DOM: true,
        fromAttributeConverter: ObjectConverter.fromAttribute
      },
      writers: {
        observe: true,
        defaultValue: [],
        DOM: true,
        fromAttributeConverter: ObjectConverter.fromAttribute
      }
    }
  }

  get styles() {
    return html`<style>${css}</style>`;
  }

  get template() {
    return html`
    ${this.styles}

    <header>
      <div class="header-main">
        <h4>${this.name || this.title}</h4>
        ${this.groups && this.groups.length > 0 ? this.groups.map(group => {
          return html`
            <h5>${group}</h5>
          `
        }) : ''
        }
      </div>
      <div>
        <ul>
          <li>${this.reviewDate}</li>
          <li>${this.theater}</li>
          <li>${this.city}</li>
        </ul>
      </div>
    </header>
    <main>
      <div class="persons-grid">
        <ul>
          <li>Spelers</li>
          ${this.actors && this.actors.length > 0 ? this.actors.map(actor => {
            return html`
              <li>${actor}</li>
            `
          }) : ''
          }
        </ul>

        <ul>
          <li>Regisseurs</li>
          ${this.directors && this.directors.length > 0 ? this.directors.map(director => {
              return html`
                <li>${director}</li>
              `
            }) : ''
          } 
        </ul>
        <ul>
        
        <li>Schrijvers</li>
          ${this.writers && this.writers.length > 0 ? this.writers.map(writer => {
              return html`
                <li>${writer}</li>
              `
            }) : ''
          }
        </ul>
        
      </div>
    </main>
    `
  }

}

window.customElements.define('recensie-preview', RecensiePreview);