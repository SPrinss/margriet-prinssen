import { MPElement, html } from './mp-base';

class InterviewsPage extends MPElement {

  get template() {
    return html`
    intervies
    `;
  }


}

window.customElements.define('interviews-page', InterviewsPage);