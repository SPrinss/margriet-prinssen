import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase-client';

/**
 * Authentication component for the Margriet Prinssen website.
 * Handles email/password sign-in, displays user state, and provides logout functionality.
 *
 * @element mp-auth
 *
 * @fires id-token-changed - Fired when the ID token changes (includes token in detail.value)
 * @fires logout - Fired when the user logs out
 */
@customElement('mp-auth')
export class MpAuth extends LitElement {
  static override styles = css`
    :host,
    :host *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    [hidden] {
      display: none !important;
    }

    .auth {
      display: flex;
      flex-direction: column;
      gap: var(--mp-size--4, 16px);
      max-width: 400px;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: var(--mp-size--3, 12px);
    }

    .input {
      width: 100%;
      height: var(--mp-size--9, 48px);
      padding: 0 var(--mp-size--4, 16px);
      font-family: var(--mp-text-b-font-family, 'Work Sans', sans-serif);
      font-size: var(--mp-text-b2-font-size, 18px);
      font-weight: var(--mp-text-b-font-weight, 400);
      line-height: var(--mp-text-b-line-height, 150%);
      background: var(--mp-color-light--80, rgba(255, 255, 255, 0.8));
      color: var(--mp-color-dark--50, #7f7f7f);
      border-radius: var(--mp-border-radius--1, 5px) var(--mp-border-radius--1, 5px) 0 0;
      border: 0;
      transition: 0.2s background-color ease, 0.2s color ease;
      outline: none;
    }

    .input:hover {
      background: var(--mp-color-light--90, rgba(255, 255, 255, 0.9));
    }

    .input:focus {
      background: var(--mp-color-light--100, #fff);
      color: var(--mp-color-dark--90, #191919);
    }

    .input::placeholder {
      color: var(--mp-color-dark--50, #7f7f7f);
    }

    .button {
      height: var(--mp-size--9, 48px);
      padding: 0 var(--mp-size--4, 16px);
      font-family: var(--mp-text-b-font-family, 'Work Sans', sans-serif);
      font-size: var(--mp-text-b2-font-size, 18px);
      font-weight: var(--mp-text-b-font-weight, 400);
      line-height: var(--mp-text-b-line-height, 150%);
      background-color: var(--mp-color-main, #b2cdff);
      color: var(--mp-color-dark--100, #000);
      border-radius: var(--mp-border-radius--1, 5px);
      border: 2px solid transparent;
      cursor: pointer;
      user-select: none;
      transition: 0.2s background-color ease;
    }

    .button:hover:not(:disabled) {
      background-color: var(--mp-color-main--90, #b9d2ff);
    }

    .button:active:not(:disabled) {
      background-color: var(--mp-color-main, #b2cdff);
    }

    .button:disabled {
      cursor: default;
      opacity: 0.4;
    }

    .button--secondary {
      background-color: transparent;
      color: var(--mp-color-main, #b2cdff);
      border-color: var(--mp-color-main, #b2cdff);
    }

    .button--secondary:hover:not(:disabled) {
      background-color: var(--mp-color-main--10, #f7faff);
    }

    .error-message {
      color: #c00;
      font-family: var(--mp-text-b-font-family, 'Work Sans', sans-serif);
      font-size: var(--mp-text-c2-font-size, 14px);
      margin: 0;
      padding: var(--mp-size--2, 8px);
      background: rgba(200, 0, 0, 0.1);
      border-radius: var(--mp-border-radius--1, 5px);
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: var(--mp-size--3, 12px);
    }

    .user-email {
      font-family: var(--mp-text-b-font-family, 'Work Sans', sans-serif);
      font-size: var(--mp-text-b3-font-size, 16px);
      color: var(--mp-color-dark--80, #333);
      margin: 0;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: var(--mp-size--9, 48px);
      font-family: var(--mp-text-b-font-family, 'Work Sans', sans-serif);
      font-size: var(--mp-text-b3-font-size, 16px);
      color: var(--mp-color-dark--50, #7f7f7f);
    }

    @media (max-width: 660px) {
      .input {
        font-size: var(--mp-text-b2-mobile-font-size, 16px);
      }

      .button {
        font-size: var(--mp-text-b2-mobile-font-size, 16px);
      }
    }
  `;

  @state()
  private _email = '';

  @state()
  private _password = '';

  @state()
  private _idToken: string | null = null;

  @state()
  private _user: User | null = null;

  @state()
  private _loading = true;

  @state()
  private _error: string | null = null;

  @state()
  private _isSigningIn = false;

