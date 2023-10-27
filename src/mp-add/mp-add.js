import { MPElement, html } from '../mp-element/mp-element.js';
import { css } from './mp-add.css.js';
import '../mp-button/mp-button'
import '../mp-input/mp-input'
import '../mp-textarea/mp-textarea'
import FireStoreParser from 'firestore-parser/index';
import { generateUUID } from '../utils/uuid.js';

class MPAdd extends MPElement {
  #imageUrl;
  #interviewImgUrl;
  static get properties() {
    return {
      authToken: {
        observe: true,
        defaultValue: null,
        changedHandler: 'authTokenChangedHandler'
      },
      cities: {
        observe: true,
        defaultValue: []
      },
      theaters: {
        observe: true,
        defaultValue: {}
      },
      groups: {
        observe: true,
        defaultValue: []
      },
      personName: {
        observe: true,
        defaultValue: ''
      },
      theaterName: {
        observe: true,
        defaultValue: ''
      },
      cityName: {
        observe: true,
        defaultValue: ''
      },
      theaterName: {
        observe: true,
        defaultValue: ''
      },
      review: {
        observe: true,
        defaultValue: ''
      },
      title: {
        observe: true,
        defaultValue: ''
      },
      name: {
        observe: true,
        defaultValue: ''
      },
      reviewDate: {
        observe: true,
        defaultValue: ''
      },
    };
  }

  constructor() {
    super()
    this.cities = [];
    this.selectedActors = [];

  }

