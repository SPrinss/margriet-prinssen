import { LitElement, html, css } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import type { User, Auth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

// Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyC8em8nKNhnyhDFrj4_pTrRpGy8nmNxh8k',
  authDomain: 'margriet-prinssen.firebaseapp.com',
  projectId: 'margriet-prinssen',
  storageBucket: 'margriet-prinssen.appspot.com',
  appId: '1:840668873185:web:fc66cab4b29d56940052a0'
};

// Types
interface Person {
  id: string;
  name: string;
}

interface ReviewData {
  title: string;
  name: string;
  review: string;
  reviewDate: string;
  groups: Person[];
  writers: Person[];
  directors: Person[];
  actors: Person[];
  theater: Person | null;
  city: Person | null;
  year: number;
  images: string[];
}

interface InterviewData {
  title: string;
  interview: string;
  interviewDate: string;
  persons: Person[];
  year: number;
  images: string[];
}

type ContentType = 'recensie' | 'interview';
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

@customElement('mp-add-content')
export class MpAddContent extends LitElement {
  static override styles = css`
    :host {
      display: block;
      max-width: 1000px;
      margin: 0 auto;
      padding: var(--mp-size--5, 20px);
    }

    * {
      box-sizing: border-box;
    }

    .auth-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--mp-size--4, 16px);
      padding: var(--mp-size--8, 40px);
      background: var(--mp-color-main--20, #eff5ff);
      border-radius: var(--mp-border-radius--1, 5px);
    }

    .auth-section h2 {
      margin: 0 0 var(--mp-size--4, 16px) 0;
      font-family: var(--mp-text-h-font-family, 'Raleway', serif);
      font-size: var(--mp-text-h3-font-size, 40px);
      font-weight: var(--mp-text-h3-font-weight, 600);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: var(--mp-size--3, 12px);
      width: 100%;
      max-width: 400px;
    }

    header {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin-bottom: var(--mp-size--9, 48px);
    }

    header h2 {
      text-transform: capitalize;
      margin: 0;
      font-family: var(--mp-text-h-font-family, 'Raleway', serif);
      font-size: var(--mp-text-h2-font-size, 52px);
      font-weight: var(--mp-text-h-font-weight, 700);
    }

    .type-toggle {
      display: flex;
      gap: var(--mp-size--3, 12px);
      margin-top: var(--mp-size--4, 16px);
    }

    .edit-section {
      display: flex;
      flex-direction: column;
      gap: var(--mp-size--4, 16px);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--mp-size--2, 8px);
    }

    .form-group label {
      font-family: var(--mp-text-b-font-family, 'Work Sans', sans-serif);
      font-size: var(--mp-text-b3-font-size, 16px);
      font-weight: 600;
    }

    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="number"],
    input[type="date"] {
      padding: var(--mp-size--3, 12px);
      border: 2px solid var(--mp-color-main--60, #d0e1ff);
      border-radius: var(--mp-border-radius--1, 5px);
      font-family: var(--mp-text-b-font-family, 'Work Sans', sans-serif);
      font-size: var(--mp-text-b2-font-size, 18px);
      background: var(--mp-color-light--100, #fff);
      transition: border-color 0.2s ease;
    }

    input:focus {
      outline: none;
      border-color: var(--mp-color-main--100, #b2cdff);
    }

    textarea {
      padding: var(--mp-size--3, 12px);
      border: 2px solid var(--mp-color-main--60, #d0e1ff);
      border-radius: var(--mp-border-radius--1, 5px);
      font-family: var(--mp-text-b-font-family, 'Work Sans', sans-serif);
      font-size: var(--mp-text-b2-font-size, 18px);
      min-height: 200px;
      resize: vertical;
      background: var(--mp-color-light--100, #fff);
    }

    textarea:focus {
      outline: none;
      border-color: var(--mp-color-main--100, #b2cdff);
    }

    button {
      padding: var(--mp-size--3, 12px) var(--mp-size--5, 20px);
      background-color: var(--mp-color-main--100, #b2cdff);
      border: 2px solid transparent;
      border-radius: var(--mp-border-radius--1, 5px);
      font-family: var(--mp-text-h5-font-family, 'Raleway', serif);
      font-size: var(--mp-text-h5-font-size, 20px);
      font-weight: var(--mp-text-h5-font-weight, 400);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    button:hover {
      background-color: var(--mp-color-main--80, #c1d7ff);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button.secondary {
      background-color: var(--mp-color-secondary--100, #f4d18f);
    }

    button.secondary:hover {
      background-color: var(--mp-color-secondary--80, #f6daa5);
    }

    button.logout {
      background-color: var(--mp-color-dark--20, #ccc);
    }

    .image-upload {
      display: flex;
      flex-direction: column;
      gap: var(--mp-size--3, 12px);
    }

    .image-upload input[type="file"] {
      display: none;
    }

    .image-upload label {
      display: inline-block;
      padding: var(--mp-size--3, 12px) var(--mp-size--5, 20px);
      background-color: var(--mp-color-main--100, #b2cdff);
      border-radius: var(--mp-border-radius--1, 5px);
      cursor: pointer;
      font-family: var(--mp-text-h5-font-family, 'Raleway', serif);
      font-size: var(--mp-text-h5-font-size, 20px);
      font-weight: var(--mp-text-h5-font-weight, 400);
      text-align: center;
    }

    .image-upload label:hover {
      background-color: var(--mp-color-main--80, #c1d7ff);
    }

    .image-preview {
      max-width: 300px;
      border-radius: var(--mp-border-radius--1, 5px);
    }

    .upload-progress {
      background: var(--mp-color-main--30, #e7f0ff);
      border-radius: var(--mp-border-radius--1, 5px);
      padding: var(--mp-size--2, 8px);
      font-size: var(--mp-text-c1-font-size, 16px);
    }

    .multi-input-section {
      border: 1px solid var(--mp-color-main--40, #e0ebff);
      border-radius: var(--mp-border-radius--1, 5px);
      padding: var(--mp-size--4, 16px);
      background: var(--mp-color-main--10, #f7faff);
    }

    .multi-input-section h4 {
      margin: 0 0 var(--mp-size--3, 12px) 0;
      font-family: var(--mp-text-h-font-family, 'Raleway', serif);
      font-size: var(--mp-text-h4-font-size, 26px);
      font-weight: var(--mp-text-h4-font-weight, 600);
    }

    .multi-input-item {
      display: flex;
      gap: var(--mp-size--2, 8px);
      margin-bottom: var(--mp-size--2, 8px);
      align-items: center;
    }

    .multi-input-item input {
      flex: 1;
    }

    .multi-input-controls {
      display: flex;
      gap: var(--mp-size--2, 8px);
      margin-top: var(--mp-size--3, 12px);
    }

    .multi-input-controls button {
      padding: var(--mp-size--2, 8px) var(--mp-size--4, 16px);
      font-size: var(--mp-text-b3-font-size, 16px);
    }

    .status-message {
      padding: var(--mp-size--4, 16px);
      border-radius: var(--mp-border-radius--1, 5px);
      text-align: center;
      font-family: var(--mp-text-b-font-family, 'Work Sans', sans-serif);
      font-size: var(--mp-text-b2-font-size, 18px);
    }

    .status-message.success {
      background-color: #d4edda;
      color: #155724;
    }

    .status-message.error {
      background-color: #f8d7da;
      color: #721c24;
    }

    .status-message.loading {
      background-color: var(--mp-color-main--30, #e7f0ff);
      color: var(--mp-color-dark--80, #333);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: var(--mp-size--4, 16px);
      margin-bottom: var(--mp-size--4, 16px);
      padding: var(--mp-size--3, 12px);
      background: var(--mp-color-main--10, #f7faff);
      border-radius: var(--mp-border-radius--1, 5px);
    }

    .user-info span {
      flex: 1;
      font-family: var(--mp-text-c-font-family, 'Work Sans', sans-serif);
      font-size: var(--mp-text-c1-font-size, 16px);
    }

    [hidden] {
      display: none !important;
    }

    @media only screen and (max-width: 660px) {
      header h2 {
        font-size: var(--mp-text-h2-mobile-font-size, 26px);
      }

      .auth-section h2 {
        font-size: var(--mp-text-h3-mobile-font-size, 22px);
      }

      .type-toggle {
        flex-direction: column;
        width: 100%;
      }

      .type-toggle button {
        width: 100%;
      }
    }

    @media (prefers-color-scheme: dark) {
      header h2 {
        color: var(--mp-color-light--100, #fff);
      }

      .auth-section {
        background: var(--mp-color-dark--80, #333);
      }

      .auth-section h2 {
        color: var(--mp-color-light--100, #fff);
      }

      input[type="text"],
      input[type="email"],
      input[type="password"],
      input[type="number"],
      input[type="date"],
      textarea {
        background: var(--mp-color-dark--70, #4c4c4c);
        color: var(--mp-color-light--100, #fff);
        border-color: var(--mp-color-dark--50, #7f7f7f);
      }

      .form-group label {
        color: var(--mp-color-light--100, #fff);
      }

      .multi-input-section {
        background: var(--mp-color-dark--80, #333);
        border-color: var(--mp-color-dark--60, #666);
      }

      .multi-input-section h4 {
        color: var(--mp-color-light--100, #fff);
      }

      .user-info {
        background: var(--mp-color-dark--80, #333);
      }

      .user-info span {
        color: var(--mp-color-light--100, #fff);
      }
    }
  `;

