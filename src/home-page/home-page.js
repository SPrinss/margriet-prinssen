import { MPElement, html } from '../mp-element/mp-element';
import '../recensie-preview/recensie-preview';
import '../interview-preview/interview-preview';
import '../mp-page/mp-page';
import '../mp-button/mp-button';

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
  get styles() {
    return html`<style>${css}</style>`;
  }

  get template() {
    return html`
      ${this.styles}

    <mp-page>
      <header slot="header">
        <div id="overlay" slot="header">
        </div>

      </header>
      <div slot="header-content" id="header-content">
        <h1>Margriet Prinssen</h1>
      
        <h2>Theater journalist</h2>
      </div>

      <section>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Error magnam cum illo incidunt dicta eos, fuga repudiandae voluptates nulla accusamus non qui, delectus laudantium optio vitae hic quisquam. Culpa, aperiam.</p>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Error magnam cum illo incidunt dicta eos, fuga repudiandae voluptates nulla accusamus non qui, delectus laudantium optio vitae hic quisquam. Culpa, aperiam.</p>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Error magnam cum illo incidunt dicta eos, fuga repudiandae voluptates nulla accusamus non qui, delectus laudantium optio vitae hic quisquam. Culpa, aperiam.</p>
      </section>

      <section>
        <h3>Recente recensies</h3>
        <div class="recensie-grid">
          ${itemTemplates}
        </div>
        <a href="/recensies" arrow>Bekijk archief</a>
      </section>
      <section>
        <h3>Recente interviews</h3>
        <div class="interview-grid">
          ${arr.map(i => {
            return html`
                <a href="#">
                  <interview-preview    
                    image-src="https://images.unsplash.com/photo-1559781435-8232735d6d22?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
                    title="‘Theatermaken gaat altijd over het persoonlijke én het politieke’"
                    persons='["Marcel Musters", "nog iemand", "Marcel Musters", "nog iemand"]'
                    time-interviewed="06-2019"
                    outlet="Uitkrant"
                  >
                  </interview-preview>
                </a>
            `
          })}

        </div>
        <a href="/interviews" arrow>Bekijk archief</a>
        
      </section>

    </mp-page>
    
    `;
  }

}

window.customElements.define('home-page', HomePage);