  async #initForm() {
    const form = this.shadowRoot.querySelector('form');
    const reviewForm = this.shadowRoot.getElementById('review-form');
    const interviewForm = this.shadowRoot.getElementById('interview-form');
    // Wait for controls to be defined before attaching form listeners
    await Promise.all([
      customElements.whenDefined('sl-button'),
      customElements.whenDefined('sl-input'),
      customElements.whenDefined('sl-option'),
      customElements.whenDefined('sl-select'),
      customElements.whenDefined('sl-textarea')
    ]).then(() => {
      reviewForm.addEventListener('submit', event => {
        event.preventDefault();

        this.addReview();
      });
      interviewForm.addEventListener('submit', event => {
        event.preventDefault();

        this.addInterview();
      });
    });
  }
  async authTokenChangedHandler(oldValue, newValue) {
    if(newValue) {
    this.persons = await this.#getPersons('persons');
    const cities = await this.#getPersons('cities');
    this.cities = cities.sort((a, b) => a.name.localeCompare(b.name) ); 
    this.groups = await this.#getPersons('groups');
    this.theaters = await this.#getPersons('theaters');
    console.log(this.persons, this.cities, this.groups, this.theaters)
    this.#initForm()

    }
  }

  async #getPersons(collectionName) {
    let nextPageToken ;
    const list = [];
    let firstRun = true;
    do {
      const url = `https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents/${collectionName}`
      + (nextPageToken ? `?pageToken=${nextPageToken}&pageSize=300` : '?pageSize=300');
      
      const resp = await fetch(url);
      const data = await resp.json();
      
      if (data.documents) {
        data.documents.forEach(doc => {
          const parsedDoc = FireStoreParser(doc).fields || {};
          list.push(parsedDoc);
        });
      }
      
      nextPageToken = data.nextPageToken;
      firstRun = false;
    } while (nextPageToken && !firstRun);
    return list.sort((a, b) => a.name.localeCompare(b.name) );
  }


  async addInterview() {    
    if (!this.authToken) return;
    const resp = await fetch(
      `https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents/interviews?access_token=${this.authToken}&alt=json`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          fields: {            
            interview: {
              stringValue: this.interview,
            },
            interviewDate: {
              stringValue: `${new Date(this.interviewDate).getMonth()}-${new Date(this.interviewDate).getFullYear()}`,
            },
            year: {
              stringValue: new Date(this.interviewDate).getFullYear().toString(),
            },
            timeAdded: {
              integerValue: new Date().getTime(),
            },
            timeInterviewed: {
              integerValue: new Date(this.interviewDate).getTime(),
            },
            title: {
              stringValue: this.titleInterview,
            },
            images: {
              arrayValue: {
                values: [{stringValue: this.#interviewImgUrl}],
              }
            },
            persons: {
              arrayValue: {
                values: this.#arrayToMapValues(this.interviewees || []),
              }
            },
          }
        }),
      }
      ).catch(e => 
        {
          window.alert('Er is iets misgegaan bij het uploaden van de recensie', e.message)
        });
      console.log({resp})
  }  
  async addReview() {    
    if (!this.authToken) return;
    const resp = await fetch(
      `https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents/reviews?access_token=${this.authToken}&alt=json`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          fields: {

            review: {
              stringValue: this.review,
            },
            title: {
              stringValue: this.title,
            },
            name: {
              stringValue: this.name,
            },
            timeAdded: {
              integerValue: new Date().getTime(),
            },
            timePerformed: {
              integerValue: new Date(this.reviewDate).getTime(),
            },
            reviewDate: {
              stringValue: this.reviewDate,
            },
            images: {
              arrayValue: {
                values: [{stringValue: this.#imageUrl}],
              }
            },

            city: {
              mapValue: {
                fields: {
                  name: {
                    stringValue: this.city.name,
                  },
                  id: {
                    stringValue: this.city.id,
                  }
                }
              }
            },
            theater: {
              mapValue: {
                fields: {
                  name: {
                    stringValue: this.theater.name,
                  },
                  id: {
                    stringValue: this.theater.id,
                  }
                }
              }
            },
            groups: {
              arrayValue: {
                values: this.#arrayToMapValues(this.selectedGroups)
              }
            },
            actors: {
              arrayValue: {
                values: this.#arrayToMapValues(this.selectedActors)
              }
            },
            directors: {
              arrayValue: {
                values: this.#arrayToMapValues(this.selectedDirectors),
              }
            },
            writers: {
              arrayValue: {
                values: this.#arrayToMapValues(this.selectedWriters),
              }
            },
          }
        }),
      }
      ).catch(e => 
        {
          window.alert('Er is iets misgegaan bij het uploaden van de recensie', e.message)
        });
      console.log({resp})
  }  

  #arrayToMapValues(arr) {
    if(!arr) return [];
    return arr.map(item => {
      return {
        mapValue: {
          fields: {
            name: {
              stringValue: item.name,
            },
            id: {
              stringValue: item.id,
            }
          }
        }
      }
    })

  }



  async addhDocument(collection, name) {
    if (!this.authToken) return;
    const uuid = generateUUID();
    console.log(uuid)
    const resp = await fetch(
      `https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents/${collection}/${uuid}?updateMask.fieldPaths=name&updateMask.fieldPaths=id&currentDocument.exists=false&access_token=${this.authToken}&alt=json`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          fields: {
            name: {
              stringValue: name,
            },
            id: {
              stringValue: uuid,
            },
          },
        }),
      }
    ).catch(e => console.log(e));
    this.shadowRoot.getElementById(`${collection}-input`).value = '';
  }

  async uploadToFirebase(fileBinary, firebasePath) {
    const url = `https://firebasestorage.googleapis.com/v0/b/margriet-prinssen.appspot.com/o/${encodeURIComponent(firebasePath)}`;
    const headers = {
        "Content-Type": "image/png",
        "Authorization": `Bearer ${this.authToken}` // Add the Authorization header
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: fileBinary
    });
    console.log(response)
    if (!response.ok) throw new Error('Failed to upload to Firebase');
    return response.json();
  };


  generateRandomId(length = 5) {
    return Math.random().toString(36).substr(2, length);
  }

  getFilenameWithRandomId(file) {
    const fileExtension = file.name.split('.').pop();
    const fileNameWithoutExtension = file.name.replace(`.${fileExtension}`, '');
    return `${fileNameWithoutExtension}-${this.generateRandomId()}.${fileExtension}`;
  }

  getDownloadURL(projectId, filePath) {
    return `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/${encodeURIComponent(filePath)}?alt=media`;

  }

  async readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = event => resolve(event.target.result);
      reader.onerror = error => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

   async handleFileUpload(event, collection) {
    const file = event.target.files[0];
    const filename = this.getFilenameWithRandomId(file);
    const firebasePath = `${collection}/${filename}`;
    
    console.log(`Uploading file ${filename} to Firebase as ${firebasePath}`)

    try {
        const fileBinary = await this.readFileAsArrayBuffer(file);
        const res = await this.uploadToFirebase(fileBinary, firebasePath);
        const downloadURL = await this._getUrlFromUploadResult(res);
        if(collection === 'interviews') this.#interviewImgUrl = downloadURL;
        if(collection === 'review') this.#imageUrl = downloadURL;
        // const downloadURL = this.getDownloadURL('margriet-prinssen', firebasePath);
        console.log(`File uploaded! Download URL: ${downloadURL}`);
        this.render();
    } catch (error) {
        window.alert('Er is iets misgegaan bij het uploaden van het bestand', error.message)
        console.error('Error:', error.message);
    }
  };  

  async _getUrlFromUploadResult(result = {}) {
    const url = `https://firebasestorage.googleapis.com/v0/b/${result.bucket}/o/${result.name.replace('/', '%2F')}?alt=media&token=${result.downloadTokens}`;
    return url;
  }


  _handleInput(evt, propName) {
    this[propName] = evt.target.value;
    this.render();
  }

  get styles() {
    return html`<style>
      ${css}
    </style>`;
  }

  _handleSelect(e, collection, propToWrite) {  
    const matchingItem = this[collection].find(i => i.name === e.target.value.replaceAll('_', ' '));
    this[propToWrite] = matchingItem;
  }

  _handleMultiSelect(e, collection, propToWrite) {
    const items = e.target.value
    const objects = items.map(item => {
      const matchingItem = this[collection].find(i => i.name === item.replaceAll('_', ' '));
      return matchingItem;
    })
    this[propToWrite] = objects;
  }

  #handleReviewFormSubmmit(e) {
    e.preventDefault();
    console.log(e.target.formData)
  }
  get template() {
    return html`
      ${this.styles}

      <main>
      ${this.authToken ? html`

      <sl-tab-group>
        <sl-tab slot="nav" panel="reviews">Recensie</sl-tab>
        <sl-tab slot="nav" panel="interviews">Interview</sl-tab>
        <sl-tab slot="nav" panel="persons">Personen</sl-tab>
        <sl-tab slot="nav" panel="groups">Groepen</sl-tab>
        <sl-tab slot="nav" panel="cities">Steden</sl-tab>
        <sl-tab slot="nav" panel="theaters">Theaters</sl-tab>

        <sl-tab-panel name="reviews">
          <form id="review-form">
            <sl-select label="Acteurs" multiple clearable @sl-input=${e => this._handleMultiSelect(e, 'persons', 'selectedActors')}>
              ${this.persons && this.persons.map(person => html`<sl-option value="${person.name}">${person.name}</sl-option>`)}
            </sl-select>
            <sl-select label="Regisseurs" multiple clearable @sl-input=${e => this._handleMultiSelect(e, 'persons', 'selectedDirectors')}>
              ${this.persons && this.persons.map(person => html`<sl-option value="${person.name}">${person.name}</sl-option>`)}
            </sl-select>
            <sl-select label="Schrijvers" multiple clearable @sl-input=${e => this._handleMultiSelect(e, 'persons', 'selectedWriters')}>
              ${this.persons && this.persons.map(person => html`<sl-option value="${person.name}">${person.name}</sl-option>`)}
            </sl-select>

            ${this.cities && this.cities.length > 0 ? html`
              <sl-select label="Stad" @sl-input=${e => this._handleSelect(e, 'cities', 'city')}>
                ${this.cities.map(city => html`<sl-option value="${city.name}">${city.name}</sl-option>`)}
              </sl-select>
            ` : ''}

            ${this.theaters && this.theaters.length > 0 ? html`
              <sl-select label="Theater" @sl-input=${e => this._handleSelect(e, 'theaters', 'theater')}>
                ${this.theaters.map(theater => html`<sl-option value="${theater.name}">${theater.name}</sl-option>`)}
              </sl-select>
            ` : ''}

            ${this.groups && this.groups.length > 0 ? html`
              <sl-select label="Groepen" multiple clearable @sl-input=${e => this._handleMultiSelect(e, 'groups', 'selectedGroups')}>
                ${this.groups.map(group => html`<sl-option value="${group.name}">${group.name}</sl-option>`)}
              </sl-select>
            ` : ''}


            ${this.#imageUrl ? html`<img src="${this.#imageUrl}" />` : ''}
            <label>
              Afbeelding

              <input  type="file" placeholder="Plaatje" @input=${e => this.handleFileUpload(e, 'review')}>
            </label>
            <sl-input label="Datum opvoering" required type="date" placeholder="Date" @input=${e => this._handleInput(e, 'reviewDate')}></sl-input>
            <sl-input label="Titel" required @input=${e => this._handleInput(e, 'title')}></sl-input>
            <sl-input label="Naam recensie" required @input=${e => this._handleInput(e, 'name')}></sl-input>
            <sl-textarea label="Recensie" required rows="10" resize="none" @input=${e => this._handleInput(e, 'review')}></sl-textarea>
            <sl-details summary="Hoe kan ik styling toevoegen?">
              <i>voor alles geldt dat na de < er geen spatie moet zijn, maar dat kan ik het niet goed laten zien :D</i>
              <ol>
                <li>Eerste paragraaf, begin: < p class="intro-text">, eind: < /p></li>
                <li>Quote, begin: < blockquote>< p>, eind: < /p>< /blockquote></li>
                <li>Heading, begin: < h4>, eind: < /h4></li>
                <li>Afzonderlijke paragraaf, begin: < p>, eind: < /p></li>
                </ol>
            </sl-details>
            <sl-button type="submit" variant="primary">Submit</sl-button>
          </form>
        </sl-tab-panel>
        <sl-tab-panel name="interviews">
          <form  id="interview-form"> 
            <sl-select label="Personen" multiple clearable @sl-input=${e => this._handleMultiSelect(e, 'persons', 'interviewees')}>
              ${this.persons && this.persons.map(person => html`<sl-option value="${person.name}">${person.name}</sl-option>`)}
            </sl-select>
            
            ${this.#interviewImgUrl ? html`<img src="${this.#interviewImgUrl}" />` : ''}
            <label>
              Afbeelding
              <input label="Afbeelding" type="file" placeholder="Plaatje" @input=${e => this.handleFileUpload(e, 'interviews')}>
            </label>
            <sl-input label="Datum interview" required type="date" placeholder="" @input=${e => this._handleInput(e, 'interviewDate')}></sl-input>
            <sl-input label="Titel" required @input=${e => this._handleInput(e, 'titleInterview')}></sl-input>
            <sl-textarea label="Interview" required rows="10" resize="none" @input=${e => this._handleInput(e, 'interview')}></sl-textarea>
            <sl-details summary="Hoe kan ik styling toevoegen?">
              <i>voor alles geldt dat na de < er geen spatie moet zijn, maar dat kan ik het niet goed laten zien :D</i>
              <ol>
                <li>Eerste paragraaf, begin: < p class="intro-text">, eind: < /p></li>
                <li>Quote, begin: < blockquote>< p>, eind: < /p>< /blockquote></li>
                <li>Heading, begin: < h4>, eind: < /h4></li>
                <li>Afzonderlijke paragraaf, begin: < p>, eind: < /p></li>
                </ol>
            </sl-details>
            <sl-button type="submit" variant="primary">Submit</sl-button>
          </form>
        </sl-tab-panel>
        
        <sl-tab-panel name="persons">
          <p>Bekijk eerst of je 'm niet al kan vinden</p>
          <sl-select label="Acteurs" multiple clearable @sl-input=${e => this._handleMultiSelect(e, 'persons', 'selectedActors')}>
            ${this.persons && this.persons.map(person => html`<sl-option value="${person.name}">${person.name}</sl-option>`)}
          </sl-select>          
          <p>Zo niet, voeg dan toe :)</p>
          <sl-input label="Naam persoon" id="persons-input" @input=${e => this.personName = e.target.value}></sl-input>
          <sl-button @click=${e => this.addhDocument('persons', this.personName)}>Voeg toe</sl-button>
        </sl-tab-panel>

        <sl-tab-panel name="groups">
          <p>Bekijk eerst of je 'm niet al kan vinden</p>
          ${this.groups && this.groups.length > 0 ? html`
            <sl-select label="Groupen" multiple clearable @sl-input=${e => this._handleMultiSelect(e, 'groups', 'selectedGroups')}>
              ${this.groups.map(group => html`<sl-option value="${group.name}">${group.name}</sl-option>`)}
            </sl-select>
          ` : ''}  
          <p>Zo niet, voeg dan toe :)</p>
          <sl-input label="Naam groep" id="theaters-input" @input=${e => this.theaterName = e.target.value}></sl-input>
          <sl-button @click=${e => this.addhDocument('theaters', this.theaterName)}>Voeg toe</sl-button>
        </sl-tab-panel>
        <sl-tab-panel name="cities">
          <p>Bekijk eerst of je 'm niet al kan vinden</p>
          ${this.cities && this.cities.length > 0 ? html`
          <sl-select label="Stad" @sl-input=${e => this._handleSelect(e, 'cities', 'city')}>
            ${this.cities.map(city => html`<sl-option value="${city.name}">${city.name}</sl-option>`)}
          </sl-select>
          ` : ''}          
          <p>Zo niet, voeg dan toe :)</p>
          <sl-input label="Naam stad" id="cities-input" @input=${e => this.cityName = e.target.value}></sl-input>
          <sl-button @click=${e => this.addhDocument('cities', this.cityName)}>Voeg toe</sl-button>
        </sl-tab-panel>
        <sl-tab-panel name="theaters">
          <p>Bekijk eerst of je 'm niet al kan vinden</p>
          ${this.theaters && this.theaters.length > 0 ? html`
          <sl-select label="Theater" @sl-input=${e => this._handleSelect(e, 'theaters', 'theater')}>
            ${this.theaters.map(theater => html`<sl-option value="${theater.name}">${theater.name}</sl-option>`)}
          </sl-select>
          ` : ''}
          <p>Zo niet, voeg dan toe :)</p>
          <sl-input label="Naam theater" id="thaters-input" @input=${e => this.theaterName = e.target.value}></sl-input>
          <sl-button @click=${e => this.addhDocument('thaters', this.theaterName)}>Voeg toe</sl-button>
        </sl-tab-panel>
      </sl-tab-group>

      ` : html`<slot name="auth"></slot>`}
      </main>
    `;
  }
}

window.customElements.define('mp-add', MPAdd);
