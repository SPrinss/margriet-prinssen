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
        defaultValue: []
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
    this.reviews = await reviewsPromise; this.interviews = await interviewsPromise;
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
                { fieldPath: 'timePublished' 
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

  get template() {
    return html`
      ${this.styles}

    <mp-page>

      <h1 slot="header">Margriet Prinssen</h1>
      <h2 slot="header">Theaterjournalistiek</h2>

      <section>
        <p>Vanaf 1989 schrijf ik over theater, dans en opera: theaterrecensies voor diverse dagbladen, artikelen voor de Uitkrant, Scenes, theaterkrant.nl, programmaboeken van Nationale Opera &amp; Ballet en Odeon.</p>
        <p>Op deze site kun je in de recensies zoeken op titel of op naam van de theatermaker of het gezelschap.</p>
        <a href="/over" aria-label="Navigeer naar over" arrow>Over mij</a>

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