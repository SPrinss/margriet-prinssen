/**
 * Bulk import wizard for .docx article files.
 *
 * Flow: sign in → drop/select .docx files → each file is parsed locally
 * (mammoth + import-parser heuristics) → parsed fields are shown per file
 * with match indicators against existing persons/groups/theaters/cities →
 * the user corrects and accepts each file → once ALL files are accepted,
 * everything is written to Firestore in one go (entities get-or-created
 * first, then the review/interview documents). Algolia indexing and the
 * site rebuild follow automatically via Cloud Function triggers.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { User } from 'firebase/auth';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import mammoth from 'mammoth/mammoth.browser';
import { getFirebaseAuth } from '../../lib/firebase-client';
import { getDb } from '../../lib/firebase';
// @ts-ignore - plain ESM module shared with the Node test harness
import { parseArticle, htmlToParagraphs } from '../../lib/import-parser.mjs';

interface EntityRecord {
  id: string;
  name: string;
}

type EntityCollection = 'persons' | 'groups' | 'theaters' | 'cities';

interface Draft {
  type: 'review' | 'interview';
  name?: string;
  title: string;
  groups?: string[];
  writers?: string[];
  directors?: string[];
  actors?: string[];
  theater?: string;
  city?: string;
  reviewDate?: string;
  persons?: string[];
  interviewDate?: string;
  year: string;
  bodyHtml: string;
  warnings: string[];
  sourceFile: string;
}

interface ImportItem {
  key: string;
  fileName: string;
  draft: Draft;
  accepted: boolean;
  written: boolean;
  expanded: boolean;
  error?: string;
}

const ENTITY_FIELDS: Record<string, EntityCollection> = {
  groups: 'groups',
  writers: 'persons',
  directors: 'persons',
  actors: 'persons',
  persons: 'persons',
  theater: 'theaters',
  city: 'cities',
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    // Word auto-curls apostrophes/quotes; treat all variants as equal so
    // "L’Herminez" (docx) matches "L'Herminez" (database)
    .replace(/[’‘‛`´ʼ]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Levenshtein distance capped at `max` (bails out early). Used only to
 * SUGGEST near-matches in the UI — never to silently merge records, since
 * two similarly-spelled names can be genuinely different people.
 */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    prev = curr;
  }
  return prev[b.length];
}

@customElement('mp-import-content')
export class MpImportContent extends LitElement {
  static override styles = css`
    :host {
      display: block;
      font-family: var(--mp-text-b-font-family, sans-serif);
    }

    .login-form,
    .toolbar,
    .item {
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

    input,
    select,
    textarea {
      font: inherit;
      font-size: var(--mp-text-b3-font-size, 16px);
      padding: var(--mp-size--2, 8px);
      border: 1px solid var(--mp-color-dark--20, #ccc);
      border-radius: var(--mp-border-radius--1, 5px);
      width: 100%;
      box-sizing: border-box;
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
    }

    .toolbar .status {
      margin-left: auto;
      font-size: var(--mp-text-c1-font-size, 16px);
    }

    .item.accepted {
      border-left: 6px solid #7dba6c;
    }

    .item.written {
      opacity: 0.6;
      border-left: 6px solid var(--mp-color-dark--30);
    }

    .item-header {
      display: flex;
      align-items: baseline;
      gap: var(--mp-size--3, 12px);
      cursor: pointer;
      flex-wrap: wrap;
    }

    .item-header .file {
      font-weight: 600;
    }

    .item-header .type-badge {
      font-size: var(--mp-text-c2-font-size, 14px);
      padding: 2px 8px;
      border-radius: 10px;
      background: var(--mp-color-main--30, #e7f0ff);
    }

    .item-header .warnings-badge {
      font-size: var(--mp-text-c2-font-size, 14px);
      color: #8a5a00;
    }

    .item-header .accept-state {
      margin-left: auto;
      font-size: var(--mp-text-c2-font-size, 14px);
    }

    .fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--mp-size--3, 12px);
      margin-top: var(--mp-size--4, 16px);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field.wide {
      grid-column: 1 / -1;
    }

    .field label {
      font-size: var(--mp-text-c2-font-size, 14px);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--mp-color-dark--60, #666);
    }

    .match {
      font-size: var(--mp-text-c3-font-size, 12px);
      align-self: flex-start;
      padding: 1px 8px;
      border-radius: 8px;
    }

    .match.existing {
      background: #e2f2dc;
      color: #2c6b1e;
    }

    .match.new {
      background: #fdeeca;
      color: #8a5a00;
    }

    button.suggestion {
      background: none;
      border: none;
      padding: 1px 6px;
      font-size: var(--mp-text-c3-font-size, 12px);
      color: #2c5aa0;
      text-decoration: underline;
      cursor: pointer;
    }

    .warnings {
      margin-top: var(--mp-size--3, 12px);
      color: #8a5a00;
      font-size: var(--mp-text-c1-font-size, 16px);
    }

    .body-preview {
      margin-top: var(--mp-size--3, 12px);
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid var(--mp-color-dark--10, #e5e5e5);
      border-radius: var(--mp-border-radius--1, 5px);
      padding: var(--mp-size--3, 12px);
      font-size: var(--mp-text-b3-font-size, 16px);
    }

    .item-actions {
      display: flex;
      gap: var(--mp-size--3, 12px);
      margin-top: var(--mp-size--4, 16px);
    }

    .error {
      color: #a33;
    }

    .dropzone {
      border: 2px dashed var(--mp-color-dark--30, #b2b2b2);
      border-radius: var(--mp-border-radius--1, 5px);
      padding: var(--mp-size--7, 32px);
      text-align: center;
      color: var(--mp-color-dark--60, #666);
      margin-bottom: var(--mp-size--4, 16px);
    }

    .dropzone.dragover {
      border-color: var(--mp-color-main--100, #b2cdff);
      background: var(--mp-color-main--10, #f7faff);
    }

    @media (max-width: 660px) {
      .fields {
        grid-template-columns: 1fr;
      }
    }
  `;

