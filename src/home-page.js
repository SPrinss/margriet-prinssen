import { MPElement, html } from './mp-base';

class HomePage extends MPElement {

  get template() {
    return html`
    home
    `;
  }

}

window.customElements.define('home-page', HomePage);