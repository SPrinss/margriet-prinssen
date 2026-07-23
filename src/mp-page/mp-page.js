import { MPElement, html } from '../mp-element/mp-element'
import { css } from './mp-page.css.js';
import {unsafeSVG} from 'lit-html/directives/unsafe-svg.js'
import { logo } from '../logo/logo-small.js';

class MPPage extends MPElement {
  get styles() {
    return html`<style>${css}</style>`;
  }

  get template() {
    return html`
      ${this.styles}
      <div id="divider-container">
        <div>
          <div id="top-hor-line-top"></div>
          <div id="top-hor-line-bottom"></div>
        </div>
        <svg viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="currentColor">${unsafeSVG(`${logo}`)}</svg>
        <div>
          <div id="bottom-hor-line-top"></div>
          <div id="bottom-hor-line-bottom"></div>
        </div>
      </div>
      <header>
        <slot name="header"></slot>
        <!-- <div class="header-content-container">
          <slot name="header-content"></slot>
        </div> -->

      </header>

      <main>
        <slot></slot>
      </main>

    `
  }
}

window.customElements.define('mp-page', MPPage);