  @state() private user: User | null = null;
  @state() private email = '';
  @state() private password = '';
  @state() private authError = '';
  @state() private entitiesLoaded = false;
  @state() private items: ImportItem[] = [];
  @state() private parsing = false;
  @state() private writing = false;
  @state() private writeProgress = '';
  @state() private writeError = '';
  @state() private dragover = false;

  private entities: Record<EntityCollection, Map<string, EntityRecord>> = {
    persons: new Map(),
    groups: new Map(),
    theaters: new Map(),
    cities: new Map(),
  };

  override connectedCallback(): void {
    super.connectedCallback();
    onAuthStateChanged(getFirebaseAuth(), user => {
      this.user = user;
      if (user && !this.entitiesLoaded) this.loadEntities();
    });
  }

  private async loadEntities(): Promise<void> {
    const db = getDb();
    await Promise.all(
      (Object.keys(this.entities) as EntityCollection[]).map(async col => {
        const snapshot = await getDocs(collection(db, col));
        snapshot.docs.forEach(doc => {
          const name = doc.data().name;
          if (typeof name === 'string' && name) {
            this.entities[col].set(normalizeName(name), { id: doc.id, name });
          }
        });
      })
    );
    this.entitiesLoaded = true;
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

  // -- file intake ----------------------------------------------------------

  private async addFiles(files: FileList | File[]): Promise<void> {
    this.parsing = true;
    const newItems: ImportItem[] = [];
    for (const file of Array.from(files)) {
      if (!/\.docx$/i.test(file.name)) continue;
      const key = `${file.name}-${file.size}`;
      if (this.items.some(item => item.key === key)) continue;
      try {
        const arrayBuffer = await file.arrayBuffer();
        const { value: htmlContent } = await mammoth.convertToHtml({ arrayBuffer });
        const folderHint = (file as File & { webkitRelativePath?: string }).webkitRelativePath || '';
        const draft = parseArticle(htmlToParagraphs(htmlContent), file.name, folderHint) as Draft;
        this.fixTheaterCityOrder(draft);
        newItems.push({ key, fileName: file.name, draft, accepted: false, written: false, expanded: true });
      } catch (error) {
        newItems.push({
          key,
          fileName: file.name,
          draft: this.emptyDraft(file.name),
          accepted: false,
          written: false,
          expanded: true,
          error: error instanceof Error ? error.message : 'Kon bestand niet lezen',
        });
      }
    }
    this.items = [...this.items, ...newItems];
    this.parsing = false;
  }

  private emptyDraft(fileName: string): Draft {
    return {
      type: 'review',
      name: '',
      title: '',
      groups: [],
      writers: [],
      directors: [],
      actors: [],
      theater: '',
      city: '',
      reviewDate: '',
      year: '',
      bodyHtml: '',
      warnings: ['Bestand kon niet automatisch verwerkt worden'],
      sourceFile: fileName,
    };
  }

  /**
   * The parser keeps theater/city in source order; older files use
   * "city, theater" and newer "theater, city". Disambiguate against the known
   * cities collection.
   */
  private fixTheaterCityOrder(draft: Draft): void {
    if (draft.type !== 'review') return;
    const isCity = (value?: string) => !!value && this.entities.cities.has(normalizeName(value));
    if (isCity(draft.theater) && !isCity(draft.city)) {
      const swap = draft.theater;
      draft.theater = draft.city;
      draft.city = swap;
    }
  }

  // -- field updates --------------------------------------------------------

  private updateItem(key: string, update: (draft: Draft) => void): void {
    this.items = this.items.map(item => {
      if (item.key !== key) return item;
      const draft = { ...item.draft };
      update(draft);
      // Any edit un-accepts the item so changes are consciously re-accepted
      return { ...item, draft, accepted: false };
    });
  }

  /** Nearest existing record within edit distance 1 (short) / 2 (long names). */
  private findSuggestion(collectionName: EntityCollection, value: string): EntityRecord | null {
    const norm = normalizeName(value);
    if (!norm || this.entities[collectionName].has(norm)) return null;
    const max = norm.length >= 8 ? 2 : 1;
    let best: EntityRecord | null = null;
    let bestDistance = max + 1;
    for (const [key, record] of this.entities[collectionName]) {
      const distance = editDistance(norm, key, max);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = record;
        if (distance === 1) break;
      }
    }
    return bestDistance <= max ? best : null;
  }

