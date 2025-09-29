# Test Fixtures: File Upload Wizard

## Test DOCX Files Specification

All test files should be created and stored in `/tests/fixtures/` directory. Each file tests specific parsing scenarios and edge cases.

### Review Test Files

#### review-standard.docx
**Purpose**: Test standard format with clear labels
**Content**:
```
Orkater en Schouwburg De Lawei / Het Verdriet van de Zuiderzee / Tekst: Geert Lageveen / Regie: Geert Lageveen, Belle van Heerikhuizen / Spel: Jasper Stoop, Nick Livramento Silva, Keja Klaasje Kwestro, Manoushka Zeegelaar Breeveld, Simme Wouters / Oudemirdumerklif, Oudemirdum / 13-08-2022

Even lichtvoetig als indringend locatietheater bij het IJsselmeer

Het is een adembenemend beeld. Eindeloze lappen bouwgaas roepen een verloren zee op, houten steigers met bruine lappen de bootjes van weleer. Erachter een op deze mooie zomeravond bijna Mediterraan aandoende klif aan het IJsselmeer, met als bonus een zwerm meeuwen in het avondlicht.

Vogels spelen een belangrijke rol in Het Verdriet van de Zuiderzee, de nieuwe voorstelling van Orkater met Schouwburg De Lawei.
```

**Expected Results**:
- `theater`: "Schouwburg De Lawei"
- `groups`: ["Orkater"]
- `title`: "Het Verdriet van de Zuiderzee"
- `writers`: ["Geert Lageveen"]
- `directors`: ["Geert Lageveen", "Belle van Heerikhuizen"]
- `actors`: ["Jasper Stoop", "Nick Livramento Silva", "Keja Klaasje Kwestro", "Manoushka Zeegelaar Breeveld", "Simme Wouters"]
- `city`: "Oudemirdum"
- `location`: "Oudemirdumerklif"
- `performanceDate`: "2022-08-13"
- `reviewTitle`: "Even lichtvoetig als indringend locatietheater bij het IJsselmeer"
- **Parsing stages**: Regex only (high confidence)

#### review-complex.docx
**Purpose**: Test complex format with multiple variations
**Content**:
```
Club Kenau / Moby Dick, de kerstmusical / Regie: Leopold Witte | Spel: Erik van Muiswinkel, Club Kenau (Emma van Muiswinkel, Marlies Bosmans, Jasper van Hofwegen en Bart Sietsema), Milan Sekeris, Maurits Wijmenga / Decor en kostuums: Dieuweke van Reij / Stadsschouwburg Amsterdam / December 2023

Nieuwe bewerking van Moby Dick

Het gonst en knispert van de verwachtingen in de foyer van de Stadsschouwburg. Eindelijk weer een levendige kerstsfeer na een paar hele magere coronajaren.
```

**Expected Results**:
- `theater`: "Stadsschouwburg Amsterdam"
- `groups`: ["Club Kenau"]
- `title`: "Moby Dick, de kerstmusical"
- `directors`: ["Leopold Witte"]
- `actors`: ["Erik van Muiswinkel", "Emma van Muiswinkel", "Marlies Bosmans", "Jasper van Hofwegen", "Bart Sietsema", "Milan Sekeris", "Maurits Wijmenga"]
- `costumes`: ["Dieuweke van Reij"] (additional field)
- `city`: "Amsterdam"
- `performanceDate`: "2023-12-01" (estimated from "December 2023")
- **Parsing stages**: Regex + some AI for date estimation

#### review-ambiguous.docx
**Purpose**: Test format without clear labels requiring AI parsing
**Content**:
```
World Opera Lab / Passie van nu / Miranda Lakerveld / Diverse zangers en muzikanten / Podium Mozaïek, Amsterdam / 21 maart 2021

Troost over de grenzen heen

Zeven talen worden er gesproken of beter gezegd: gezongen in Passie van nu, geïnspireerd door Bachs Matthäus-Passion. Het is een theatraal concert, dat gaat over passie, over liefde en lijden en over verbinding.
```

**Expected Results**:
- `groups`: ["World Opera Lab"]
- `title`: "Passie van nu"
- `directors`: ["Miranda Lakerveld"] (requires AI to identify as director)
- `actors`: ["Diverse zangers en muzikanten"] (requires AI classification)
- `theater`: "Podium Mozaïek"
- `city`: "Amsterdam"
- `performanceDate`: "2021-03-21"
- **Parsing stages**: Regex + AI parsing for director/actor classification
- **User validation**: May need clarification on "Miranda Lakerveld" role

#### review-minimal.docx
**Purpose**: Test minimal viable parsing
**Content**:
```
De Theatercompagnie / Romeo en Julia / Amsterdam / 15-06-2023

Sterke uitvoering van klassiek verhaal

Een prachtige avond in het theater met uitstekende acteurs.
```

