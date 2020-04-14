import { MPElement, html } from '../mp-element/mp-element';

class InterviewsPage extends MPElement {

  get template() {
    return html`
    intervies
    `;
  }


}

window.customElements.define('interviews-page', InterviewsPage);