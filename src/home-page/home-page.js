import { MPElement, html } from '../mp-element/mp-element';
import '../recensie-preview/recensie-preview';
import '../basic-preview/basic-preview';
import '../mp-page/mp-page';
import '../mp-button/mp-button';
import FireStoreParser from 'firestore-parser/index';

import { css } from './home-page.css.js';

class HomePage extends MPElement {

  static get properties() {
    return {
      reviews: {
        observe: true,
        defaultValue: []
      },
      reviewsAndInterviews: {
        observe: true,
        defaultValue: []
      },
      interviews: {
        observe: true,
        defaultValue: [
          {
            "interviewDate": "01-2020",
            "title": "Een gepassioneerd pleitbezorger van het theater",
            "objectID": "Fup872FmBLSGwB5Cr2Yb",
            "images": ["https://firebasestorage.googleapis.com/v0/b/margriet-prinssen.appspot.com/o/Sopro-Tiago-Rordigues-%C2%A9Christophe-Raynaud-de-Lage-3-1240x814%20(1).jpg?alt=media&token=e174c476-aa27-4f32-b259-09db942506e8"],

            "persons": [
              {
                "id": "wGLsSIFWghp8nZ1Bvjea",
                "name": "Tiago Rodrigues"
              }
            ],
          },
          {
            "title": "Hamlet in Nieuw-West ",
            "objectID": "iKEwM7avoUfL3XlaSB3E",
            "persons": [
              {
                "id": "3MDYkGav3TPogZay8teB",
                "name": "Hamlet Toneelmakerij"
              },
              {
                "id": "BBDS11RdLow2NTfOuKzZ",
                "name": "Abdelkader Benali"
              }
            ],
            "images": [
              "https://firebasestorage.googleapis.com/v0/b/margriet-prinssen.appspot.com/o/ABDEL%20KADERKL.jpg?alt=media&token=116302fc-0bbe-4228-a5ea-09eadc3e2c32"
            ],
            "interviewDate": "02-2020",
            "objectID": "iKEwM7avoUfL3XlaSB3E"
          },
          {
            "objectID": "j5tRqazU6Qdpiw3MLLmk",
            "interviewDate": "04-2019",
            "images": ["https://firebasestorage.googleapis.com/v0/b/margriet-prinssen.appspot.com/o/losttango_nichonglerum-12.jpg?alt=media&token=be3ff628-f231-4e6d-8955-2501184c49c0"],
            "title": "Lost Tango, Een schipbreuk in de tijd",
            "persons": [
              {
                "id": "PfsV34nycvbZM1tGCx1U",
                "name": "Dagmar Slagmolen"
              },
              {
                "name": "Rosa Arnold",
                "id": "W4S3LcnnxBL1pBvZWplb"
              },
              {
                "id": "9Cmnw04tiRinguPgpXPo",
                "name": "Carel Kraayenhof"
              },
              {
                "name": "Meral Polat",
                "id": "8Z1R0NvoH5pgHdgozASL"
              }
            ],
          },
          {
            "objectID": "GgsyVuCN6suNerkAyro4",
            "images": ["https://firebasestorage.googleapis.com/v0/b/margriet-prinssen.appspot.com/o/Katie_Mitchell%20(1).jpg?alt=media&token=13dff8b9-6a1b-4147-9339-21d2768b5df5"],
            "interviewDate": "05-2018",
            "title": "Een bizar spannend proces",
            "persons": [
              {
                "name": "Katie Mitchell",
                "id": "0Zdci4zlC3hxxdRU6blh"
              }
            ],
          }
        ]
      }
    }
  }

  constructor() {
    super();
    this.getRecentReviewsAndInterviews()
  }

  async getRecentReviewsAndInterviews() {
    const reviewsPromise = this.getRecentCollection('reviews');
    const interviewsPromise = this.getRecentCollection('interviews');
    this.reviews = await reviewsPromise; 
    this.interviews = await interviewsPromise;
  }

