import { MPElement, html } from './mp-base';
import { installRouter } from 'pwa-helpers/router.js';

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

  _handlePageChange(oldPage, newPage) {
    if(!newPage) return;
    const visiblePage = `${newPage}-page`;
    const pages = [...this.shadowRoot.querySelectorAll('.page')];
    pages.filter((pageEl) => pageEl.nodeName.toLowerCase() !== visiblePage).forEach((el) => el.removeAttribute('visible'));
    import(`./${visiblePage}.js`).then(() => {
      this.shadowRoot.querySelector(`${visiblePage}`).setAttribute('visible', '');
    });
  }

  get template() {
    return html`
      <style>
        nav {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          max-width: 1080px;
          margin: auto;
          background-color: transparant;
        }

        .page { 
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        .page:not([visible]) {
          opacity: 0;
          pointer-events: none;
          transition: visibility 0s 0.5s, opacity 0.5s linear;
          visibility: hidden;
        }

        main {
          position: relative;
        }

        .page[visible] {
          opacity: 1;
          pointer-events: auto;
          transition: opacity 0.5s linear;
          visibility: visible;
        }
      </style>

      <nav>
        logo 
        <div>
          <a href="./recensies">Recensies</a>
          <a href="./interviews">Interviews</a>
          <a href="./over">Over</a>
        </div>
      </nav>

      <header>
        <h1>Margriet Prinssen</h1>
        <h3>iets en nog iets</h3>
      </header>

      <main>
        <home-page visible class="page"></home-page>
        <recensies-page class="page"></recensies-page>
        <interviews-page class="page"></interviews-page>
        <over-page class="page"></over-page>
      </main>
      
      <footer></footer>
    `
  }
  

}

window.customElements.define('mp-app', MPApp);