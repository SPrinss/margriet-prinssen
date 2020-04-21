import { MPElement, html } from '../mp-element/mp-element';

class MPRecensie extends MPElement {

  static get properties() {
    return { 
      recensie: {
        observe: true,
        defaultValue: {}
      }
    }
  }

  _getListBlock(values, category) {
    if(!values || values.length === 0) return '';
    return html`
      <ul class="list">
        ${category ? html`<li>${category}</li>` : ''}
        ${values.map(value => html`<li>${value.name}</li>`)}
      </ul>
    `
    
  }

  get template() {
    return html`
      <link rel="stylesheet" href="/src/mp-recensie/mp-recensie.css">

      <header>

        <div id="header-content-wrapper">
          <h1>${this.recensie.title}</h1>
          <h5>${this.recensie.reviewDate ? this.recensie.reviewDate : ''} - ${this.recensie.theater ? this.recensie.theater.name : ''} - ${this.recensie.city ? this.recensie.city.name : ''}</h5>
        </div>
      </header>

      <main>
        <div id="aside-left-content-wrapper">
          <a arrow-back href="/recensies">Terug naar recensies</a>
        </div>

        <div id="main-content-wrapper">
          <article>
            ${this.recensie.review ? this.recensie.review.replace(/↵/g, '\n') : ''}
          </article>
        </div>
        <div id="aside-right-content-wrapper">

          <h3>${this.recensie.name}</h3>
          ${this.recensie.groups ? this.recensie.groups.map(value => html`<h5>${value.name}</h5>`) : ''}
          ${this._getListBlock(this.recensie.writers, 'Tekst')}
          ${this._getListBlock(this.recensie.directors, 'Regie')}
          ${this._getListBlock(this.recensie.actors, 'Spel')}
        </div>

      </main>
      <footer><div id="footer-content-wrapper"><slot name="footer"></slot></div></footer>

    `
  }

}

window.customElements.define('mp-recensie', MPRecensie);