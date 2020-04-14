import { MPElement, html } from '../mp-element/mp-element';

class OverPage extends MPElement {

  get template() {
    return html`
    over
    `;
  }


}

window.customElements.define('over-page', OverPage);