  private matchBadge(collectionName: EntityCollection, value: string, onPick?: (name: string) => void) {
    if (!value.trim()) return nothing;
    const existing = this.entities[collectionName].get(normalizeName(value));
    if (existing) return html`<span class="match existing">✓ bestaand</span>`;
    const suggestion = onPick ? this.findSuggestion(collectionName, value) : null;
    return html`<span class="match new">+ nieuw</span>${
      suggestion
        ? html`<button class="suggestion" @click=${() => onPick!(suggestion.name)}>
            bedoelde je “${suggestion.name}”?
          </button>`
        : nothing
    }`;
  }

  // -- writing --------------------------------------------------------------

  private async getOrCreateEntity(collectionName: EntityCollection, name: string): Promise<EntityRecord> {
    const key = normalizeName(name);
    const cached = this.entities[collectionName].get(key);
    if (cached) return cached;
    const db = getDb();
    const docRef = await addDoc(collection(db, collectionName), { name });
    await setDoc(docRef, { id: docRef.id }, { merge: true });
    const record = { id: docRef.id, name };
    this.entities[collectionName].set(key, record);
    return record;
  }

  private timePublishedFor(dateStr?: string) {
    // MM-DD-YYYY → Timestamp so imported articles keep chronological order
    const match = (dateStr || '').match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) return serverTimestamp();
    return Timestamp.fromDate(new Date(parseInt(match[3], 10), parseInt(match[1], 10) - 1, parseInt(match[2], 10)));
  }

  private async writeAll(): Promise<void> {
    if (this.writing) return;
    this.writing = true;
    this.writeError = '';
    const db = getDb();
    const pending = this.items.filter(item => item.accepted && !item.written);

    try {
      for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        this.writeProgress = `${i + 1}/${pending.length}: ${item.fileName}`;
        const draft = item.draft;

        const namesToRecords = async (names: string[] | undefined, col: EntityCollection) => {
          const records: EntityRecord[] = [];
          for (const name of names || []) {
            if (name.trim()) records.push(await this.getOrCreateEntity(col, name.trim()));
          }
          return records;
        };

        if (draft.type === 'review') {
          const doc = {
            name: draft.name || '',
            title: draft.title || '',
            review: draft.bodyHtml,
            reviewDate: draft.reviewDate || '',
            groups: await namesToRecords(draft.groups, 'groups'),
            writers: await namesToRecords(draft.writers, 'persons'),
            directors: await namesToRecords(draft.directors, 'persons'),
            actors: await namesToRecords(draft.actors, 'persons'),
            theater: draft.theater?.trim() ? await this.getOrCreateEntity('theaters', draft.theater.trim()) : null,
            city: draft.city?.trim() ? await this.getOrCreateEntity('cities', draft.city.trim()) : null,
            year: draft.year || '',
            images: [],
            timePublished: this.timePublishedFor(draft.reviewDate),
          };
          await addDoc(collection(db, 'reviews'), doc);
        } else {
          const doc = {
            title: draft.title || '',
            interview: draft.bodyHtml,
            interviewDate: draft.interviewDate || '',
            persons: await namesToRecords(draft.persons, 'persons'),
            year: draft.year || '',
            images: [],
            timePublished: this.timePublishedFor(draft.interviewDate),
          };
          await addDoc(collection(db, 'interviews'), doc);
        }

        this.items = this.items.map(existing =>
          existing.key === item.key ? { ...existing, written: true, expanded: false } : existing
        );
      }
      this.writeProgress = `Klaar: ${pending.length} artikelen opgeslagen`;
    } catch (error) {
      this.writeError = error instanceof Error ? error.message : 'Schrijven mislukt';
    } finally {
      this.writing = false;
    }
  }

  // -- rendering ------------------------------------------------------------

  override render() {
    if (!this.user) return this.renderLogin();
    if (!this.entitiesLoaded) return html`<div class="toolbar">Bestaande records laden…</div>`;

    const unwritten = this.items.filter(item => !item.written);
    const acceptedCount = unwritten.filter(item => item.accepted).length;
    const allAccepted = unwritten.length > 0 && acceptedCount === unwritten.length;

    return html`
      <div
        class="dropzone ${this.dragover ? 'dragover' : ''}"
        @dragover=${(e: DragEvent) => {
          e.preventDefault();
          this.dragover = true;
        }}
        @dragleave=${() => (this.dragover = false)}
        @drop=${(e: DragEvent) => {
          e.preventDefault();
          this.dragover = false;
          if (e.dataTransfer?.files) this.addFiles(e.dataTransfer.files);
        }}
      >
        Sleep .docx bestanden hierheen, of
        <input
          type="file"
          accept=".docx"
          multiple
          style="width:auto"
          @change=${(e: Event) => {
            const input = e.target as HTMLInputElement;
            if (input.files) this.addFiles(input.files);
            input.value = '';
          }}
        />
        ${this.parsing ? html`<p>Bestanden verwerken…</p>` : nothing}
      </div>

      ${this.items.length > 0
        ? html`
            <div class="toolbar">
              <button @click=${() => (this.items = this.items.map(item => (item.written ? item : { ...item, accepted: true })))}>
                Alles accepteren
              </button>
              <button
                class="primary"
                ?disabled=${!allAccepted || this.writing}
                title=${allAccepted ? '' : 'Accepteer eerst alle bestanden'}
                @click=${this.writeAll}
              >
                ${this.writing ? 'Bezig met schrijven…' : `Schrijf ${acceptedCount} artikelen naar de database`}
              </button>
              <span class="status">
                ${acceptedCount}/${unwritten.length} geaccepteerd
                ${this.writeProgress ? html`— ${this.writeProgress}` : nothing}
                ${this.writeError ? html`<span class="error"> ${this.writeError}</span>` : nothing}
              </span>
            </div>
          `
        : nothing}
      ${this.items.map(item => this.renderItem(item))}
    `;
  }

  private renderLogin() {
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

  private renderItem(item: ImportItem) {
    const { draft } = item;
    return html`
      <div class="item ${item.written ? 'written' : item.accepted ? 'accepted' : ''}">
        <div
          class="item-header"
          @click=${() => (this.items = this.items.map(existing => (existing.key === item.key ? { ...existing, expanded: !existing.expanded } : existing)))}
        >
          <span class="file">${item.fileName}</span>
          <span class="type-badge">${draft.type === 'review' ? 'Recensie' : 'Interview'}</span>
          ${draft.warnings.length ? html`<span class="warnings-badge">⚠ ${draft.warnings.length}</span>` : nothing}
          <span class="accept-state">
            ${item.written ? '✓ opgeslagen' : item.accepted ? '✓ geaccepteerd' : 'nog niet geaccepteerd'}
          </span>
        </div>
        ${item.error ? html`<p class="error">${item.error}</p>` : nothing}
        ${item.expanded && !item.written ? this.renderFields(item) : nothing}
      </div>
    `;
  }

  private renderFields(item: ImportItem) {
    const { draft } = item;
    const text = (label: string, field: keyof Draft, opts: { wide?: boolean; entity?: EntityCollection } = {}) => html`
      <div class="field ${opts.wide ? 'wide' : ''}">
        <label>${label}</label>
        <input
          type="text"
          .value=${(draft[field] as string) || ''}
          @input=${(e: Event) => this.updateItem(item.key, d => ((d[field] as string) = (e.target as HTMLInputElement).value))}
        />
        ${opts.entity
          ? this.matchBadge(opts.entity, (draft[field] as string) || '', name =>
              this.updateItem(item.key, d => ((d[field] as string) = name))
            )
          : nothing}
      </div>
    `;
    const list = (label: string, field: 'groups' | 'writers' | 'directors' | 'actors' | 'persons') => html`
      <div class="field wide">
        <label>${label} (komma-gescheiden)</label>
        <input
          type="text"
          .value=${(draft[field] || []).join(', ')}
          @input=${(e: Event) =>
            this.updateItem(item.key, d => {
              d[field] = (e.target as HTMLInputElement).value
                .split(',')
                .map(name => name.trim())
                .filter(Boolean);
            })}
        />
        <div>
          ${(draft[field] || []).map(name =>
            this.matchBadge(ENTITY_FIELDS[field] as EntityCollection, name, picked =>
              this.updateItem(item.key, d => {
                d[field] = (d[field] || []).map(existing => (existing === name ? picked : existing));
              })
            )
          )}
        </div>
      </div>
    `;

    return html`
      <div class="fields">
        <div class="field">
          <label>Type</label>
          <select
            .value=${draft.type}
            @change=${(e: Event) =>
              this.updateItem(item.key, d => {
                d.type = (e.target as HTMLSelectElement).value as Draft['type'];
              })}
          >
            <option value="review" ?selected=${draft.type === 'review'}>Recensie</option>
            <option value="interview" ?selected=${draft.type === 'interview'}>Interview</option>
          </select>
        </div>
        ${text('Jaar', 'year')}
        ${draft.type === 'review'
          ? html`
              ${text('Naam voorstelling', 'name')}
              ${text('Titel (kop)', 'title', { wide: true })}
              ${list('Gezelschappen', 'groups')}
              ${list('Tekst (schrijvers)', 'writers')}
              ${list('Regie', 'directors')}
              ${list('Spel (acteurs)', 'actors')}
              ${text('Theater', 'theater', { entity: 'theaters' })}
              ${text('Stad', 'city', { entity: 'cities' })}
              ${text('Datum (MM-DD-JJJJ)', 'reviewDate')}
            `
          : html`
              ${text('Titel (kop)', 'title', { wide: true })}
              ${list('Personen', 'persons')}
              ${text('Datum (MM-DD-JJJJ)', 'interviewDate')}
            `}
      </div>
      ${draft.warnings.length
        ? html`<div class="warnings">${draft.warnings.map(warning => html`<div>⚠ ${warning}</div>`)}</div>`
        : nothing}
      <details class="body-preview-wrap">
        <summary>Tekst voorvertoning (${Math.round(draft.bodyHtml.length / 1000)}k)</summary>
        <div class="body-preview">${unsafeHTML(draft.bodyHtml)}</div>
      </details>
      <div class="item-actions">
        <button
          class="primary"
          ?disabled=${item.accepted}
          @click=${() => (this.items = this.items.map(existing => (existing.key === item.key ? { ...existing, accepted: true, expanded: false } : existing)))}
        >
          Accepteren
        </button>
        <button @click=${() => (this.items = this.items.filter(existing => existing.key !== item.key))}>
          Verwijderen uit lijst
        </button>
      </div>
    `;
  }
}

export default MpImportContent;

declare global {
  interface HTMLElementTagNameMap {
    'mp-import-content': MpImportContent;
  }
}
