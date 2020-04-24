import { MPElement, html } from '../mp-element/mp-element';
import '../recensie-preview/recensie-preview';
import '../interview-preview/interview-preview';
import '../mp-page/mp-page';
import '../mp-button/mp-button';
import FireStoreParser from '/web_modules/firestore-parser.js';

const arr = [1, 2, 3]
const itemTemplates = [];
for (let i = 0; i < 2; i++) {
  itemTemplates.push(html`
    <recensie-preview
      title="Freudjes, geen familie"
      groups='["mugmetdegoudentand"]'
      time-performed="08-31-2007"
      theater="Ruïne van Brederode"
      city="Velsen"
      title="Freudjes, geen familie"
      actors='["Ab Gietelink", "Bert Apeldoorn", "Munda de la Marre", "Arthur Geesing"]'
      directors='["Ab Gietelink"]'
      writers='["J. W. Goethe", "Ab Gietelink"]'
    >
    </recensie-preview>
    `
  );
}

import { css } from './home-page.css.js';

class HomePage extends MPElement {

  static get properties() {
    return {
      reviews: {
        observe: true,
        defaultValue: []
      }
    }
  }

  constructor() {
    super();
    this.getRecentReviews()
  }
  async getRecentReviews() {
    const resp = await fetch(`https://firestore.googleapis.com/v1/projects/margriet-prinssen/databases/(default)/documents:runQuery`, { 
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      body: JSON.stringify({
        structuredQuery:
        {
          from: [
            {
              collectionId: 'reviews'
            }
          ],
          orderBy: [
            { field: 
                { fieldPath: 'reviewDate' 
            }, direction: 'DESCENDING' }
        ],
          limit: 4
        }
      })
    });

    const data = await resp.json();
    const reviews = data.map( doc => {
      const parsedData = FireStoreParser(doc.document)
      const fields = parsedData.fields
      fields.objectID = doc.document.name.substring(doc.document.name.lastIndexOf('/') + 1, doc.document.name.length)
      return fields;
    });
    this.reviews = reviews;
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
      <h2 slot="header">Theater journalist</h2>

      <section>
        <p>Op deze site vind je recensies en interviews over met name theater, maar ook opera en dans vanaf de jaren negentig.</p>
        <p>Vanaf 1989 schrijf ik recensies voor Haarlems Dagblad en wat achtereenvolgens De GPD-bladen, TMG Media en Mediahuis (Noordhollands Dagblad, Haarlems Dagblad, Leidsch Dagblad, De Gooi- en Eemlander en IJmuider Courant) heette; sinds 2011 artikelen over theater voor de Amsterdamse Uitkrant, sinds het eerste nummer voor theaterblad Scenes en daarnaast voor Odeon, het blad van Nationale Opera & Ballet. </p>
      </section>

      <section>
        <h3>Recente recensies</h3>
        <div class="recensie-grid">
          ${this.reviews.map(item => {
              return html`
                <a href="/recensies/${item.objectID}">
                <recensie-preview
                  .name=${item.name}
                  .title=${item.title}
                  .groups=${this.filterNamesFromArray(item.groups)}
                  .reviewDate=${item.reviewDate}
                  .theater=${this.filterNamesFromObj(item.theater)}
                  .city=${this.filterNamesFromObj(item.city)}
                  .actors=${this.filterNamesFromArray(item.actors)}
                  .directors=${this.filterNamesFromArray(item.directors)}
                  .writers=${this.filterNamesFromArray(item.writers)}
                >
                </recensie-preview>
                </a>
              `
            })}
        </div>
        <a href="/recensies" arrow>Bekijk archief</a>
      </section>
      <section>
        <h3>Recente interviews</h3>
        <div class="interview-grid">

          <a href="#">
            <interview-preview    
              image-src="data:image/jpeg;base64,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"
              title="‘Theatermaken gaat altijd over het persoonlijke én het politieke’"
              persons='["Marcel Musters"]'
              time-interviewed="06-2019"
              outlet="Uitkrant"
            >
            </interview-preview>
          </a>
          <a href="#">
            <interview-preview    
              image-src="data:image/jpeg;base64,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"
              title="‘Who’s afraid of …?’"
              persons='["Jacob Derwig", "Erik Whien"]'
              time-interviewed="05-2013"
            >
            </interview-preview>
          </a>
          <a href="#">
            <interview-preview    
              image-src="data:image/jpeg;base64,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"
              title="Een pleidooi voor empathie"
              persons='["Lucas De Man"]'
              time-interviewed="09-2017"
            >
            </interview-preview>
          </a>
            
          

        </div>
        <a href="/interviews" arrow>Bekijk archief</a>
        
      </section>

    </mp-page>
    
    `;
  }

}

window.customElements.define('home-page', HomePage);