  private _unsubscribeAuth: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this._initializeAuth();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._unsubscribeAuth) {
      this._unsubscribeAuth();
      this._unsubscribeAuth = null;
    }
  }

  private _initializeAuth(): void {
    // Check for stored token first
    const storedToken = window.localStorage.getItem('idToken');
    const expiryDate = window.localStorage.getItem('expiryDate');

    if (storedToken && expiryDate) {
      const expiry = parseInt(expiryDate, 10);
      if (new Date(expiry).getTime() > Date.now()) {
        this._idToken = storedToken;
      } else {
        this._handleTokenExpired();
      }
    }

    // Set up Firebase auth state listener
    const auth = getFirebaseAuth();
    this._unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      this._user = user;
      this._loading = false;

      if (user) {
        try {
          const token = await user.getIdToken();
          this._setIdToken(token);
        } catch (error) {
          console.error('Error getting ID token:', error);
        }
      } else {
        this._idToken = null;
      }
    });
  }

  private _handleTokenExpired(): void {
    window.localStorage.removeItem('idToken');
    window.localStorage.removeItem('expiryDate');
    this._idToken = null;
  }

  private _setIdToken(token: string): void {
    const oldToken = this._idToken;
    this._idToken = token;

    // Store token with 1 hour expiry (Firebase tokens expire in 1 hour)
    const expiryTime = new Date(Date.now() + 3600 * 1000);
    window.localStorage.setItem('idToken', token);
    window.localStorage.setItem('expiryDate', expiryTime.getTime().toString());

    if (token !== oldToken) {
      this.dispatchEvent(
        new CustomEvent('id-token-changed', {
          composed: true,
          bubbles: true,
          detail: { value: token },
        })
      );
    }
  }

  private async _handleSignIn(): Promise<void> {
    if (!this._email || !this._password || this._isSigningIn) {
      return;
    }

    this._isSigningIn = true;
    this._error = null;

    try {
      const auth = getFirebaseAuth();
      const userCredential = await signInWithEmailAndPassword(auth, this._email, this._password);

      if (userCredential.user) {
        const token = await userCredential.user.getIdToken();
        this._setIdToken(token);
        // Clear form on successful login
        this._email = '';
        this._password = '';
      }
    } catch (error: unknown) {
      console.error('Sign in error:', error);
      if (error instanceof Error) {
        // Map Firebase error codes to user-friendly messages
        const errorMessage = this._getErrorMessage(error);
        this._error = errorMessage;
      } else {
        this._error = 'Er is een onbekende fout opgetreden.';
      }
    } finally {
      this._isSigningIn = false;
    }
  }

  private _getErrorMessage(error: Error): string {
    const message = error.message || '';
    if (message.includes('auth/wrong-password') || message.includes('auth/invalid-credential')) {
      return 'Onjuist wachtwoord.';
    }
    if (message.includes('auth/user-not-found')) {
      return 'Gebruiker niet gevonden.';
    }
    if (message.includes('auth/invalid-email')) {
      return 'Ongeldig e-mailadres.';
    }
    if (message.includes('auth/too-many-requests')) {
      return 'Te veel pogingen. Probeer later opnieuw.';
    }
    return message || 'Er is een fout opgetreden bij het inloggen.';
  }

  private async _handleLogout(): Promise<void> {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }

    window.localStorage.removeItem('idToken');
    window.localStorage.removeItem('expiryDate');
    this._idToken = null;
    this._user = null;

    this.dispatchEvent(
      new CustomEvent('logout', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleEmailInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this._email = target.value;
    this._error = null;
  }

  private _handlePasswordInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this._password = target.value;
    this._error = null;
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && this._email && this._password) {
      this._handleSignIn();
    }
  }

  private _renderLoginForm() {
    return html`
      <section class="auth-form">
        <input
          type="email"
          class="input"
          placeholder="Email"
          .value=${this._email}
          @input=${this._handleEmailInput}
          @keydown=${this._handleKeyDown}
          autocomplete="email"
        />
        <input
          type="password"
          class="input"
          placeholder="Wachtwoord"
          .value=${this._password}
          @input=${this._handlePasswordInput}
          @keydown=${this._handleKeyDown}
          autocomplete="current-password"
        />
        ${this._error ? html`<p class="error-message">${this._error}</p>` : nothing}
        <button
          class="button"
          ?disabled=${!this._email || !this._password || this._isSigningIn}
          @click=${this._handleSignIn}
        >
          ${this._isSigningIn ? 'Bezig...' : 'Inloggen'}
        </button>
      </section>
    `;
  }

  private _renderUserInfo() {
    return html`
      <section class="user-info">
        ${this._user?.email ? html`<p class="user-email">Ingelogd als: ${this._user.email}</p>` : nothing}
        <button class="button button--secondary" @click=${this._handleLogout}>Uitloggen</button>
      </section>
    `;
  }

  override render() {
    if (this._loading) {
      return html`<div class="loading">Laden...</div>`;
    }

    return html`
      <main class="auth">
        ${this._idToken || this._user ? this._renderUserInfo() : this._renderLoginForm()}
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-auth': MpAuth;
  }
}
