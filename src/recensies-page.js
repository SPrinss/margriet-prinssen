import { MPElement, html } from './mp-base';

class RecensiesPage extends MPElement {

  get template() {
    return html`
    recensies
    `;
  }


}

window.customElements.define('recensies-page', RecensiesPage);