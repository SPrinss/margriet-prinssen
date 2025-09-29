# Test Fixtures

This directory contains sample DOCX files for testing the file upload wizard functionality.

## Required Test Files

### review-standard.docx
Standard format review with clear field delimiters:
```
Orkater en Schouwburg De Lawei / Het Verdriet van de Zuiderzee / Tekst: Geert Lageveen / Regie: Geert Lageveen, Belle van Heerikhuizen / Spel: Jasper Stoop, Nick Livramento Silva, Keja Klaasje Kwestro / Oudemirdumerklif, Oudemirdum / 13-08-2022

Even lichtvoetig als indringend locatietheater bij het IJsselmeer

Het is een adembenemend beeld. Eindeloze lappen bouwgaas roepen een verloren zee op...
```

### review-complex.docx
Complex format with multiple groups and variations.

### review-ambiguous.docx
Missing labels, requires AI parsing:
```
Club Kenau / Moby Dick, de kerstmusical / Leopold Witte / Erik van Muiswinkel, Club Kenau, Milan Sekeris / Stadsschouwburg / December 2023

Nieuwe bewerking van Moby Dick

Het gonst en knispert van de verwachtingen...
```

### interview-standard.docx
Standard interview format.

### interview-multilingual.docx
Mixed language content for testing.

### corrupted.docx
Intentionally corrupted file for error testing.

### empty.docx
Empty file for edge case testing.

### large-5mb.docx
Performance testing file (5MB size).

## Creating Test Files

To create actual DOCX test files:
1. Use Microsoft Word or LibreOffice to create documents with the above content
2. Save as .docx format in this directory
3. Ensure file sizes match requirements (especially large-5mb.docx)

## Test File Usage

These files are used by:
- Unit tests in `/tests/unit/`
- Integration tests in `/tests/integration/`
- Contract tests in `/tests/contract/`