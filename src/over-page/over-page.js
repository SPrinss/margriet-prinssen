import { MPElement, html } from '../mp-element/mp-element';
import { css } from './over-page.css.js';
import '../mp-page/mp-page';
import '../mp-input/mp-input';
import '../mp-textarea/mp-textarea.js';
import '../mp-button/mp-button';

import { StringConverter, NumberConverter, BooleanConverter, ObjectConverter } from 'html-element-property-mixins/src/utils/attribute-converters';

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
      showInterview: {
        observe: true,
        DOM: true,
        attributeName: 'show-interview',
        defaultValue: false,
        fromAttributeConverter: BooleanConverter.fromAttribute 
      }
    }
  }

  get template() {
    return html`
      ${this.styles}

      <mp-page ?active=${!this.showInterview}>
        <h1 slot="header">Over Margriet Prinssen</h1>
          
        <section id="intro-section">
          <div>
            <p>Margriet Prinssen is theaterjournalist. Ze schrijft recensies en interviews voor Mediahuis, Haarlems Dagblad, de Uitkrant, Scenes, Odeon en de Theaterkrant. Tot en met 2019 werkte ze ook als eindredacteur bij Nationale Opera & Ballet. </p>
            <a arrow href="/over/interview">Lees hier een interview met mij uit 2019</a>
          </div>
          <img src="https://firebasestorage.googleapis.com/v0/b/margriet-prinssen.appspot.com/o/Margriet_Prinssen.jpg?alt=media&token=70f95611-9368-4172-bd4b-47032114b025" alt="Foto van Margriet"></img>
        </section>

        <section id="contact-section">

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
        </section>

        <section>
          <article>

          <h3>Verantwoording</h3>
          
            <p>Op deze site vind je recensies en interviews vanaf de jaren negentig over met name
            theater, maar ook opera en dans.</p>
            <p>Vanaf 1989 schrijf ik recensies voor Haarlems Dagblad en wat achtereenvolgens De
            GPD-bladen, TMG Media en Mediahuis (Noordhollands Dagblad, Haarlems Dagblad,
            Leidsch Dagblad, De Gooi- en Eemlander en IJmuider Courant) heette; sinds 2011
            artikelen over theater voor de Amsterdamse Uitkrant, sinds het eerste nummer voor
            theaterblad Scenes en daarnaast voor programmaboeken van Nationale Opera &amp;
            Ballet en voor Odeon.</p>
            <p>Bijzonder is de zoekfunctie: je kunt op personen, gezelschappen en nog veel meer
            zoeken. Ook voor mijzelf een zoektocht vol verrassingen. 
            Er staan zo’n 700 artikelen in, lang niet alles, maar wel veel van wat ik heb
            geschreven in de loop van de tijd. Van de eerste jaren ontbreekt vrijwel alles,
            eenvoudig omdat de digitalisering nog in de kinderschoenen stond. Flopjes naar de
            drukker brengen, recensies in nachtelijke uren met het modem versturen, met
            ingehouden adem of het wonder weer geschieden zou (het geluid dat zo’n modem
            voortbracht, het suggestieve piepen en kraken – alsof de woordenbrij letterlijk door
            een buis moest worden geduwd door ijverige maar oververmoeide kabouters –
            duurde wel een minuut...).</p>
            <p>Enige volledigheid wordt niet gepretendeerd, maar vanwege mijn werk voor het
            Haarlems Dagblad zijn vooral de recensies van alles wat in de Toneelschuur te zien
            was redelijk compleet.<p>
            <p>De site is gemaakt door Sam en Tijl Prinssen en Lex van der Slot, waarvoor veel
            dank.</p>
          </article>

        </section>

    </mp-page>

    <mp-page id="interview-page" ?active=${this.showInterview}>
      <h2 slot="header">Interview ter gelegenheid van haar afscheid bij de Nationale Opera & Ballet</h2>
      <h5 slot="header">Laura Roling - mei 2019</h5>

      <main>
        <div id="aside-left-content-wrapper">
          <a arrow-back href="/over">Terug naar over</a>
        </div>
        <div id="main-content-wrapper">
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

        </div>
        <div></div>

      </main> 
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