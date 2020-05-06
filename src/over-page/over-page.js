import { MPElement, html } from '../mp-element/mp-element';
import { css } from './over-page.css.js';
import '../mp-page/mp-page';
import '../mp-input/mp-input';
import '../mp-textarea/mp-textarea.js';
import '../mp-button/mp-button';


class OverPage extends MPElement {

  get styles() {
    return html`<style>${css}</style>`;
  }

	static get properties() {
    return {
      name: {
        observe: true,
        defaultValue: ''
      },
      contactInfo: {
        observe: true,
        defaultValue: ''
      },
      message: {
        observe: true,
        defaultValue: ''
      },
    }
  }

  get template() {
    return html`
      ${this.styles}

      <mp-page>
        <h1 slot="header">Over Margriet Prinssen</h1>
          
        <section id="intro-section">
          <img src="data:image/jpeg;base64,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" alt="Foto van Margriet"></img>
          <p>Margriet Prinssen is theaterjournalist. Ze schrijft recensies en interviews voor Mediahuis, Haarlems Dagblad, de Uitkrant, Scenes, Odeon en de Theaterkrant. Tot en met 2019 werkte ze ook als eindredacteur bij Nationale Opera & Ballet. </p>
        </section>

        <div class="top-hor-line-1"></div>
        <div class="bottom-hor-line-1"></div>


        <h4 class="text-centered">Stuur mij een berichtje</h4>
        <section id="contact-container">
          <div id="contact-textarea-container">
            <mp-textarea placeholder="Bericht" .value=${this.message} @input=${e => this.message = e.target.value}></mp-textarea>
          </div>
          <div id="contact-inputs-container">
            <mp-input placeholder="Naam" .value=${this.name} @input=${e => this.name = e.target.value}></mp-input>
            <mp-input placeholder="Email/06" .value=${this.contactInfo} @input=${e => this.contactInfo = e.target.value}></mp-input>
            <mp-button ?disabled=${!(!!this.name && !!this.contactInfo && !!this.message)} @click="${this.storeMessageInDb}">Verstuur</mp-button>
          </div>
        </section>
        <p id="message-succes-indicator"></p>


        <div class="top-hor-line-2"></div>
        <div class="bottom-hor-line-2"></div>

        <section>
          <article>
            <h3>Interview ter gelegenheid van haar afscheid bij de Nationale Opera & Ballet</h3>
            <h6>Laura Roling - mei 2019</h6>

            <p>In oktober 1992 stapte Margriet Prinssen voor het eerst Nationale Opera & Ballet binnen, toen nog het Muziektheater. Nu, ruim 25 jaar later, neemt ze afscheid. Alhoewel, afscheid? ‘Ik blijf gewoon schrijven als freelancer, hopelijk ook voor jullie, dus ik verdwijn niet helemaal.’</p>
            <p>Margriet studeerde Nederlands, met theaterwetenschap als bijvak. Daarna fladderde ze naar eigen zeggen vooral rond van klus naar klus, vooral op redactioneel vlak. Ze schreef - zoals nu nog steeds - veel over theater. Opvallend is haar betrokkenheid bij ‘Socialisties Feministies Tijdschrift Katijf’. “Daar schreef ik de kunst- en cultuurbijdragen, maar heb ik het maken van een blad van alle kanten geleerd.” Collega’s daar waren andere ambitieuze vrouwen, zoals Mavis Carrilho en Jet Bussemaker.</p>
            <p>Ook prijkt Margriets naam op de kaft van een aantal boeken die ze schreef en samenstelde, bijvoorbeeld over Nederlandse schrijfsters in de jaren vijftig. Een opvallende titel in Margriets bibliografie is Nieuwe Moeders. Vijftien vrouwen en hun veranderende kijk op het moederschap uit 1988. Margriet Prinssen en een boek over het moederschap?! “Ik was zelf net moeder geworden en ik wilde dat op een andere manier invullen dan in de rol van de traditionele huismoeder. Dat wekte mijn interesse voor andere vrouwen die ook op hun eigen, niet-traditionele manier invulling gaven aan het moederschap. Tegelijkertijd gaat het boek over de veranderingen in de relaties met je ouders, partner en vrienden die bij het moederschap komen kijken.”</p>

            <blockquote>
              <p>“voelde ik heel erg de noodzaak om die liefde door te geven aan nieuwe generaties.”</p>
            </blockquote>

            <h4>Gastprogrammering en Voetnoot</h4>
            <p>In 1992 moest het toenmalige hoofd publiciteit van de gastprogrammering van het Muziektheater, Karin Welling, tijdelijk vervangen worden. Margrietwerd gevraagd om het over te nemen. “Dat was een leuke tijd. Ik vind het nog steeds jammer dat Gastprogrammering is opgeheven. Alle belangrijke choreografen en regisseurs kwamen daar voorbij. Zoals Bill T. Jones die volgend jaar associate artist is van het Holland Festival.” Haar waarnemende functie liep ten einde, maar Margriet bleef als freelancer verbonden aan de Gastprogrammering en de afdeling Educatie. Ook nam ze een tijd het personeelsblad Voetnoot voor haar rekening als eindredacteur. “Ik leerde zo de organisatie goed kennen. Het blad verscheen iedere twee weken, dus om de week moest ik een floppy bij de drukker afleveren. Dat waren nog eens andere tijden.” De Voetnoot had een belangrijke functie in de interne communicatie, aldus Margriet. “De communicatie was heel helder en iedereen wist wat er speelde.”</p>
            
            <h4>Educatie</h4>
            <p>In 1998 vertrok het toenmalige hoofd van de afdeling Educatie, en Margriet werd gevraagd om de functie over te nemen. Eerst ad interim, en vervolgens in vaste dienst. “Ik vond Educatie een heel spannende afdeling. Ik schreef natuurlijk veel over kunst en theater, en dat komt voort uit een enthousiasme voor de kunstvormen. Ook had ik toen jonge kinderen, en voelde ik heel erg de noodzaak om die liefde door te geven aan nieuwe generaties.”</p>
            <p>De afdeling Educatie was toen een stuk kleiner dan anno 2019. “Ik had twee medewerkers, zes rondleiders en een aantal freelance docenten op mijn afdeling.” Een aantal bekende gezichten binnen Nationale Opera & Ballet zijn ooit door Margriet op de afdeling Educatie binnengehaald. “Ik heb Lin van Ellinckhuijsen aangenomen, Bart Hermans (die al rondleider was) en Jappe Groenendijk. Ook operaregisseur Jetske Mijnssen is ooit bij ons begonnen als rondleider en later operadocent.”</p>
            <p>In de loop der jaren werd de afdeling Educatie steeds groter. “In overleg is besloten om de afdeling uit te breiden en ook de positie van hoofd een ‘upgrade’ te geven. Ik vond dat prima, als iemand anders de bestuurlijke rompslomp voor zich zou nemen. Ik zou verder gaan als beleidsmedewerker met volwasseneneducatie, redactie en rondleidingen in mijn pakket.” Dat pakte niet goed uit. “Een leidinggevende van een afdeling is cruciaal voor de sfeer. Laat ik het erop houden dat het niet boterde tussen mij en mijn opvolgster. En ik was zeker niet de enige op de afdeling.”</p>

            <blockquote>
              <p>“Er hangt hier een bijzondere sfeer die je nergens anders vindt”</p>
            </blockquote>

            <h4>MCV</h4>
            <p>Toen kwam er bij de fusie een vacature vrij voor een redacteur. “Ook werd besloten dat Sandra aan het hoofd zou staan van de gefuseerde afdeling MCV, en dat gaf voor mij de doorslag om op die functie te reageren.” Margriet maakte de overstap en nam al snel ook de functie van balletredacteur over. In de loop der jaren heeft ze zich ontwikkeld tot de spil van de redactie.</p>

            <h4>Culturele omnivoor</h4>
            <p>Daarnaast is ze altijd blijven schrijven over theater, onder meer voor het Haarlems Dagblad, deGPD-bladen, de UITkrant en theatermagazine Scènes. Wat nu haar grootste liefde is? “Ik zou mezelf een culturele omnivoor noemen, ik houd van theater, opera, dans, muziek, maar ook veel van film. Wat ik mooi vind aan opera als kunstvorm is dat het zo direct de ziel kan raken. Theater leunt vaak op woorden die multi-interpretabel zijn, terwijl opera dankzij muziek veel directer binnen kan komen.” Waar ballet in dit verhaal blijft? “Ballet was niet mijn eerste liefde, maar ik heb er in de loop der jaren van leren houden. Ik heb een grote bewondering voor dansers en hun toewijding, en ook door het interviewen van choreografen heb ik de kunstvorm van dichtbij leren kennen. Het nieuwe werk vind ik zelf heel erg bijzonder om bij betrokken te zijn, zoals New Moves en de Choreographic Academy.”</p>
            <p>Margriet gaat Nationale Opera & Ballet missen. “Er hangt hier een bijzondere sfeer die je nergens anders vindt. In de artiestenfoyer kun je zomaar een topdirigent in het wild zien lopen met een flesje cola in de hand, of bij de liften kom je het koor tegen dat een offstage passage uit een grote kooropera oefent. Dat soort dingen maak je op geen enkele andere werkplek mee.”</p>         <p>Wat ze na 5 juli met haar vrije tijd gaat doen? Niet heel veel andere dingen dan nu. “Ik blijf natuurlijk wel werken en schrijven, maar met mijn extra tijd hoop ik nog veel meer tentoonstellingen te kunnen bezoeken, films te kunnen zien en veel boeken te kunnen lezen. Ook ga ik misschien nog een boek schrijven.” Waarover? Voor het eerst in het gesprek doet Margriet er een streng zwijgen toe. “Dat houd ik nog even strikt geheim.”</p>

          </article>
        </section>      
    </mp-page>
    `;
  }

  async storeMessageInDb() {
    // POST /v1/{parent=projects/*/databases/*/documents/**}/{collectionId}
    const resp = await fetch(`https://us-central1-margriet-prinssen.cloudfunctions.net/sendEmail`, { 
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      body: JSON.stringify({
        "name": this.name || "",
        "contactInfo": this.contactInfo || "",
        "message": this.message || "" 
      })
    });
    const messageSuccesIndicatorElement = this.shadowRoot.getElementById('message-succes-indicator');
    if(resp.status === 202) {
      messageSuccesIndicatorElement.innerText = "Dank voor het bericht!"
      this.name = "";
      this.contactInfo = "";
      this.message = "";
    } else {
      messageSuccesIndicatorElement.innerText = "Er is helaas iets misgegaan, probeer het aub later nog eens."
    }
    setTimeout(() => {
      messageSuccesIndicatorElement.innerText = ""
    }, 3000);
  }

}

window.customElements.define('over-page', OverPage);