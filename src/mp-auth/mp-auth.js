import { MPElement, html } from '../mp-element/mp-element';
import { css } from './mp-auth.css.js';
import { BooleanConverter } from 'html-element-property-mixins/src/utils/attribute-converters';
import '../mp-input/mp-input';
import '../mp-button/mp-button';
class MPAuth extends MPElement {

  static get properties() {
    return { 
      email: {
        observe: true,
        defaultValue: ''
      },
      password: {
        observe: true,
        defaultValue: ''
      },

      idToken: {
        observe: true,
        defaultValue: '',
        changedHandler: '_handleIdTokenChanged'
      }
    }
  }

  get styles() {
    return html`<style>${css}</style>`;
  }

  connectedCallback() {
    super.connectedCallback();
    const idToken = window.localStorage.getItem('idToken');
    const expiryDate = window.localStorage.getItem('expiryDate');
    if(!idToken || new Date(parseInt(expiryDate)).getTime() < new Date().getTime()) return this._handleTokenExpired();
    this.idToken = idToken;
  }

  _handleTokenExpired() {
    window.localStorage.clear();
  }
  
  _handleSignInAttempt() {
    this.getNewIdToken()
  }

  _handleLogOutAttempt() {
    window.localStorage.clear();
    this.idToken = null;
    this.dispatchEvent(new CustomEvent('logout', {bubbles: true, composed: true}))
  }

  async getNewIdToken() {
    window.localStorage.clear();

    const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyC8em8nKNhnyhDFrj4_pTrRpGy8nmNxh8k`, { 
      method: 'POST',
      body: JSON.stringify(
        {
          "email": this.email,
          "password": this.password,
          "returnSecureToken":true
        }
      )
    }).catch(e => console.log(e));


    const data = await resp.json();
    if(resp.status === 400) window.alert(data.error.message);
    if(!data.idToken) return;

    this.idToken = data.idToken;
    var t = new Date(Date.now() + (data.expiresIn *1000));
    window.localStorage.setItem('idToken', data.idToken);
    window.localStorage.setItem('expiryDate', t.getTime().toString());
  }

  _handleIdTokenChanged(oldVal, newVal) {
    if(newVal) this.dispatchEvent(new CustomEvent('id-token-changed', { composed:true, bubbles: true, detail: {value: newVal }}));
  }

  get template() {
    return html`
      ${this.styles}

      <main class="auth">
        <section ?hidden=${this.idToken}>
          <mp-input placeholder="Email" @input=${e => this.email = e.target.value}></mp-input>
          <mp-input placeholder="Wachtwoord" @input=${e => this.password = e.target.value}></mp-input>
          <mp-button ?disabled=${!this.email || !this.password} @click="${this._handleSignInAttempt}">Go</mp-button>
        </section>
        <section ?hidden=${!this.idToken}>
          <mp-button @click=${this._handleLogOutAttempt}>Log out</mp-button>
        </section>
      </main>
    `;
  }

}
window.customElements.define('mp-auth', MPAuth);
