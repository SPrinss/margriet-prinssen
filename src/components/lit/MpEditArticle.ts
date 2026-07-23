/**
 * Inline edit section for article detail pages — the Astro successor of the
 * legacy mp-recensie edit block: invisible to visitors, but when the admin is
 * logged in (session persists from /add, /import or /curate) an edit form
 * appears below the article. Saving updates the Firestore document directly;
 * Algolia and the site rebuild follow automatically via the triggers.
 *
 * Edits the same fields as the legacy version: body, title, name (reviews)
 * and date.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth } from '../../lib/firebase-client';
import { getDb } from '../../lib/firebase';

type ArticleType = 'review' | 'interview';

@customElement('mp-edit-article')
export class MpEditArticle extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--mp-text-b-font-family, sans-serif);
    }

    section {
      max-width: 720px;
      margin: var(--mp-size--8, 40px) auto;
      background: var(--mp-color-light--100, #fff);
      border-radius: var(--mp-border-radius--1, 5px);
      box-shadow: var(--mp-box-shadow--1);
      padding: var(--mp-size--5, 20px);
      display: flex;
      flex-direction: column;
      gap: var(--mp-size--3, 12px);
    }

    h4 {
      margin: 0;
    }

    label {
      font-size: var(--mp-text-c2-font-size, 14px);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--mp-color-dark--60, #666);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    input,
    textarea {
      font: inherit;
      font-size: var(--mp-text-b3-font-size, 16px);
      padding: var(--mp-size--2, 8px);
      border: 1px solid var(--mp-color-dark--20, #ccc);
      border-radius: var(--mp-border-radius--1, 5px);
      width: 100%;
      box-sizing: border-box;
    }

    textarea {
      min-height: 320px;
      resize: vertical;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--mp-size--3, 12px);
    }

    button {
      font: inherit;
      padding: var(--mp-size--2, 8px) var(--mp-size--4, 16px);
      background-color: var(--mp-color-main--100, #b2cdff);
      border: 2px solid transparent;
      border-radius: var(--mp-border-radius--1, 5px);
      font-weight: 600;
      cursor: pointer;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .status {
      font-size: var(--mp-text-c1-font-size, 16px);
    }

    .error {
      color: #a33;
    }
  `;

  @property({ type: String, attribute: 'article-id' }) articleId = '';
  @property({ type: String }) type: ArticleType = 'review';

  @state() private user: User | null = null;
  @state() private loaded = false;
  @state() private body = '';
  @state() private title2 = '';
  @state() private name = '';
  @state() private date = '';
  @state() private saving = false;
  @state() private statusMessage = '';
  @state() private errorMessage = '';

  private get collectionName(): string {
    return this.type === 'review' ? 'reviews' : 'interviews';
  }

  private get bodyField(): string {
    return this.type === 'review' ? 'review' : 'interview';
  }

  private get dateField(): string {
    return this.type === 'review' ? 'reviewDate' : 'interviewDate';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    onAuthStateChanged(getFirebaseAuth(), user => {
      this.user = user;
      if (user && !this.loaded) this.loadArticle();
    });
  }

  private async loadArticle(): Promise<void> {
    try {
      const snapshot = await getDoc(doc(getDb(), this.collectionName, this.articleId));
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      this.body = String(data[this.bodyField] || '');
      this.title2 = String(data.title || '');
      this.name = String(data.name || '');
      this.date = String(data[this.dateField] || '');
      this.loaded = true;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Laden mislukt';
    }
  }

  private async save(): Promise<void> {
    this.saving = true;
    this.statusMessage = '';
    this.errorMessage = '';
    try {
      const update: Record<string, string> = {
        [this.bodyField]: this.body,
        title: this.title2,
        [this.dateField]: this.date,
      };
      if (this.type === 'review') update.name = this.name;
      await updateDoc(doc(getDb(), this.collectionName, this.articleId), update);
      this.statusMessage = 'Opgeslagen — de site wordt binnen ±15 minuten bijgewerkt';
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Opslaan mislukt';
    }
    this.saving = false;
  }

  override render() {
    // Invisible unless the admin is logged in (same as the old site)
    if (!this.user || !this.loaded) return nothing;

    return html`
      <section>
        <h4>Bewerken</h4>
        <label>
          ${this.type === 'review' ? 'Recensie' : 'Interview'}
          <textarea .value=${this.body} @input=${(e: Event) => (this.body = (e.target as HTMLTextAreaElement).value)}></textarea>
        </label>
        <label>
          Titel
          <input type="text" .value=${this.title2} @input=${(e: Event) => (this.title2 = (e.target as HTMLInputElement).value)} />
        </label>
        ${this.type === 'review'
          ? html`
              <label>
                Naam voorstelling
                <input type="text" .value=${this.name} @input=${(e: Event) => (this.name = (e.target as HTMLInputElement).value)} />
              </label>
            `
          : nothing}
        <label>
          Datum
          <input type="text" .value=${this.date} @input=${(e: Event) => (this.date = (e.target as HTMLInputElement).value)} />
        </label>
        <div class="actions">
          <button ?disabled=${this.saving} @click=${this.save}>${this.saving ? 'Bezig…' : 'Sla op'}</button>
          <span class="status">
            ${this.statusMessage}
            ${this.errorMessage ? html`<span class="error">${this.errorMessage}</span>` : nothing}
          </span>
        </div>
      </section>
    `;
  }
}

export default MpEditArticle;

declare global {
  interface HTMLElementTagNameMap {
    'mp-edit-article': MpEditArticle;
  }
}
