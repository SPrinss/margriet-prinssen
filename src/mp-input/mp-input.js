import { HTMLInputElement, html } from '@html-element-wrappers/input';
import { enableFocusVisible } from '../utils/focus-visible-polyfill.js';
import { css } from './mp-input.css.js';

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
    return html`<style>${css}</style>`;
  }


}

window.customElements.define('mp-input', MPInput);