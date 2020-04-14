import { HTMLInputElement, html } from '@html-element-wrappers/input';
import { enableFocusVisible } from '../utils/focus-visible-polyfill.js';

/**
 * MP Input element
 * @element mp-input
 * 
 */
export class MPInput extends HTMLInputElement {

  constructor() {
    super();
    enableFocusVisible(this);
  }

  get styles() {
    return html`
      <link rel="stylesheet" href="/src/mp-input/mp-input.css">
    `;
  }

}

window.customElements.define('mp-input', MPInput);