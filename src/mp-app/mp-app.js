import { MPElement, html } from '../mp-element/mp-element';
import { installRouter } from 'pwa-helpers/router.js';
import { css } from './mp-app.css.js';

class MPApp extends MPElement {
  static get properties() {
    return {
      page: {
        DOM: true,
        observe: true,
        changedHandler: '_handlePageChange',
      },
      authToken: {
        observe: true,
        defaultValue: null,
      },
    };
  }

  connectedCallback() {
    installRouter(location => {
      if (event && event.type === 'click') {
        window.scrollTo(0, 0);
      }
      this.handleNavigation(location);
    });
  }

  handleNavigation(location) {
    let page = location.pathname.replace(/^\//, '');
    if (page === '' || page === '/') page = 'home';
    this.page = page;
  }

  _parseIdFromUrl(url, category) {
    const startIndex = url.indexOf(`${category}/`);
    const idPath = url.substring(startIndex + category.length + 1, url.length);
    const endIndex = idPath.indexOf(`/`);
    if (endIndex < 0) return idPath;
    return idPath.substring(0, endIndex);
  }

  async _handlePageChange(oldPage, newPage) {
    if (!newPage) return;
    if (
      !!this.shadowRoot &&
      !!this.shadowRoot.querySelector &&
      !!this.shadowRoot.querySelector('main')
    ) {
      this.shadowRoot.querySelector('main').scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }

    if (newPage.includes('home')) {
      import(`../home-page/home-page.js`);
    } else if (newPage.includes('recensies')) {
      await import(`../recensies-page/recensies-page.js`);
      window.requestAnimationFrame(() => {
        const recensiePage = this.shadowRoot.querySelector('recensies-page');
        recensiePage.recensieId = this._parseIdFromUrl(this.page, 'recensies');
        recensiePage.authToken = this.authToken;
      });
    } else if (newPage.includes('interviews')) {
      await import(`../interviews-page/interviews-page.js`);
      window.requestAnimationFrame(() => {
        const interviewsPage = this.shadowRoot.querySelector('interviews-page');
        interviewsPage.interviewId = this._parseIdFromUrl(
          this.page,
          'interviews'
        );
        interviewsPage.authToken = this.authToken;
      });
    } else if (newPage.includes('over')) {
      import(`../over-page/over-page.js`);
    }
    if (newPage.includes('auth')) {
      await import(`../mp-auth/mp-auth.js`);
    }
  }

  get styles() {
    return html`<style>
      ${css}
    </style>`;
  }

  get template() {
    return html`
      ${this.styles}

      <main>
        <nav>
          <ul>
            <li>
              <a ?data-active="${this.page.toLowerCase() === 'home'}" href="/"
                >Home</a
              >
            </li>
            <li>
              <a
                ?data-active="${this.page.toLowerCase() === 'recensies'}"
                href="/recensies"
                >Recensies</a
              >
            </li>
            <li>
              <a
                ?data-active="${this.page.toLowerCase() === 'interviews'}"
                href="/interviews"
                >Interviews</a
              >
            </li>
            <li>
              <a
                ?data-active="${this.page.toLowerCase() === 'over'}"
                href="/over"
                >Over</a
              >
            </li>
          </ul>
        </nav>

        <div id="hor-line-top"></div>
        <div id="hor-line-bottom"></div>

        <home-page ?visible="${this.page === 'home'}" class="page"></home-page>
        <recensies-page
          ?visible="${this.page.includes('recensies')}"
          .authToken=${this.authToken}
          .recensieId=${this.page.includes('recensies/')
            ? this.page.substring(
                this.page.indexOf('recensies/') + 10,
                this.page.length
              )
            : ''}
          class="page"
        ></recensies-page>
        <interviews-page
          ?visible="${this.page.includes('interviews')}"
          .authToken=${this.authToken}
          .interviewId=${this.page.includes('interviews/')
            ? this.page.substring(
                this.page.indexOf('interviews/') + 11,
                this.page.length
              )
            : ''}
          class="page"
        ></interviews-page>
        <over-page
          ?visible="${this.page.includes('over')}"
          ?show-interview=${this.page.includes('over/interview')}
          class="page"
        ></over-page>
        <mp-auth
          ?visible="${this.page.includes('auth')}"
          @id-token-changed=${e => (this.authToken = e.detail.value)}
          @logout=${e => (this.authToken = null)}
          class="page"
        ></mp-auth>
        <footer ?hidden=${!this.page.includes('over')}>
          <p>
            Met liefde gemaakt door Sam Prinssen, Tijl Prinssen & Lex van der
            Slot
          </p>
        </footer>
      </main>
    `;
  }
}

window.customElements.define('mp-app', MPApp);
