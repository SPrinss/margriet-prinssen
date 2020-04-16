import { MPElement, html } from '../mp-element/mp-element';

class MPInterview extends MPElement {

  get template() {
    return html`
      <link rel="stylesheet" href="/src/mp-interview/mp-interview.css">

      <header><div id="header-content-wrapper"><slot name="header"></slot></div></header>
      <main>
        <div id="aside-left-content-wrapper"><slot name="aside-left"></slot></div>
        <div id="main-content-wrapper"><slot></slot></div>
        <div id="aside-right-content-wrapper"><slot name="aside-right"></slot></div>

      </main>
      <footer><div id="footer-content-wrapper"><slot name="footer"></slot></div></footer>

    `
  }

}

window.customElements.define('mp-interview', MPInterview);