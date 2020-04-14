import { HTMLButtonElement, html } from '@html-element-wrappers/button';
import { enableFocusVisible } from '../utils/focus-visible-polyfill.js';

/**
 * MP button element
 * @element mp-button
 * 
 */
export class MPButton extends HTMLButtonElement {

  constructor() {
    super();
    enableFocusVisible(this);
  }

  get styles() {
    return html`
      <link rel="stylesheet" href="/src/mp-button/mp-button.css">
    `;
  }

}

window.customElements.define('mp-button', MPButton);