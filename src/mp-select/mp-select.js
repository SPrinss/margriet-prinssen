import { HTMLSelectElement, html } from '/web_modules/@html-element-wrappers/select.js';
import { enableFocusVisible } from '../utils/focus-visible-polyfill.js';

/**
 * MP select element
 * @element mp-select
 * 
 */
export class MPSelect extends HTMLSelectElement {

  constructor() {
    super();
    enableFocusVisible(this);
  }

  get styles() {
    return html`
      <link rel="stylesheet" href="/src/mp-select/mp-select.css">
    `;
  }

}

window.customElements.define('mp-select', MPSelect);