import { MPElement, html } from '../mp-element/mp-element';
import { StringConverter, NumberConverter, BooleanConverter, ObjectConverter } from 'html-element-property-mixins/src/utils/attribute-converters';
import { css } from './interview-preview.css.js';

class InterviewPreview extends MPElement {

  static get properties() {
    return {
      title: {
        observe: true,
        DOM: true,
        fromAttributeConverter: StringConverter.fromAttribute
      },
      persons: {
        observe: true,
        DOM: true,
        defaultValue: [],
        fromAttributeConverter: ObjectConverter.fromAttribute
      },
      timeInterviewed: {
        observe: true,
        DOM: true,
        attributeName: 'time-interviewed',
        fromAttributeConverter: StringConverter.fromAttribute
      },
      outlet: {
        observe: true,
        DOM: true,
        fromAttributeConverter: StringConverter.fromAttribute
      },
      imageSrc: {
        observe: true,
        DOM: true,
        attributeName: 'image-src',
        fromAttributeConverter: StringConverter.fromAttribute
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
      <figure><img src="${this.imageSrc}" alt="Foto van geïnterviewde"></figure>
    </header>
    <main>
      <h4>${this.title}</h4>
      
      <ul>
        ${this.persons.map(person => {
          return html`
            <li>${person}</li>
          `
        })
        }
      </ul>

      <span>${this.timeInterviewed}</span>
      <span>${this.outlet}</span>

    </main>
    `
  }

}

window.customElements.define('interview-preview', InterviewPreview);