  // Firebase instances
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private storage: FirebaseStorage | null = null;

  // Properties
  @property({ type: String }) contentType: ContentType = 'recensie';

  // State
  @state() private user: User | null = null;
  @state() private email = '';
  @state() private password = '';
  @state() private submitState: SubmitState = 'idle';
  @state() private errorMessage = '';
  @state() private uploadProgress = 0;
  @state() private uploadedImageUrl = '';

  // Review form state
  @state() private reviewData: ReviewData = {
    title: '',
    name: '',
    review: '',
    reviewDate: '',
    groups: [{ id: '', name: '' }],
    writers: [{ id: '', name: '' }],
    directors: [{ id: '', name: '' }],
    actors: [{ id: '', name: '' }],
    theater: null,
    city: null,
    year: new Date().getFullYear(),
    images: []
  };

  // Interview form state
  @state() private interviewData: InterviewData = {
    title: '',
    interview: '',
    interviewDate: '',
    persons: [{ id: '', name: '' }],
    year: new Date().getFullYear(),
    images: []
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    // Initialize Firebase app if not already initialized
    if (getApps().length === 0) {
      this.app = initializeApp(firebaseConfig);
    } else {
      this.app = getApps()[0];
    }

    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);

    // Listen to auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
    });
  }

  private async handleSignIn(): Promise<void> {
    if (!this.auth || !this.email || !this.password) return;

    this.submitState = 'submitting';
    this.errorMessage = '';

    try {
      await signInWithEmailAndPassword(this.auth, this.email, this.password);
      this.submitState = 'idle';
      this.password = '';
    } catch (error) {
      this.submitState = 'error';
      this.errorMessage = error instanceof Error ? error.message : 'Aanmelden mislukt';
    }
  }

  private handleSignOut(): void {
    if (!this.auth) return;
    this.auth.signOut();
    this.user = null;
  }

  private toggleContentType(): void {
    this.contentType = this.contentType === 'recensie' ? 'interview' : 'recensie';
  }

  private async handleImageUpload(e: Event): Promise<void> {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file || !this.storage) return;

    const timestamp = Date.now();
    const storageRef = ref(this.storage, `${this.contentType}/${file.name}_${timestamp}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      },
      (error) => {
        console.error('Upload error:', error);
        this.errorMessage = 'Er gaat iets verkeerd met het uploaden';
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        this.uploadedImageUrl = downloadUrl;
        this.uploadProgress = 0;

        // Add to current content type's images
        if (this.contentType === 'recensie') {
          this.reviewData = {
            ...this.reviewData,
            images: [...this.reviewData.images, downloadUrl]
          };
        } else {
          this.interviewData = {
            ...this.interviewData,
            images: [...this.interviewData.images, downloadUrl]
          };
        }
      }
    );
  }

  private updateReviewField(field: keyof ReviewData, value: unknown): void {
    this.reviewData = {
      ...this.reviewData,
      [field]: value
    };
  }

  private updateInterviewField(field: keyof InterviewData, value: unknown): void {
    this.interviewData = {
      ...this.interviewData,
      [field]: value
    };
  }

  private addMultiInputItem(field: 'groups' | 'writers' | 'directors' | 'actors' | 'persons'): void {
    if (field === 'persons') {
      this.interviewData = {
        ...this.interviewData,
        persons: [...this.interviewData.persons, { id: '', name: '' }]
      };
    } else {
      this.reviewData = {
        ...this.reviewData,
        [field]: [...(this.reviewData[field] as Person[]), { id: '', name: '' }]
      };
    }
  }

  private removeMultiInputItem(field: 'groups' | 'writers' | 'directors' | 'actors' | 'persons', index: number): void {
    if (field === 'persons') {
      const newPersons = [...this.interviewData.persons];
      newPersons.splice(index, 1);
      this.interviewData = {
        ...this.interviewData,
        persons: newPersons.length > 0 ? newPersons : [{ id: '', name: '' }]
      };
    } else {
      const items = this.reviewData[field] as Person[];
      const newItems = [...items];
      newItems.splice(index, 1);
      this.reviewData = {
        ...this.reviewData,
        [field]: newItems.length > 0 ? newItems : [{ id: '', name: '' }]
      };
    }
  }

  private updateMultiInputItem(
    field: 'groups' | 'writers' | 'directors' | 'actors' | 'persons',
    index: number,
    value: string
  ): void {
    const id = value.toLowerCase().replace(/\s+/g, '-');
    if (field === 'persons') {
      const newPersons = [...this.interviewData.persons];
      newPersons[index] = { id, name: value };
      this.interviewData = {
        ...this.interviewData,
        persons: newPersons
      };
    } else {
      const items = this.reviewData[field] as Person[];
      const newItems = [...items];
      newItems[index] = { id, name: value };
      this.reviewData = {
        ...this.reviewData,
        [field]: newItems
      };
    }
  }

  private async handleSubmit(): Promise<void> {
    if (!this.db || !this.user) return;

    this.submitState = 'submitting';
    this.errorMessage = '';

    try {
      if (this.contentType === 'recensie') {
        // Filter out empty entries and validate
        const filteredData = {
          ...this.reviewData,
          groups: this.reviewData.groups.filter(g => g.name.trim() !== ''),
          writers: this.reviewData.writers.filter(w => w.name.trim() !== ''),
          directors: this.reviewData.directors.filter(d => d.name.trim() !== ''),
          actors: this.reviewData.actors.filter(a => a.name.trim() !== ''),
          timePublished: serverTimestamp()
        };

        await addDoc(collection(this.db, 'reviews'), filteredData);
      } else {
        const filteredData = {
          ...this.interviewData,
          persons: this.interviewData.persons.filter(p => p.name.trim() !== ''),
          timePublished: serverTimestamp()
        };

        await addDoc(collection(this.db, 'interviews'), filteredData);
      }

      this.submitState = 'success';
      this.resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      this.submitState = 'error';
      this.errorMessage = error instanceof Error ? error.message : 'Er ging iets mis bij het opslaan';
    }
  }

  private resetForm(): void {
    this.reviewData = {
      title: '',
      name: '',
      review: '',
      reviewDate: '',
      groups: [{ id: '', name: '' }],
      writers: [{ id: '', name: '' }],
      directors: [{ id: '', name: '' }],
      actors: [{ id: '', name: '' }],
      theater: null,
      city: null,
      year: new Date().getFullYear(),
      images: []
    };
    this.interviewData = {
      title: '',
      interview: '',
      interviewDate: '',
      persons: [{ id: '', name: '' }],
      year: new Date().getFullYear(),
      images: []
    };
    this.uploadedImageUrl = '';
  }

  private renderAuthSection() {
    return html`
      <section class="auth-section">
        <h2>Aanmelden</h2>
        <form class="auth-form" @submit=${(e: Event) => { e.preventDefault(); this.handleSignIn(); }}>
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              .value=${this.email}
              @input=${(e: Event) => this.email = (e.target as HTMLInputElement).value}
              placeholder="email@voorbeeld.nl"
              required
            />
          </div>
          <div class="form-group">
            <label for="password">Wachtwoord</label>
            <input
              type="password"
              id="password"
              .value=${this.password}
              @input=${(e: Event) => this.password = (e.target as HTMLInputElement).value}
              placeholder="Wachtwoord"
              required
            />
          </div>
          <button type="submit" ?disabled=${this.submitState === 'submitting' || !this.email || !this.password}>
            ${this.submitState === 'submitting' ? 'Bezig...' : 'Aanmelden'}
          </button>
        </form>
        ${this.errorMessage ? html`<div class="status-message error">${this.errorMessage}</div>` : ''}
      </section>
    `;
  }

  private renderMultiInputSection(
    title: string,
    field: 'groups' | 'writers' | 'directors' | 'actors' | 'persons',
    items: Person[],
    placeholder: string
  ) {
    return html`
      <div class="multi-input-section">
        <h4>${title}</h4>
        ${items.map((item, index) => html`
          <div class="multi-input-item">
            <input
              type="text"
              .value=${item.name}
              @input=${(e: Event) => this.updateMultiInputItem(field, index, (e.target as HTMLInputElement).value)}
              placeholder="${placeholder} ${index + 1}"
            />
            ${items.length > 1 ? html`
              <button type="button" @click=${() => this.removeMultiInputItem(field, index)}>-</button>
            ` : ''}
          </div>
        `)}
        <div class="multi-input-controls">
          <button type="button" @click=${() => this.addMultiInputItem(field)}>+ Toevoegen</button>
        </div>
      </div>
    `;
  }

  private renderReviewForm() {
    return html`
      <section class="edit-section">
        <div class="form-group">
          <label for="review-title">Titel</label>
          <input
            type="text"
            id="review-title"
            .value=${this.reviewData.title}
            @input=${(e: Event) => this.updateReviewField('title', (e.target as HTMLInputElement).value)}
            placeholder="Titel van de voorstelling"
          />
        </div>

        <div class="form-group">
          <label for="review-name">Naam</label>
          <input
            type="text"
            id="review-name"
            .value=${this.reviewData.name}
            @input=${(e: Event) => this.updateReviewField('name', (e.target as HTMLInputElement).value)}
            placeholder="Naam van de productie"
          />
        </div>

        <div class="form-group">
          <label for="review-date">Recensie datum</label>
          <input
            type="date"
            id="review-date"
            .value=${this.reviewData.reviewDate}
            @input=${(e: Event) => this.updateReviewField('reviewDate', (e.target as HTMLInputElement).value)}
          />
        </div>

        <div class="form-group">
          <label for="review-year">Jaar</label>
          <input
            type="number"
            id="review-year"
            .value=${String(this.reviewData.year)}
            @input=${(e: Event) => this.updateReviewField('year', parseInt((e.target as HTMLInputElement).value) || new Date().getFullYear())}
            placeholder="Jaar"
            min="1900"
            max="2100"
          />
        </div>

        <div class="form-group">
          <label for="review-theater">Theater</label>
          <input
            type="text"
            id="review-theater"
            .value=${this.reviewData.theater?.name || ''}
            @input=${(e: Event) => {
              const name = (e.target as HTMLInputElement).value;
              this.updateReviewField('theater', name ? { id: name.toLowerCase().replace(/\s+/g, '-'), name } : null);
            }}
            placeholder="Naam van het theater"
          />
        </div>

        <div class="form-group">
          <label for="review-city">Stad</label>
          <input
            type="text"
            id="review-city"
            .value=${this.reviewData.city?.name || ''}
            @input=${(e: Event) => {
              const name = (e.target as HTMLInputElement).value;
              this.updateReviewField('city', name ? { id: name.toLowerCase().replace(/\s+/g, '-'), name } : null);
            }}
            placeholder="Stad"
          />
        </div>

        ${this.renderMultiInputSection('Gezelschappen', 'groups', this.reviewData.groups, 'Gezelschap')}
        ${this.renderMultiInputSection('Schrijvers', 'writers', this.reviewData.writers, 'Schrijver')}
        ${this.renderMultiInputSection('Regisseurs', 'directors', this.reviewData.directors, 'Regisseur')}
        ${this.renderMultiInputSection('Acteurs', 'actors', this.reviewData.actors, 'Acteur')}

        <div class="image-upload">
          <label for="review-image">Upload afbeelding</label>
          <input
            type="file"
            id="review-image"
            accept="image/*"
            @change=${this.handleImageUpload}
          />
          ${this.uploadProgress > 0 ? html`
            <div class="upload-progress">Upload: ${Math.round(this.uploadProgress)}%</div>
          ` : ''}
          ${this.reviewData.images.length > 0 ? html`
            ${this.reviewData.images.map(url => html`
              <img class="image-preview" src=${url} alt="Preview" />
            `)}
          ` : ''}
        </div>

        <div class="form-group">
          <label for="review-content">Recensie (HTML)</label>
          <textarea
            id="review-content"
            .value=${this.reviewData.review}
            @input=${(e: Event) => this.updateReviewField('review', (e.target as HTMLTextAreaElement).value)}
            placeholder="Schrijf hier de recensie..."
          ></textarea>
        </div>

        <button
          type="button"
          @click=${this.handleSubmit}
          ?disabled=${this.submitState === 'submitting'}
        >
          ${this.submitState === 'submitting' ? 'Opslaan...' : 'Opslaan'}
        </button>
      </section>
    `;
  }

  private renderInterviewForm() {
    return html`
      <section class="edit-section">
        <div class="form-group">
          <label for="interview-title">Titel</label>
          <input
            type="text"
            id="interview-title"
            .value=${this.interviewData.title}
            @input=${(e: Event) => this.updateInterviewField('title', (e.target as HTMLInputElement).value)}
            placeholder="Titel van het interview"
          />
        </div>

        <div class="form-group">
          <label for="interview-date">Interview datum</label>
          <input
            type="date"
            id="interview-date"
            .value=${this.interviewData.interviewDate}
            @input=${(e: Event) => this.updateInterviewField('interviewDate', (e.target as HTMLInputElement).value)}
          />
        </div>

        <div class="form-group">
          <label for="interview-year">Jaar</label>
          <input
            type="number"
            id="interview-year"
            .value=${String(this.interviewData.year)}
            @input=${(e: Event) => this.updateInterviewField('year', parseInt((e.target as HTMLInputElement).value) || new Date().getFullYear())}
            placeholder="Jaar"
            min="1900"
            max="2100"
          />
        </div>

        ${this.renderMultiInputSection('Personen', 'persons', this.interviewData.persons, 'Persoon')}

        <div class="image-upload">
          <label for="interview-image">Upload afbeelding</label>
          <input
            type="file"
            id="interview-image"
            accept="image/*"
            @change=${this.handleImageUpload}
          />
          ${this.uploadProgress > 0 ? html`
            <div class="upload-progress">Upload: ${Math.round(this.uploadProgress)}%</div>
          ` : ''}
          ${this.interviewData.images.length > 0 ? html`
            ${this.interviewData.images.map(url => html`
              <img class="image-preview" src=${url} alt="Preview" />
            `)}
          ` : ''}
        </div>

        <div class="form-group">
          <label for="interview-content">Interview (HTML)</label>
          <textarea
            id="interview-content"
            .value=${this.interviewData.interview}
            @input=${(e: Event) => this.updateInterviewField('interview', (e.target as HTMLTextAreaElement).value)}
            placeholder="Schrijf hier het interview..."
          ></textarea>
        </div>

        <button
          type="button"
          @click=${this.handleSubmit}
          ?disabled=${this.submitState === 'submitting'}
        >
          ${this.submitState === 'submitting' ? 'Opslaan...' : 'Opslaan'}
        </button>
      </section>
    `;
  }

  override render() {
    // If not authenticated, show login form
    if (!this.user) {
      return this.renderAuthSection();
    }

    return html`
      <main>
        <div class="user-info">
          <span>Aangemeld als: ${this.user.email}</span>
          <button class="logout" @click=${this.handleSignOut}>Uitloggen</button>
        </div>

        <header>
          <h2>${this.contentType === 'recensie' ? 'Recensie toevoegen' : 'Interview toevoegen'}</h2>
          <div class="type-toggle">
            <button
              class=${this.contentType === 'recensie' ? '' : 'secondary'}
              @click=${() => this.contentType = 'recensie'}
            >
              Recensie
            </button>
            <button
              class=${this.contentType === 'interview' ? '' : 'secondary'}
              @click=${() => this.contentType = 'interview'}
            >
              Interview
            </button>
          </div>
        </header>

        ${this.submitState === 'success' ? html`
          <div class="status-message success">
            ${this.contentType === 'recensie' ? 'Recensie' : 'Interview'} is succesvol opgeslagen!
          </div>
        ` : ''}

        ${this.submitState === 'error' && this.errorMessage ? html`
          <div class="status-message error">${this.errorMessage}</div>
        ` : ''}

        ${this.contentType === 'recensie' ? this.renderReviewForm() : this.renderInterviewForm()}
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-add-content': MpAddContent;
  }
}

// Default export for Astro client:only directive
export default MpAddContent;
