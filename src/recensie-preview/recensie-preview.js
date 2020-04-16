import { MPElement, html } from '../mp-element/mp-element';
import { StringConverter, NumberConverter, BooleanConverter, ObjectConverter } from 'html-element-property-mixins/src/utils/attribute-converters';

class RecensiePreview extends MPElement {

  static get properties() {
    return {
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
      timePerformed: {
        observe: true,
        DOM: true,
        attributeName: 'time-performed',
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

  get template() {
    return html`
      <link rel="stylesheet" href="/src/recensie-preview/recensie-preview.css">

    <header>
      <div class="header-main">
        <h4>${this.title}</h4>
        ${this.groups && this.groups.length > 0 ? this.groups.map(group => {
          return html`
            <h5>${group}</h5>
          `
        }) : ''
        }
      </div>
      <div>
        <ul>
          <li>${this.timePerformed}</li>
          <li>${this.theater}</li>
          <li>${this.city}</li>
        </ul>
      </div>
    </header>
    <main>
      <div class="persons-grid">
        <ul>
          <li>Actors</li>
          ${this.actors && this.actors.length > 0 ? this.actors.map(actor => {
            return html`
              <li>${actor}</li>
            `
          }) : ''
          }
        </ul>

        <ul>
          <li>Directors</li>
          ${this.directors && this.directors.length > 0 ? this.directors.map(director => {
              return html`
                <li>${director}</li>
              `
            }) : ''
          } 
        </ul>
        <ul>
        
        <li>Writers</li>
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