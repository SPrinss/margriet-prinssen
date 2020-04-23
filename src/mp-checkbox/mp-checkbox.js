import { HTMLInputElement, html } from '@html-element-wrappers/input';
import { enableFocusVisible } from '../utils/focus-visible-polyfill.js';

/**
 * Con Amore checkbox element
 * @element mp-checkbox
 * 
 * @cssprop --mp-checkbox-blend-color
 * 
 */
export class MPCheckboxElement extends HTMLInputElement {

  constructor() {
    super();
    enableFocusVisible(this);
  }
  
  get styles() {
    return html`
      <link rel="stylesheet" href="/src/mp-checkbox/mp-checkbox.css">
    `;
  }

  get template() {
    return html`
      ${this.styles}
      <input
      .accept="${this.accept}"
      .accessKey="${this.accessKey}"
      .alt="${this.alt}"
      ?autocomplete="${this.autocomplete}"
      ?autofocus="${this.autofocus}"
      .mppture="${this.mppture}"
      ?checked="${this.checked}"
      .dirname="${this.dirname}"
      ?disabled="${this.disabled}"
      .height="${this.height}"
      .inputmode="${this.inputmode}"
      .max="${this.max}"
      .maxlength="${this.maxlength}"
      .min="${this.min}"
      .minlength="${this.minlength}"
      .multiple="${this.multiple}"
      .pattern="${this.pattern}"
      .placeholder="${this.placeholder}"
      ?readonly="${this.readonly}"
      ?required="${this.required}"
      .size="${this.size}"
      .src="${this.src}"
      .step="${this.step}"
      .tabIndex="${this.tabIndex}"
      .width="${this.width}"
      .type="${'checkbox'}"
      .value="${this.value}"
      @input="${(e) => { this.value = e.target.value; this.checked = e.target.checked; }}"
      @change="${(e) => { this.value = e.target.value; this.checked = e.target.checked; }}"
      >
      <span>checked</span>
    `;
  }

}

window.customElements.define('mp-checkbox', MPCheckboxElement);