  async getRecentCollection(collection) {
    const resp = await fetch(`https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents:runQuery`, { 
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      body: JSON.stringify({
        structuredQuery:
        {
          from: [
            {
              collectionId: collection
            }
          ],
          orderBy: [
            { field: 
                { fieldPath: collection === 'reviews' ? 'timePerformed' : 'timePublished' 
            }, direction: 'DESCENDING' }
        ],
          limit: 4
        }
      })
    });

    const data = await resp.json();

    const items = data.map( doc => {
      const parsedData = FireStoreParser(doc.document)
      const fields = parsedData.fields
      fields.objectID = doc.document.name.substring(doc.document.name.lastIndexOf('/') + 1, doc.document.name.length)
      return fields;
    });
    return items;
  }

  filterNamesFromArray(arr) {
    if(!arr) return [];
    return arr.map(item => item.name)
  }

  filterNamesFromObj(obj) {
    if(!obj || !obj.name) return null;
    return obj.name;
  }

  get styles() {
    return html`<style>${css}</style>`;
  }

  getNames(persons) {
    if(!persons) return []
    return persons.map(person => person.name);
  }

  connectedCallback() {
    super.connectedCallback();
    const titleEl = this.shadowRoot.getElementById('title');
    const subtitleEl = this.shadowRoot.getElementById('subtitle');
    titleEl.innerText = ' ';
    subtitleEl.innerText = ' ';

    this.setInnerTextWithDelay("Margriet Prinssen", titleEl, 1, 85)
    window.setTimeout(() => {
      this.setInnerTextWithDelay("Theaterjournalistiek", subtitleEl, 1, 85)
    }, 1775);
    
  }


  setInnerTextWithDelay(str, el, postition, delay) {
    el.innerText = str.substring(0, postition)
    postition += 1;

    if (postition < str.length  + 1) {
      
      setTimeout(() => requestAnimationFrame(() => {this.setInnerTextWithDelay(str, el, postition, delay)}) , delay);
    }
  }

  get template() {
    return html`
      ${this.styles}

    <mp-page>

      <header slot="header">
        <h1 id="title" ></h1>
        <h2 id="subtitle"></h2>
      </header>


      <section id="intro-section">
        <p>Vanaf 1989 schrijf ik over theater, dans en opera: theaterrecensies voor diverse dagbladen, artikelen voor de Uitkrant, Scenes, theaterkrant.nl, programmaboeken van Nationale Opera &amp; Ballet en Odeon.</p>
        <p>Op deze site kun je recensies vinden op titel of op naam van het gezelschap of de theatermaker. Volledigheid wordt niet nagestreefd. Evidente fouten graag melden via het contactformulier op de <a href="/over">over</a> pagina.</p>
      </section>

      <section>
        <h3>Recente publicaties</h3>
        <div class="grid">
          ${this.reviews.map(item => {
              return html`
                <a href="/recensies/${item.objectID}" aria-label="Navigeer naar ${item.title || item.name}">
                <basic-preview
                  data-type="review"
                  .imageSrc=${item.images ? item.images[0] : ''}
                  .title=${item.title || item.name}
                  .featureList=${this.filterNamesFromArray(item.groups)}
                  .timePublished=${item.reviewDate}
                >
                </basic-preview>
                </a>
              `
            })}
          </div>
          <a href="/recensies" aria-label="Navigeer naar interviews" arrow>Doorzoek recensies</a>
      </section>

      <section>
          
          <div class="grid">

            ${this.interviews.map(item => {
              return html`
                <a href="/interviews/${item.objectID}" aria-label="Navigeer naar ${item.title}">
                <basic-preview
                  data-type="interview"
                  .imageSrc=${item.images ? item.images[0] : ''}
                  .title=${item.title}
                  .featureList=${this.getNames(item.persons)}
                  .timePublished=${item.interviewDate}
                >
                </basic-preview>
                </a>
              `
            })}
          </div>

          <a href="/interviews" aria-label="Navigeer naar interviews" arrow>Doorzoek interviews</a>

      </section>

    </mp-page>
    
    `;
  }

}

window.customElements.define('home-page', HomePage);