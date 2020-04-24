import { MPElement, html } from '../mp-element/mp-element'
import { css } from './mp-page.css.js';

class MPPage extends MPElement {
  get styles() {
    return html`<style>${css}</style>`;
  }

  get template() {
    return html`
      ${this.styles}
      <div id="top-hor-line-top"></div>
      <div id="top-hor-line-bottom"></div>
      <header>
        <slot name="header"></slot>
        <!-- <div class="header-content-container">
          <slot name="header-content"></slot>
        </div> -->

      </header>
      <div id="bottom-hor-line-top"></div>
      <div id="bottom-hor-line-bottom"></div>
      <main>
        <slot></slot>
      </main>

    `
  }
}

window.customElements.define('mp-page', MPPage);