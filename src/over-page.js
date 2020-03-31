import { MPElement, html } from './mp-base';

class OverPage extends MPElement {

  get template() {
    return html`
    over
    `;
  }


}

window.customElements.define('over-page', OverPage);