import { MPElement, html } from '../mp-element/mp-element';
import { StringConverter, NumberConverter, BooleanConverter, ObjectConverter } from 'html-element-property-mixins/src/utils/attribute-converters';
import { css } from './basic-preview.css.js';

class BasicPreview extends MPElement {

  static get properties() {
    return {
      title: {
        observe: true,
        DOM: true,
        fromAttributeConverter: StringConverter.fromAttribute
      },
      featureList: {
        observe: true,
        DOM: true,
        defaultValue: [],
        fromAttributeConverter: ObjectConverter.fromAttribute
      },
      timePublished: {
        observe: true,
        DOM: true,
        attributeName: 'time-published',
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

    <header ?hidden=${!this.imageSrc}>
      <figure><img src="${this.imageSrc}" alt="Foto van stuk/geïnterviewde"></figure>
    </header>
    <main>
      <h4>${this.title}</h4>
      
      <ul>
        ${this.featureList.map(item => {
          return html`
            <li>${item}</li>
          `
        })
        }
      </ul>

      <span>${this.timePublished}</span>
      <span>${this.outlet}</span>

    </main>
    `
  }

}

window.customElements.define('basic-preview', BasicPreview);