import { MPElement, html } from '../mp-element/mp-element'

class MPPage extends MPElement {

  get template() {
    return html`
      <link rel="stylesheet" href="/src/mp-page/mp-page.css">
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