import { MPElement, html } from '../mp-element/mp-element';
import { css } from './mp-add-content.css.js';
import '../mp-page/mp-page';
import '../mp-auth/mp-auth';

class MPAddContent extends MPElement {
  static get properties() {
    return {
      recensie: {
        observe: true,
        defaultValue: {},
      },
      interview: {
        observe: true,
        defaultValue: {},
      },
      contentType: {
        observe: true,
        defaultValue: 'recensie',
      },
      authToken: {
        observe: true,
        defaultValue: null,
        changedHandler: '_handleAuthTokenChanged',
      },
      writers: {
        observe: true,
        DOM: true,
        defaultValue: [1]
      }
    };
  }

  get styles() {
    return html`<style>
      ${css}
    </style>`;
  }

  constructor() {
    super();
    this._loadStorageScripts();
  }

  _loadStorageScripts() {
    this._addScript("https://www.gstatic.com/firebasejs/7.23.0/firebase-app.js", () => {
      firebase.initializeApp({
        apiKey: "AIzaSyC8em8nKNhnyhDFrj4_pTrRpGy8nmNxh8k",
        authDomain: "margriet-prinssen.firebaseapp.com",
        projectId: "margriet-prinssen",
        storageBucket: "margriet-prinssen.appspot.com",
        appId: "1:840668873185:web:fc66cab4b29d56940052a0"
      });
      this._addScript("https://www.gstatic.com/firebasejs/7.23.0/firebase-storage.js");
      this._addScript("https://www.gstatic.com/firebasejs/7.23.0/firebase-auth.js");
    });
  }

  _addScript( src, callback ) {
    var s = document.createElement( 'script' );
    s.setAttribute( 'src', src );
    s.onload=callback;
    document.body.appendChild( s );
  }

  _handleAuthTokenChanged(oldVal, newVal) {
    if (!newVal) return;
    import('../mp-textarea/mp-textarea.js');
    import('../mp-input/mp-input.js');
    import('../mp-button/mp-button.js');
    this.editing = true;
  }

  _parseUndefined(str) {
    return str ? str : '';
  }

  _increaseWriters() {
    const writers = [...this.writers];
    writers.push(this.writers.length +1);
    this.writers = writers;
  }

  _decreaseWriters() {
    const lastIndex = this.writers.length;
    delete this[this.contentType][`writer-${lastIndex}`];
    const writers = [...this.writers];
    writers.splice(writers.length -1, writers.length);
    this.writers = writers;
  }

  async handleImageInput(e) {
    const type = e.target.dataset['type'];
    const file = e.target.files[0];
    var storageRef = firebase.storage().ref();
    var imgRef = storageRef.child(`${this.contentType}/${file.name}_${Date.now()}`);
    const uploadTask = imgRef.put(file);
    uploadTask.on('state_changed', snapshot => {
      // Observe state change events such as progress, pause, and resume
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
      var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
      switch (snapshot.state) {
        case firebase.storage.TaskState.PAUSED: // or 'paused'
          console.log('Upload is paused');
          break;
        case firebase.storage.TaskState.RUNNING: // or 'running'
          console.log('Upload is running');
          break;
      }
    }, error => {
      // Handle unsuccessful uploads
      console.log(error)
      window.alert('Er gaat iets verkeerd met het uploaden')
    }, async res => {
      // Handle successful uploads on complete
      // For instance, get the download URL: https://firebasestorage.googleapis.com/...

      const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
      console.log(downloadUrl)
      
      this.downloadUrl = downloadUrl;
      super.render();
    });
  }

  async patchDocument() {
    if (!this.authToken) return;
    const resp = await fetch(
      `https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents/reviews/${this.recensieId}?updateMask.fieldPaths=review&updateMask.fieldPaths=reviewDate&updateMask.fieldPaths=name&updateMask.fieldPaths=title&currentDocument.exists=true&access_token=${this.authToken}&alt=json`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          fields: {
            review: {
              stringValue: this.recensie.review,
            },
            title: {
              stringValue: this.recensie.title,
            },
            name: {
              stringValue: this.recensie.name,
            },
            reviewDate: {
              stringValue: this.recensie.reviewDate,
            },
          },
        }),
      }
    ).catch(e => console.log(e));
  }

  _handleInput(evt, propName) {
    this[this.contentType][propName] = evt.target.value;
    this.render();
  }

  get _getOppositeContentType() {
    return this.contentType === 'recensie' ? 'interview' : 'recensie';
  }
  
  _setOppositeContentType() {
    this.contentType = this._getOppositeContentType;
  }

  setVal(e) {
    const type = e.target.dataset['type'];
    const val = e.target.value;
    this[this.contentType][type] = val
  }

  get _getDynamicContent() {
    return html`
      <section>
        <h3>Writers</h3>
        ${this.writers.map((item, num) => {
          const num_from_one = num + 1;
          return html`
            <h4>Writer ${num_from_one}</h4>
            <mp-input @input=${this.setVal} data-type="${`writer-${num_from_one}`}" placeholder="${`writer-${num_from_one}`}"></mp-input>
          `
        })}

        <div>
          <mp-button @click="${this._increaseWriters}">+ 1</mp-button>
          <mp-button @click="${this._decreaseWriters}">- 1</mp-button>
        </div>
      </section>
    `

  }

  get template() {
    return html`
      ${this.styles}
      
      <main>
        <header>
          <h2>${this.contentType}</h2>
          <mp-button @click="${this._setOppositeContentType}">Switch to ${this._getOppositeContentType}</mp-button>
        </header>

        <section class="edit-section" ?hidden=${!this.authToken || this.contentType !== 'recensie'}>
          <img ?hidden="${!this.downloadUrl}" src="${this.downloadUrl}">
          <input @input=${this.handleImageInput} id="recensie-btn" class="input-button" data-type="plaatje" type="file" placeholder="Plaatje">
          <label for="recensie-btn">Upload plaatje</label>
          <mp-textarea
            placeholder="Recensie"
            @input=${e => this._handleInput(e, 'review')}
          ></mp-textarea>
          <mp-input
            placeholder="Titel"
            @input=${e => this._handleInput(e, 'title')}
          ></mp-input>
          <mp-input
            placeholder="Recensie datum"
            @input=${e => this._handleInput(e, 'reviewDate')}
          ></mp-input>
          <mp-input
            placeholder="Naam"
            @input=${e => this._handleInput(e, 'name')}
          ></mp-input>

          ${this._getDynamicContent}

          <mp-button @click=${this.patchDocument}>Sla op</mp-button>
        </section>

        <section class="edit-section" ?hidden=${!this.authToken || this.contentType !== 'interview'}>
            <img ?hidden="${!this.downloadUrl}" src="${this.downloadUrl}">
            <input @input=${this.handleImageInput} id="interview-btn" class="input-button" data-type="plaatje" type="file" placeholder="Plaatje">
            <label for="interview-btn">Upload plaatje</label>
            <mp-textarea
              placeholder="Interview"
              @input=${e => this._handleInput(e, 'interview')}
            ></mp-textarea>
            <mp-input
              placeholder="Titel"
              @input=${e => this._handleInput(e, 'title')}
            ></mp-input>
            <mp-input
              placeholder="Interview datum"
              @input=${e => this._handleInput(e, 'interviewDate')}
            ></mp-input>
            <mp-button @click=${this.patchDocument}>Sla op</mp-button>
        </section>  
        
      </main>
    `;
  }
}

window.customElements.define('mp-add-content', MPAddContent);