**Expected Results**:
- `groups`: ["De Theatercompagnie"]
- `title`: "Romeo en Julia"
- `city`: "Amsterdam"
- `performanceDate`: "2023-06-15"
- **User validation**: Missing directors, actors, theater - should prompt user

### Interview Test Files

#### interview-standard.docx
**Purpose**: Test standard interview format
**Content**:
```
Interview Margriet Prinssen / Gesprek met Erik van Muiswinkel / Maart 2024

Theater na corona

Erik van Muiswinkel: "Het was een moeilijke periode voor het theater. Maar nu zijn we terug sterker dan ooit."

De bekende acteur en theatermaker vertelt over zijn ervaringen tijdens de pandemie en zijn plannen voor de toekomst.
```

**Expected Results**:
- `title`: "Gesprek met Erik van Muiswinkel"
- `persons`: ["Erik van Muiswinkel"]
- `interviewDate`: "2024-03-01"
- `content`: HTML formatted interview text
- **Parsing stages**: Regex only

#### interview-multiple-persons.docx
**Purpose**: Test multiple interviewees
**Content**:
```
Interview / Gesprek met Emma van Muiswinkel en Bart Sietsema / September 2023

Over samenwerking in Club Kenau

Emma: "Werken met familie is altijd bijzonder."
Bart: "We vullen elkaar perfect aan."

Het gesprek met de kernleden van Club Kenau over hun creatieve proces.
```

**Expected Results**:
- `persons`: ["Emma van Muiswinkel", "Bart Sietsema"]
- `interviewDate`: "2023-09-01"
- **Parsing stages**: Regex + AI for name separation

### Error and Edge Case Files

#### corrupted.docx
**Purpose**: Test error handling for corrupted files
**Content**: Binary data that is not valid DOCX format
**Expected Results**:
- `status`: "error"
- `errorMessage`: Contains "extraction failed" or similar
- Graceful fallback to manual entry option

#### empty.docx
**Purpose**: Test empty file handling
**Content**: Valid DOCX with no text content
**Expected Results**:
- `extractedText`: Empty or whitespace only
- `status`: "error" or prompt for manual entry
- No parsing attempts made

#### large-5mb.docx
**Purpose**: Performance testing
**Content**: Standard review format but with very large review text (5MB total)
**Expected Results**:
- Extraction time under 10 seconds
- Memory usage within browser limits
- UI remains responsive during processing

#### mixed-language.docx
**Purpose**: Test multilingual content
**Content**:
```
Internationaal Theater Festival / Romeo and Juliet / Director: James Smith / Actors: Maria Rodriguez, Jean Dupont / Royal Theater / 01-01-2024

Un spectacle magnifique

A beautiful performance mixing languages and cultures. Een prachtige voorstelling die talen en culturen verbindt.
```

**Expected Results**:
- Should handle mixed Dutch/English/French content
- AI parsing may need language detection
- User validation for non-Dutch elements

## Test Data Setup

### Database Test Entities
Create these entities in test database for duplicate detection:

**Persons**:
- `{ id: "test-1", name: "Erik van Muiswinkel" }`
- `{ id: "test-2", name: "Michael J Fox" }`
- `{ id: "test-3", name: "Geert Lageveen" }`
- `{ id: "test-4", name: "Emma van Muiswinkel" }`

**Theaters**:
- `{ id: "test-1", name: "Stadsschouwburg Amsterdam" }`
- `{ id: "test-2", name: "Royal Theater" }`
- `{ id: "test-3", name: "Podium Mozaïek" }`

**Cities**:
- `{ id: "test-1", name: "Amsterdam" }`
- `{ id: "test-2", name: "Oudemirdum" }`

**Groups**:
- `{ id: "test-1", name: "Club Kenau" }`
- `{ id: "test-2", name: "Orkater" }`
- `{ id: "test-3", name: "World Opera Lab" }`

### Similarity Test Cases
Test entity matching with these variations:

- "Michael Fox" → should match "Michael J Fox" (high similarity)
- "G. Lageveen" → should match "Geert Lageveen" (medium similarity)
- "Stadsschouwburg" → should match "Stadsschouwburg Amsterdam" (high similarity)
- "Club K" → should match "Club Kenau" (medium similarity, needs validation)

## Test File Creation Commands

To create actual DOCX test files:

```bash
# Using pandoc or similar tool
echo "Content here" | pandoc -t docx -o tests/fixtures/review-standard.docx

# Or create programmatically in test setup
const createTestFile = (content, filename) => {
  // Use mammoth.js in reverse or similar approach
  // Store in tests/fixtures/ directory
};
```

## Validation Scripts

Each test file should have corresponding validation that can be run independently:

```bash
npm run test:parsing -- --file=review-standard.docx
npm run test:parsing -- --file=review-ambiguous.docx
npm run test:parsing -- --suite=all
```