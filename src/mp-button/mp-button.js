import { HTMLButtonElement, html } from '@html-element-wrappers/button.js';
import { enableFocusVisible } from '../utils/focus-visible-polyfill.js';
import { css } from './mp-button.css.js';

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
    return html`<style>${css}</style>`;
  }

}

window.customElements.define('mp-button', MPButton);