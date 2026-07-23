# Handleiding margrietprinssen.nl

Deze handleiding beschrijft hoe je de website beheert: artikelen toevoegen,
bewerken, afbeeldingen uploaden, de homepage samenstellen en dubbele namen
opschonen.

## Even vooraf: hoe publiceren werkt

De site is "statisch": bezoekers krijgen kant-en-klare pagina's te zien, wat de
site snel maakt en goed vindbaar in Google. Het gevolg: als je iets toevoegt of
wijzigt, staat het **binnen ongeveer 15 minuten** op de site — niet direct.
Je hoeft daar niets voor te doen; de site bouwt zichzelf automatisch opnieuw
zodra er iets is veranderd.

De **zoekfunctie** op de site is wél direct bijgewerkt: een nieuw artikel is
meteen vindbaar via het zoekveld, nog voordat de eigen pagina bestaat.

## Inloggen

De beheerpagina's zijn onzichtbaar voor bezoekers. Je logt in met je
e-mailadres en wachtwoord op de pagina zelf. Eén keer inloggen is genoeg —
daarna ben je op alle beheerpagina's (en onder alle artikelen) ingelogd totdat
je de browser-gegevens wist.

| Pagina | Adres | Waarvoor |
|---|---|---|
| Artikel toevoegen | `margrietprinssen.nl/add` | Eén recensie of interview handmatig invoeren |
| Bestanden importeren | `margrietprinssen.nl/import` | Veel Word-bestanden (.docx) in één keer |
| Homepage beheren | `margrietprinssen.nl/curate` | Kiezen wat er op de voorpagina staat |
| Dubbele namen | `margrietprinssen.nl/dedupe` | Naamvarianten samenvoegen (bijv. Kruijver/Kruyver) |

## Artikelen importeren uit Word-bestanden (/import)

1. Ga naar `margrietprinssen.nl/import` en log in.
2. **Sleep je .docx-bestanden** naar het gestippelde vak (of kies ze via de
   knop). Je kunt er veel tegelijk slepen.
3. Elk bestand wordt automatisch gelezen. Per bestand zie je een kaart met de
   herkende gegevens: type (recensie/interview), naam voorstelling, titel,
   gezelschap, spelers, theater, stad en datum.
4. **Controleer de velden.** Onder de namen staan gekleurde labels:
   - **✓ bestaand** (groen) — deze naam staat al in de database en wordt
     eraan gekoppeld.
   - **+ nieuw** (geel) — deze naam is nieuw en wordt aangemaakt.
   - **bedoelde je "…"?** — de naam lijkt sterk op een bestaande naam
     (waarschijnlijk een typefout). Eén klik op de suggestie neemt de
     bestaande schrijfwijze over.
5. Zie je een **⚠ waarschuwing** (bijv. "Geen datum gevonden")? Vul het veld
   dan handmatig in. Datums schrijf je als MM-DD-JJJJ, bijv. `03-29-2025`
   voor 29 maart 2025.
6. Klopt alles? Klik **Accepteren** op de kaart. (Of gebruik **Alles
   accepteren** als je alle kaarten al gecontroleerd hebt.)
7. Pas als **alle** bestanden geaccepteerd zijn, wordt de knop
   **"Schrijf … artikelen naar de database"** actief. Klik erop en wacht tot
   "Klaar" verschijnt.

Daarna is alles direct doorzoekbaar en staan de artikelpagina's binnen ±15
minuten op de site.

**Let op:** importeer hetzelfde bestand niet twee keer — dan komt het artikel
er dubbel in.

## Een artikel bewerken

Open het artikel op de site terwijl je ingelogd bent. **Onderaan de pagina**
verschijnt dan een blok **"Bewerken"** (bezoekers zien dit niet):

- Pas de tekst, titel, naam of datum aan en klik **Sla op**.
- Bij **Afbeeldingen** zie je de huidige foto's. Met **+ Afbeelding
  toevoegen** upload je een nieuwe; met het **×** op een foto verwijder je
  hem van het artikel.

Wijzigingen staan binnen ±15 minuten op de site.

## De homepage samenstellen (/curate)

Standaard toont de voorpagina de **laatst toegevoegde** recensies en
interviews. Wil je zelf kiezen wat er staat:

1. Ga naar `margrietprinssen.nl/curate` en log in.
2. Vink de artikelen aan die je op de voorpagina wilt (aanbevolen: 4
   recensies en 4 interviews).
3. Artikelen **zonder foto** krijgen een ⚠ waarschuwing — een voorpagina
   oogt beter mét foto's. Klik op **Afbeelding toevoegen** naast het artikel
   om er direct één te uploaden.
4. Klik **Selectie opslaan**.

Wil je terug naar het automatische gedrag? Klik **Reset naar laatst
toegevoegd**. De balk bovenaan laat altijd zien welke stand actief is.

## Dubbele namen opschonen (/dedupe)

Door de jaren heen zijn sommige namen op meerdere manieren geschreven
(bijv. *Wigbolt Kruijver* en *Wigbolt Kruyver*). Daardoor lijkt één persoon
in de zoekfunctie twee personen. Zo ruim je dat op:

1. Ga naar `margrietprinssen.nl/dedupe` en log in. De pagina zoekt zelf alle
   waarschijnlijke dubbelingen bij elkaar.
2. Elke rij is één vermoedelijke dubbeling, met twee soorten labels:
   - **vrijwel zeker** (groen, staat al aangevinkt) — alleen verschil in
     hoofdletters, accenten of ij/y. Samenvoegen is veilig.
   - **mogelijk (typefout?)** (geel, staat uit) — de namen schelen één
     letter. **Vink deze alleen aan als je zeker weet dat het dezelfde
     persoon is** — het kúnnen twee verschillende mensen zijn.
3. Kies per rij met het rondje de **juiste schrijfwijze** (de meest gebruikte
   staat al geselecteerd).
4. Klik **"Voer … samenvoeging(en) uit"** en bevestig. Alle artikelen worden
   aangepast; de zoekfunctie en de site volgen vanzelf.

## Als er iets misgaat

- **Mijn wijziging staat nog niet op de site** — wacht 15 minuten en ververs
  de pagina (Cmd+Shift+R op een Mac). De site wordt bovendien elke nacht
  sowieso één keer opnieuw gepubliceerd.
- **Het bewerkblok verschijnt niet onder een artikel** — je bent niet (meer)
  ingelogd. Log in via `margrietprinssen.nl/add` en open het artikel opnieuw.
- **"Opslaan mislukt" of een andere foutmelding** — controleer je
  internetverbinding en probeer het nog eens. Blijft het misgaan, neem dan
  contact op met Sam.
