/**
 * Homepage curation admin page.
 *
 * Pick which recensies and interviews are featured on the home page (stored
 * in settings/homepage), upload an image for items that lack one, and reset
 * to the default behavior ("laatst toegevoegd") with one button. Selected
 * items without an image get a clear warning.
 *
 * Saving triggers a site rebuild automatically (Cloud Function watches
 * settings/homepage).
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { User } from 'firebase/auth';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import algoliasearch from 'algoliasearch/lite';
import { getFirebaseAuth, getFirebaseStorage } from '../../lib/firebase-client';
import { getDb } from '../../lib/firebase';

// Same public search-only credentials as the site's search component
const searchClient = algoliasearch('QZ9LK09320', '5fe26edd91681f874040eb6110bf8a7f');
const useTestIndices = import.meta.env.PUBLIC_USE_EMULATORS === 'true';

type ContentKind = 'reviews' | 'interviews';

interface ContentRow {
  id: string;
  label: string;
  date: string;
  images: string[];
}

const RECOMMENDED_COUNT = 4;

@customElement('mp-curate-home')
export class MpCurateHome extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--mp-text-b-font-family, sans-serif);
    }

    .login-form,
    .toolbar,
    section {
      background: var(--mp-color-light--100, #fff);
      border-radius: var(--mp-border-radius--1, 5px);
      box-shadow: var(--mp-box-shadow--1);
      padding: var(--mp-size--5, 20px);
      margin-bottom: var(--mp-size--4, 16px);
    }

    .login-form {
      max-width: 420px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--mp-size--3, 12px);
    }

    input {
      font: inherit;
      font-size: var(--mp-text-b3-font-size, 16px);
      padding: var(--mp-size--2, 8px);
      border: 1px solid var(--mp-color-dark--20, #ccc);
      border-radius: var(--mp-border-radius--1, 5px);
      box-sizing: border-box;
    }

    .archive-search {
      width: 100%;
      margin-bottom: var(--mp-size--3, 12px);
    }

    button {
      font: inherit;
      padding: var(--mp-size--2, 8px) var(--mp-size--4, 16px);
      background-color: var(--mp-color-secondary--100, #f4d18f);
      border: 2px solid transparent;
      border-radius: var(--mp-border-radius--1, 5px);
      cursor: pointer;
    }

    button:hover:not(:disabled) {
      background-color: var(--mp-color-secondary--90, #f5d59a);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button.primary {
      background-color: var(--mp-color-main--100, #b2cdff);
      font-weight: 600;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--mp-size--4, 16px);
      flex-wrap: wrap;
      position: sticky;
      top: 0;
      z-index: 2;
    }

    .toolbar .status {
      margin-left: auto;
      font-size: var(--mp-text-c1-font-size, 16px);
    }

    .mode-banner {
      font-size: var(--mp-text-c1-font-size, 16px);
      padding: var(--mp-size--2, 8px) var(--mp-size--3, 12px);
      border-radius: var(--mp-border-radius--1, 5px);
      background: var(--mp-color-main--20, #eff5ff);
    }

    h4 {
      margin-bottom: var(--mp-size--3, 12px);
    }

    .row {
      display: flex;
      align-items: center;
      gap: var(--mp-size--3, 12px);
      padding: var(--mp-size--2, 8px);
      border-bottom: 1px solid var(--mp-color-dark--10, #e5e5e5);
    }

    .row.selected {
      background: var(--mp-color-main--10, #f7faff);
    }

    .thumb {
      width: 56px;
      height: 42px;
      object-fit: cover;
      border-radius: 3px;
      background: var(--mp-color-dark--10);
      flex-shrink: 0;
    }

    .no-image {
      width: 56px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      background: #fdeeca;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .row .label {
      flex: 1;
      min-width: 0;
    }

    .row .label .date {
      font-size: var(--mp-text-c2-font-size, 14px);
      color: var(--mp-color-dark--50, #7f7f7f);
    }

    .image-warning {
      color: #8a5a00;
      font-size: var(--mp-text-c2-font-size, 14px);
    }

    .upload-label {
      font-size: var(--mp-text-c2-font-size, 14px);
      cursor: pointer;
      text-decoration: underline;
      white-space: nowrap;
    }

    .upload-label input {
      display: none;
    }

    .error {
      color: #a33;
    }

    .warning-summary {
      color: #8a5a00;
    }
  `;

  @state() private user: User | null = null;
  @state() private email = '';
  @state() private password = '';
  @state() private authError = '';
  @state() private loading = true;
  @state() private rows: Record<ContentKind, ContentRow[]> = { reviews: [], interviews: [] };
  @state() private selected: Record<ContentKind, string[]> = { reviews: [], interviews: [] };
  @state() private useLatest = true;
  @state() private saving = false;
  @state() private statusMessage = '';
  @state() private errorMessage = '';
  @state() private uploadingId = '';
  @state() private searchQuery: Record<ContentKind, string> = { reviews: '', interviews: '' };
  @state() private searching: Record<ContentKind, boolean> = { reviews: false, interviews: false };

  private searchTimers: Record<ContentKind, ReturnType<typeof setTimeout> | undefined> = {
    reviews: undefined,
    interviews: undefined,
  };

  override connectedCallback(): void {
    super.connectedCallback();
    onAuthStateChanged(getFirebaseAuth(), user => {
      this.user = user;
      if (user) this.loadData();
    });
  }

  private rowFromDoc(kind: ContentKind, id: string, data: Record<string, unknown>): ContentRow {
    const label =
      kind === 'reviews'
        ? [data.name, data.title].filter(Boolean).join(' — ') || String(data.title || id)
        : String(data.title || id);
    const date = String((kind === 'reviews' ? data.reviewDate : data.interviewDate) || data.year || '');
    return { id, label, date, images: Array.isArray(data.images) ? (data.images as string[]) : [] };
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    const db = getDb();
    try {
      // Current selection
      const selectionSnap = await getDoc(doc(db, 'settings', 'homepage'));
      if (selectionSnap.exists()) {
        const data = selectionSnap.data();
        this.useLatest = data.useLatest !== false;
        this.selected = {
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
          interviews: Array.isArray(data.interviews) ? data.interviews : [],
        };
      }

      // Recent candidates
      for (const kind of ['reviews', 'interviews'] as ContentKind[]) {
        const snapshot = await getDocs(
          query(collection(db, kind), orderBy('timePublished', 'desc'), limit(40))
        );
        const rows = snapshot.docs.map(docSnap => this.rowFromDoc(kind, docSnap.id, docSnap.data()));
        // Ensure currently selected items are present even when older than the recent 40
        for (const id of this.selected[kind]) {
          if (!rows.some(row => row.id === id)) {
            const snap = await getDoc(doc(db, kind, id));
            if (snap.exists()) rows.push(this.rowFromDoc(kind, id, snap.data()));
          }
        }
        this.rows = { ...this.rows, [kind]: rows };
      }
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Laden mislukt';
    }
    this.loading = false;
  }

  private async handleSignIn(e: Event): Promise<void> {
    e.preventDefault();
    this.authError = '';
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), this.email, this.password);
      this.password = '';
    } catch (error) {
      this.authError = error instanceof Error ? error.message : 'Aanmelden mislukt';
    }
  }

  /**
   * Archive search: find any article (not just the recent 40) via the same
   * Algolia index the site uses, then pull the matching Firestore docs into
   * the candidate list so they can be selected like any other row.
   */
  private handleSearchInput(kind: ContentKind, value: string): void {
    this.searchQuery = { ...this.searchQuery, [kind]: value };
    clearTimeout(this.searchTimers[kind]);
    if (!value.trim()) return;
    this.searchTimers[kind] = setTimeout(() => this.runSearch(kind, value.trim()), 350);
  }

  private async runSearch(kind: ContentKind, queryText: string): Promise<void> {
    this.searching = { ...this.searching, [kind]: true };
    try {
      const indexName = useTestIndices ? `${kind}_test` : kind;
      const { hits } = await searchClient.initIndex(indexName).search(queryText, { hitsPerPage: 8 });
      const db = getDb();
      const found: ContentRow[] = [];
      for (const hit of hits as { objectID: string }[]) {
        const existing = this.rows[kind].find(row => row.id === hit.objectID);
        if (existing) {
          found.push(existing);
          continue;
        }
        const snap = await getDoc(doc(db, kind, hit.objectID));
        if (snap.exists()) found.push(this.rowFromDoc(kind, snap.id, snap.data()));
      }
      // Search results float to the top of the section; the rest stays below
      const foundIds = new Set(found.map(row => row.id));
      this.rows = { ...this.rows, [kind]: [...found, ...this.rows[kind].filter(row => !foundIds.has(row.id))] };
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Zoeken mislukt';
    }
    this.searching = { ...this.searching, [kind]: false };
  }

  private toggle(kind: ContentKind, id: string): void {
    const current = this.selected[kind];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    this.selected = { ...this.selected, [kind]: next };
    this.useLatest = false;
    this.statusMessage = '';
  }

  private get missingImageCount(): number {
    let count = 0;
    for (const kind of ['reviews', 'interviews'] as ContentKind[]) {
      for (const id of this.selected[kind]) {
        const row = this.rows[kind].find(r => r.id === id);
        if (row && row.images.length === 0) count++;
      }
    }
    return count;
  }

  private async save(): Promise<void> {
    this.saving = true;
    this.errorMessage = '';
    try {
      await setDoc(doc(getDb(), 'settings', 'homepage'), {
        useLatest: false,
        reviews: this.selected.reviews,
        interviews: this.selected.interviews,
        updatedAt: serverTimestamp(),
      });
      this.useLatest = false;
      this.statusMessage = 'Selectie opgeslagen — de site wordt binnen ±15 minuten opnieuw gepubliceerd';
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Opslaan mislukt';
    }
    this.saving = false;
  }

  private async resetToLatest(): Promise<void> {
    this.saving = true;
    this.errorMessage = '';
    try {
      await setDoc(doc(getDb(), 'settings', 'homepage'), {
        useLatest: true,
        reviews: [],
        interviews: [],
        updatedAt: serverTimestamp(),
      });
      this.useLatest = true;
      this.selected = { reviews: [], interviews: [] };
      this.statusMessage = 'Teruggezet naar laatst toegevoegd (standaard)';
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Reset mislukt';
    }
    this.saving = false;
  }

  private async uploadImage(kind: ContentKind, row: ContentRow, e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploadingId = row.id;
    this.errorMessage = '';
    try {
      const folder = kind === 'reviews' ? 'recensie' : 'interview';
      const fileRef = storageRef(getFirebaseStorage(), `${folder}/${file.name}_${Date.now()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await updateDoc(doc(getDb(), kind, row.id), { images: arrayUnion(url) });
      this.rows = {
        ...this.rows,
        [kind]: this.rows[kind].map(r => (r.id === row.id ? { ...r, images: [...r.images, url] } : r)),
      };
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Upload mislukt';
    }
    this.uploadingId = '';
  }

  override render() {
    if (!this.user) {
      return html`
        <form class="login-form" @submit=${this.handleSignIn}>
          <h4>Inloggen</h4>
          <input
            type="email"
            placeholder="E-mail"
            .value=${this.email}
            @input=${(e: Event) => (this.email = (e.target as HTMLInputElement).value)}
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            .value=${this.password}
            @input=${(e: Event) => (this.password = (e.target as HTMLInputElement).value)}
          />
          <button type="submit" class="primary">Inloggen</button>
          ${this.authError ? html`<p class="error">${this.authError}</p>` : nothing}
        </form>
      `;
    }
    if (this.loading) return html`<div class="toolbar">Laden…</div>`;

    const selectionCount = this.selected.reviews.length + this.selected.interviews.length;
    const missing = this.missingImageCount;

    return html`
      <div class="toolbar">
        <button class="primary" ?disabled=${this.saving || selectionCount === 0} @click=${this.save}>
          Selectie opslaan
        </button>
        <button ?disabled=${this.saving} @click=${this.resetToLatest}>
          Reset naar laatst toegevoegd
        </button>
        <span class="mode-banner">
          ${this.useLatest
            ? 'Actief: laatst toegevoegd (standaard)'
            : `Actief: eigen selectie (${selectionCount} items)`}
        </span>
        <span class="status">
          ${missing > 0
            ? html`<span class="warning-summary">⚠ ${missing} geselecteerde item(s) zonder afbeelding</span>`
            : nothing}
          ${this.statusMessage}
          ${this.errorMessage ? html`<span class="error">${this.errorMessage}</span>` : nothing}
        </span>
      </div>
      ${(['reviews', 'interviews'] as ContentKind[]).map(kind => this.renderSection(kind))}
    `;
  }

  private renderSection(kind: ContentKind) {
    const title = kind === 'reviews' ? 'Recensies' : 'Interviews';
    const count = this.selected[kind].length;
    return html`
      <section>
        <h4>${title} — ${count} geselecteerd (aanbevolen: ${RECOMMENDED_COUNT})</h4>
        <input
          type="search"
          class="archive-search"
          placeholder="Zoek in alle ${title.toLowerCase()} (titel, naam, persoon, gezelschap)…"
          .value=${this.searchQuery[kind]}
          @input=${(e: Event) => this.handleSearchInput(kind, (e.target as HTMLInputElement).value)}
        />
        ${this.searching[kind] ? html`<p>Zoeken…</p>` : nothing}
        ${this.rows[kind].map(row => {
          const isSelected = this.selected[kind].includes(row.id);
          const noImage = row.images.length === 0;
          return html`
            <div class="row ${isSelected ? 'selected' : ''}">
              <input
                type="checkbox"
                .checked=${isSelected}
                @change=${() => this.toggle(kind, row.id)}
              />
              ${noImage
                ? html`<span class="no-image" title="Geen afbeelding">⚠</span>`
                : html`<img class="thumb" src=${row.images[0]} alt="" loading="lazy" />`}
              <div class="label">
                <div>${row.label}</div>
                <div class="date">${row.date}</div>
              </div>
              ${isSelected && noImage
                ? html`<span class="image-warning">⚠ geen afbeelding</span>`
                : nothing}
              <label class="upload-label">
                ${this.uploadingId === row.id ? 'Bezig…' : 'Afbeelding toevoegen'}
                <input
                  type="file"
                  accept="image/*"
                  ?disabled=${this.uploadingId !== ''}
                  @change=${(e: Event) => this.uploadImage(kind, row, e)}
                />
              </label>
            </div>
          `;
        })}
      </section>
    `;
  }
}

export default MpCurateHome;

declare global {
  interface HTMLElementTagNameMap {
    'mp-curate-home': MpCurateHome;
  }
}
