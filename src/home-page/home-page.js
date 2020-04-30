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
        defaultValue: [{images: [
          'https://firebasestorage.googleapis.com/v0/b/margriet-prinssen.appspot.com/o/marcel_musters.png?alt=media&token=1193d3ec-b024-4eee-bd9b-5cd511393b29'
        ], title: "‘Theatermaken gaat altijd over het persoonlijke én het politieke’", 
        actors: ["Marcel Musters"], 
        interviewDate: "06-2019"
      },
        {
          images: ["https://firebasestorage.googleapis.com/v0/b/margriet-prinssen.appspot.com/o/de_thuiskomst.jpg?alt=media&token=b5c838e7-449b-46c3-ab01-9416fa23d855"], 
          title: "Grappig en gruwelijk tegelijk", 
          actors: ["Maria Kraakman", "Nanouk Leopold"], 
          interviewDate: "10-2019"
        }, 
        {
          images: ["https://firebasestorage.googleapis.com/v0/b/margriet-prinssen.appspot.com/o/whos_afraid_of.jpg?alt=media&token=adab07d5-479f-4b67-b0c3-e8686a1fe235"], 
          title: "‘Who’s afraid of …?’", 
          actors: ["Jacob Derwig", "Erik Whien"], 
          interviewDate: "05-2013"
        }, 
        {
          images: ["https://firebasestorage.googleapis.com/v0/b/margriet-prinssen.appspot.com/o/Lucas-De-Man-Fotograaf-Anne-Harbers-2-1024x683-960x514.jpg?alt=media&token=e6e2df0b-0d6e-40b2-ab30-701037c6618b"], 
          title: "Een pleidooi voor empathie", 
          actors: ["Lucas De Man"], 
          interviewDate: "09-2017"
        }]
      }
    }
  }

  constructor() {
    super();
    this.getRecentReviewsAndInterviews()
  }

  async getRecentReviewsAndInterviews() {
    const reviewsPromise = this.getRecentCollection('reviews');
    // const interviewsPromise = this.getRecentCollection('interviews');
    const reviews = await reviewsPromise // , interviews = await interviewsPromise;
    this.reviews = reviews;

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

  get template() {
    return html`
      ${this.styles}

    <mp-page>

      <h1 slot="header">Margriet Prinssen</h1>
      <h2 slot="header">Theaterjournalistiek</h2>

      <section>
        <p>Vanaf 1989 schrijf ik over theater, dans en opera: theaterrecensies voor diverse dagbladen, artikelen voor de Uitkrant, Scenes, theaterkrant.nl, programmaboeken van Nationale Opera &amp; Ballet en Odeon.</p>
        <p>Op deze site kun je in de recensies zoeken op titel of op naam van de theatermaker of het gezelschap.</p>
        <a href="/over" arrow>Over mij</a>

      </section>

      <section>
        <h3>Recente publicaties</h3>
        <div class="grid">
          ${this.reviews.map(item => {
              return html`
                <a href="/recensies/${item.objectID}">
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
          <a href="/recensies" arrow>Doorzoek recensies</a>
          
          <div class="grid">

            ${this.interviews.map(item => {
              return html`
                <a href="/interviews/${item.objectID}">
                <basic-preview
                  data-type="interview"
                  .imageSrc=${item.images ? item.images[0] : ''}
                  .title=${item.title}
                  .featureList=${item.actors}
                  .timePublished=${item.interviewDate}
                >
                </basic-preview>
                </a>
              `
            })}
          </div>

          <a href="/interviews" arrow>Doorzoek interviews</a>

      </section>

    </mp-page>
    
    `;
  }

}

window.customElements.define('home-page', HomePage);