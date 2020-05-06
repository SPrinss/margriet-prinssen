import { HTMLTextAreaElement, html } from './textarea.js';
import { enableFocusVisible } from '../utils/focus-visible-polyfill.js';
import { css } from './mp-textarea.css.js';

/**
 * MP Textarea element
 * @element mp-textarea
 * 
 */
export class MPTextarea extends HTMLTextAreaElement {

  constructor() {
    super();
    enableFocusVisible(this);
  }

  get styles() {
    return html`<style>${css}</style>`;
  }


}

window.customElements.define('mp-textarea', MPTextarea);