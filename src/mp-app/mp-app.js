import { MPElement, html } from '../mp-element/mp-element';
import { installRouter } from 'pwa-helpers/router.js';
import { logo } from '../logo/logo-small.js';
import {unsafeSVG} from 'lit-html/directives/unsafe-svg'
import { css } from './mp-app.css.js';


class MPApp extends MPElement {

  static get properties() {
    return {
      page: {
        DOM: true,
        observe: true,
        changedHandler: '_handlePageChange'
      }
    }
  }

  connectedCallback() {
    installRouter((location) => {
      if (event && event.type === 'click') {
        window.scrollTo(0, 0);
      }
      this.handleNavigation(location)
    });

  }

  handleNavigation(location) {
    let page = location.pathname.replace(/^\//, '');
    if(page === '' || page === '/') page = 'home';
    this.page = page;
  }

  async _handlePageChange(oldPage, newPage) {
    if(!newPage) return;
    if(newPage.includes('home')) {
      import(`../home-page/home-page.js`);
    } else if (newPage.includes('recensies')) {
      const res = await import(`../recensies-page/recensies-page.js`);
      this.shadowRoot.querySelector('recensies-page').recensieId = this.page.substring(this.page.indexOf('recensies/') + 10, this.page.length);
    } else if (newPage.includes('interviews')) {
      // import(`../interviews-page/interviews-page.js`);
    } else if (newPage.includes('over')) {
      import(`../over-page/over-page.js`);
    }
  }

  get styles() {
    return html`<style>${css}</style>`;
  }

  get template() {
    return html`
      ${this.styles}

      <main>
      <nav>
        <a href="/"><svg viewBox="0 0 176.1 34" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="currentColor">${unsafeSVG(`${logo}`)}</svg></a>
        <ul>
          <li><a ?data-active="${this.page.toLowerCase() === 'recensies'}" href="/recensies">Recensies</a></li>
          <li><a ?data-active="${this.page.toLowerCase() === 'interviews'}" href="/interviews">Interviews</a></li>
          <li><a ?data-active="${this.page.toLowerCase() === 'over'}" href="/over">Over</a></li>
        </ul>
      </nav>

      <div id="hor-line-top"></div>
      <div id="hor-line-bottom"></div>

      <home-page ?visible="${this.page === 'home'}" class="page"></home-page>
      <recensies-page ?visible="${this.page.includes('recensies')}" .recensieId=${this.page.includes('recensies/') ? this.page.substring(this.page.indexOf('recensies/') + 10, this.page.length) : ''} class="page"></recensies-page>
      <interviews-page ?visible="${this.page === 'interviews'}" class="page"></interviews-page>
      <over-page ?visible="${this.page === 'over'}" class="page"></over-page>
      
      <footer>
        <p>Met liefde gemaakt door Sam Prinssen, Tijl Prinssen & Lex van der Slot</p>
      </footer>
      </main>
    `
  }
  

}

window.customElements.define('mp-app', MPApp);