import { MPElement, html } from '../mp-element/mp-element'
import { css } from './mp-page.css.js';

class MPPage extends MPElement {
  get styles() {
    return html`<style>${css}</style>`;
  }

  get template() {
    return html`
      ${this.styles}
      <header>
        <slot name="header"></slot>
        <div class="header-content-container">
          <slot name="header-content"></slot>
        </div>
        <div id="hor-line-top"></div>
        <div id="hor-line-bottom"></div>
      </header>

      <main>
        <slot></slot>
      </main>

    `
  }
}

window.customElements.define('mp-page', MPPage);