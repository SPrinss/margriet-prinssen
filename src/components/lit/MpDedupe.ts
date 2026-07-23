/**
 * Duplicate-name cleanup tool.
 *
 * Scans all reviews and interviews for person/group name variants that are
 * almost certainly the same entity — same name up to case, diacritics,
 * ij↔y, apostrophes/hyphens (deterministic tier), plus near-miss spellings
 * (edit distance 1, "possible typo" tier, unchecked by default).
 *
 * The admin picks which clusters to merge and which spelling is canonical;
 * the tool then rewrites every affected article ref (writers/directors/
 * actors/groups/persons arrays), unifies the entity records in the persons/
 * groups collections, and deletes the duplicate entity docs. Algolia and the
 * site rebuild follow automatically via the existing triggers.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { User } from 'firebase/auth';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
} from 'firebase/firestore';
import { getFirebaseAuth } from '../../lib/firebase-client';
import { getDb } from '../../lib/firebase';

interface NameRef {
  articleCollection: 'reviews' | 'interviews';
  docId: string;
  field: string; // writers | directors | actors | groups | persons
}

interface Cluster {
  key: string;
  tier: 'zeker' | 'mogelijk';
  entityCollection: 'persons' | 'groups';
  variants: { name: string; count: number }[];
  canonical: string;
  selected: boolean;
  merged?: boolean;
}

const ROLE_FIELDS: Record<'reviews' | 'interviews', string[]> = {
  reviews: ['writers', 'directors', 'actors', 'groups'],
  interviews: ['persons'],
};

function hardNormalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[’‘‛`´ʼ]/g, '')
    .replace(/'/g, '')
    .replace(/ij/g, 'y')
    .replace(/[-.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistanceIsOne(a: string, b: string): boolean {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    let diff = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
    return diff === 1;
  }
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  for (let i = 0; i < long.length; i++) {
    if (short === long.slice(0, i) + long.slice(i + 1)) return true;
  }
  return false;
}

@customElement('mp-dedupe')
export class MpDedupe extends LitElement {
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

    input[type='email'],
    input[type='password'] {
      font: inherit;
      padding: var(--mp-size--2, 8px);
      border: 1px solid var(--mp-color-dark--20, #ccc);
      border-radius: var(--mp-border-radius--1, 5px);
    }

    button {
      font: inherit;
      padding: var(--mp-size--2, 8px) var(--mp-size--4, 16px);
      background-color: var(--mp-color-secondary--100, #f4d18f);
      border: 2px solid transparent;
      border-radius: var(--mp-border-radius--1, 5px);
      cursor: pointer;
    }

    button.primary {
      background-color: var(--mp-color-main--100, #b2cdff);
      font-weight: 600;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

    .status {
      margin-left: auto;
      font-size: var(--mp-text-c1-font-size, 16px);
    }

    .cluster {
      display: flex;
      align-items: center;
      gap: var(--mp-size--3, 12px);
      padding: var(--mp-size--2, 8px);
      border-bottom: 1px solid var(--mp-color-dark--10, #e5e5e5);
      flex-wrap: wrap;
    }

    .cluster.merged {
      opacity: 0.5;
    }

    .tier {
      font-size: var(--mp-text-c3-font-size, 12px);
      padding: 1px 8px;
      border-radius: 8px;
    }

    .tier.zeker {
      background: #e2f2dc;
      color: #2c6b1e;
    }

    .tier.mogelijk {
      background: #fdeeca;
      color: #8a5a00;
    }

    .variant {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: var(--mp-text-b3-font-size, 16px);
    }

    .error {
      color: #a33;
    }

    h4 {
      margin: 0 0 var(--mp-size--3) 0;
    }
  `;

  @state() private user: User | null = null;
  @state() private email = '';
  @state() private password = '';
  @state() private authError = '';
  @state() private scanning = false;
  @state() private clusters: Cluster[] = [];
  @state() private merging = false;
  @state() private statusMessage = '';
  @state() private errorMessage = '';

  // name → list of article refs containing it (built during scan)
  private nameRefs = new Map<string, NameRef[]>();

  override connectedCallback(): void {
    super.connectedCallback();
    onAuthStateChanged(getFirebaseAuth(), user => {
      this.user = user;
      if (user && this.clusters.length === 0 && !this.scanning) this.scan();
    });
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

  private async scan(): Promise<void> {
    this.scanning = true;
    this.statusMessage = 'Alle artikelen laden…';
    const db = getDb();
    const counts = new Map<string, number>();
    const nameCollection = new Map<string, 'persons' | 'groups'>();
    this.nameRefs = new Map();

    for (const articleCollection of ['reviews', 'interviews'] as const) {
      const snapshot = await getDocs(collection(db, articleCollection));
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        for (const field of ROLE_FIELDS[articleCollection]) {
          for (const ref of data[field] || []) {
            const name = typeof ref === 'object' && ref?.name ? String(ref.name).trim() : '';
            if (!name) continue;
            counts.set(name, (counts.get(name) || 0) + 1);
            nameCollection.set(name, field === 'groups' ? 'groups' : 'persons');
            if (!this.nameRefs.has(name)) this.nameRefs.set(name, []);
            this.nameRefs.get(name)!.push({ articleCollection, docId: docSnap.id, field });
          }
        }
      }
    }

    // Tier 1: deterministic clusters via hard normalization
    const byKey = new Map<string, string[]>();
    for (const name of counts.keys()) {
      const key = hardNormalize(name);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(name);
    }

    const clusters: Cluster[] = [];
    for (const [key, names] of byKey) {
      if (names.length < 2) continue;
      const variants = names
        .map(name => ({ name, count: counts.get(name) || 0 }))
        .sort((a, b) => b.count - a.count);
      clusters.push({
        key,
        tier: 'zeker',
        entityCollection: nameCollection.get(variants[0].name) || 'persons',
        variants,
        canonical: variants[0].name,
        selected: true,
      });
    }

    // Tier 2: edit-distance-1 between cluster keys (possible typos)
    const keys = [...byKey.keys()].filter(k => k.length > 6).sort();
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        if (keys[j].slice(0, 3) !== keys[i].slice(0, 3)) break;
        if (!editDistanceIsOne(keys[i], keys[j])) continue;
        const names = [...byKey.get(keys[i])!, ...byKey.get(keys[j])!];
        const variants = names
          .map(name => ({ name, count: counts.get(name) || 0 }))
          .sort((a, b) => b.count - a.count);
        clusters.push({
          key: `${keys[i]}~${keys[j]}`,
          tier: 'mogelijk',
          entityCollection: nameCollection.get(variants[0].name) || 'persons',
          variants,
          canonical: variants[0].name,
          selected: false,
        });
      }
    }

    clusters.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier === 'zeker' ? -1 : 1;
      const totalA = a.variants.reduce((sum, v) => sum + v.count, 0);
      const totalB = b.variants.reduce((sum, v) => sum + v.count, 0);
      return totalB - totalA;
    });

    this.clusters = clusters;
    this.statusMessage = `${clusters.length} mogelijke duplicaten gevonden`;
    this.scanning = false;
  }

  private async mergeSelected(): Promise<void> {
    if (this.merging) return;
    const selected = this.clusters.filter(c => c.selected && !c.merged);
    if (selected.length === 0) return;
    if (!window.confirm(`${selected.length} samenvoeging(en) uitvoeren? Dit past artikelen aan.`)) return;

    this.merging = true;
    this.errorMessage = '';
    const db = getDb();

    try {
      for (let i = 0; i < selected.length; i++) {
        const cluster = selected[i];
        this.statusMessage = `Samenvoegen ${i + 1}/${selected.length}: ${cluster.canonical}`;
        const variantNames = cluster.variants.map(v => v.name).filter(n => n !== cluster.canonical);

        // Canonical entity record: find by name, else create
        const entityCol = cluster.entityCollection;
        let canonicalRef: { id: string; name: string } | null = null;
        const canonicalSnap = await getDocs(
          query(collection(db, entityCol), where('name', '==', cluster.canonical))
        );
        if (!canonicalSnap.empty) {
          canonicalRef = { id: canonicalSnap.docs[0].id, name: cluster.canonical };
        } else {
          const created = await addDoc(collection(db, entityCol), { name: cluster.canonical });
          await setDoc(created, { id: created.id }, { merge: true });
          canonicalRef = { id: created.id, name: cluster.canonical };
        }

        // Rewrite every article that references a variant name
        const affected = new Map<string, NameRef[]>();
        for (const variant of variantNames) {
          for (const ref of this.nameRefs.get(variant) || []) {
            const key = `${ref.articleCollection}/${ref.docId}`;
            if (!affected.has(key)) affected.set(key, []);
            affected.get(key)!.push(ref);
          }
        }
        for (const [docPath] of affected) {
          const [articleCollection, docId] = docPath.split('/');
          const docRef = doc(db, articleCollection, docId);
          const snapshot = await getDocs(
            query(collection(db, articleCollection), where('__name__', '==', docId))
          );
          if (snapshot.empty) continue;
          const data = snapshot.docs[0].data();
          const update: Record<string, unknown> = {};
          for (const field of ROLE_FIELDS[articleCollection as 'reviews' | 'interviews']) {
            const arr = data[field];
            if (!Array.isArray(arr)) continue;
            let changed = false;
            const seen = new Set<string>();
            const rebuilt: unknown[] = [];
            for (const item of arr) {
              const name = typeof item === 'object' && item?.name ? String(item.name).trim() : '';
              const replaced = variantNames.includes(name) ? canonicalRef : item;
              if (replaced !== item) changed = true;
              const dedupKey =
                typeof replaced === 'object' && (replaced as { name?: string })?.name
                  ? (replaced as { name: string }).name
                  : JSON.stringify(replaced);
              if (seen.has(dedupKey)) {
                changed = true;
                continue; // canonical already present in this array
              }
              seen.add(dedupKey);
              rebuilt.push(replaced);
            }
            if (changed) update[field] = rebuilt;
          }
          if (Object.keys(update).length > 0) await updateDoc(docRef, update);
        }

        // Delete the variant entity records
        for (const variant of variantNames) {
          const variantSnap = await getDocs(
            query(collection(db, entityCol), where('name', '==', variant))
          );
          for (const docSnap of variantSnap.docs) {
            if (docSnap.id !== canonicalRef.id) await deleteDoc(docSnap.ref);
          }
        }

        this.clusters = this.clusters.map(c => (c.key === cluster.key ? { ...c, merged: true } : c));
      }
      this.statusMessage = `Klaar: ${selected.length} samenvoeging(en) uitgevoerd — zoekindex en site volgen automatisch`;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Samenvoegen mislukt';
    }
    this.merging = false;
  }

  override render() {
    if (!this.user) {
      return html`
        <form class="login-form" @submit=${this.handleSignIn}>
          <h4>Inloggen</h4>
          <input type="email" placeholder="E-mail" .value=${this.email} @input=${(e: Event) => (this.email = (e.target as HTMLInputElement).value)} />
          <input type="password" placeholder="Wachtwoord" .value=${this.password} @input=${(e: Event) => (this.password = (e.target as HTMLInputElement).value)} />
          <button type="submit" class="primary">Inloggen</button>
          ${this.authError ? html`<p class="error">${this.authError}</p>` : nothing}
        </form>
      `;
    }
    if (this.scanning) return html`<div class="toolbar">${this.statusMessage || 'Scannen…'}</div>`;

    const selectedCount = this.clusters.filter(c => c.selected && !c.merged).length;
    return html`
      <div class="toolbar">
        <button class="primary" ?disabled=${this.merging || selectedCount === 0} @click=${this.mergeSelected}>
          ${this.merging ? 'Bezig…' : `Voer ${selectedCount} samenvoeging(en) uit`}
        </button>
        <span class="status">
          ${this.statusMessage}
          ${this.errorMessage ? html`<span class="error">${this.errorMessage}</span>` : nothing}
        </span>
      </div>
      <section>
        <h4>Waarschijnlijke duplicaten (kies per rij de juiste schrijfwijze)</h4>
        ${this.clusters.map(cluster => this.renderCluster(cluster))}
      </section>
    `;
  }

  private renderCluster(cluster: Cluster) {
    return html`
      <div class="cluster ${cluster.merged ? 'merged' : ''}">
        <input
          type="checkbox"
          .checked=${cluster.selected}
          ?disabled=${cluster.merged}
          @change=${() =>
            (this.clusters = this.clusters.map(c =>
              c.key === cluster.key ? { ...c, selected: !c.selected } : c
            ))}
        />
        <span class="tier ${cluster.tier}">${cluster.tier === 'zeker' ? 'vrijwel zeker' : 'mogelijk (typefout?)'}</span>
        ${cluster.variants.map(
          variant => html`
            <label class="variant">
              <input
                type="radio"
                name=${cluster.key}
                .checked=${cluster.canonical === variant.name}
                ?disabled=${cluster.merged}
                @change=${() =>
                  (this.clusters = this.clusters.map(c =>
                    c.key === cluster.key ? { ...c, canonical: variant.name } : c
                  ))}
              />
              ${variant.name} (${variant.count})
            </label>
          `
        )}
        ${cluster.merged ? html`<span>✓ samengevoegd</span>` : nothing}
      </div>
    `;
  }
}

export default MpDedupe;

declare global {
  interface HTMLElementTagNameMap {
    'mp-dedupe': MpDedupe;
  }
}
