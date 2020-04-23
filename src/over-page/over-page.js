import { MPElement, html } from '../mp-element/mp-element';
import { css } from './over-page.css.js';

class OverPage extends MPElement {

  get styles() {
    return html`<style>${css}</style>`;
  }

  get template() {
    return html`
      ${this.styles}

    over
    `;
  }


}

window.customElements.define('over-page', OverPage);