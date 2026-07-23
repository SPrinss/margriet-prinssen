/**
 * Parser for imported .docx article files (recensies & interviews).
 *
 * Pure ESM module with no DOM/Node dependencies so it runs both in the
 * browser (import wizard) and in Node (tools/test-import-parser.mjs).
 *
 * Input: paragraphs extracted from a .docx (via mammoth), plus filename and
 * folder path hints. Output: a draft record with the same field names as the
 * Firestore `reviews` / `interviews` documents, ready for human review in the
 * wizard. Parsing is heuristic — every field is editable in the UI, so the
 * goal is a good first guess, not perfection. Unparseable aspects are
 * reported in `warnings`.
 *
 * Known source formats:
 *  1. New-style recensie (2024+):
 *       Orkater                                     <- group(s)
 *       Orchestra Soledad                           <- play name
 *       Goede bedoelingen zitten het drama in de weg<- headline/title
 *       Gezien op 14 december 2024, Theater Bellevue, Amsterdam
 *       <body...>
 *  2. Old-style slash meta line (t/m 2023):
 *       Theater/ Recensie / Margriet Prinssen / <groups> / <play> /
 *       Regie: X / Tekst: Y / Spel: Z / Gezien: <place-date> / Info: ...
 *       <headline>
 *       <body...>
 *  3. Interview:
 *       [optional "<group> / <play>" line]
 *       Interview (met) <persons>
 *       '<quote headline>'
 *       <body...>
 */

import { unzipSync, strFromU8 } from 'fflate';

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Extract paragraphs from an OpenDocument Text (.odt) file.
 * @param {Uint8Array} bytes
 */
export function odtToParagraphs(bytes) {
  const files = unzipSync(bytes);
  if (!files['content.xml']) throw new Error('Geen content.xml in .odt bestand');
  const xml = strFromU8(files['content.xml']);
  const blocks = xml.match(/<text:(p|h)[^>]*>[\s\S]*?<\/text:\1>/g) || [];
  return blocks
    .map(block => {
      const text = decodeEntities(
        block
          .replace(/<text:line-break[^>]*\/>/g, ' ')
          .replace(/<text:tab[^>]*\/>/g, ' ')
          .replace(/<text:s(?:\s+text:c="(\d+)")?[^>]*\/>/g, (_, count) => ' '.repeat(count ? Number(count) : 1))
          .replace(/<[^>]+>/g, '')
      );
      return { text, html: `<p>${escapeHtml(text)}</p>` };
    })
    .filter(p => p.text.trim());
}

/**
 * Extract paragraphs from a plain-text (.txt) file — one paragraph per
 * non-empty line (matching how the old export files are structured).
 */
export function txtToParagraphs(content) {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => ({ text: line, html: `<p>${escapeHtml(line)}</p>` }));
}

/**
 * Split mammoth's HTML output into block-level paragraphs with plain text.
 * Shared by the wizard (browser) and the Node test harness.
 */
export function htmlToParagraphs(html) {
  const blocks = html.match(/<(p|h\d|li|blockquote)[^>]*>.*?<\/\1>/gs) || [];
  return blocks.map(block => ({
    html: block,
    text: block
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'"),
  }));
}

const MONTHS = {
  jan: 1, januari: 1,
  feb: 2, februari: 2,
  mrt: 3, maart: 3,
  apr: 4, april: 4,
  mei: 5,
  jun: 6, juni: 6,
  jul: 7, juli: 7,
  aug: 8, augustus: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oktober: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const MONTH_RE = 'jan(?:uari)?|feb(?:ruari)?|mrt|maart|apr(?:il)?|mei|jun(?:i)?|jul(?:i)?|aug(?:ustus)?|sept?(?:ember)?|okt(?:ober)?|nov(?:ember)?|dec(?:ember)?';

const QUOTE_CHARS = ['‘', '’', '‚', '“', '”', '„', '″', "'", '"', '`'];

function pad2(n) {
  return `0${n}`.slice(-2);
}

function clean(str) {
  return (str || '')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse a Dutch date ("14 december 2024", "29 maart", "28 aug. 2021") from a
 * string. Returns { month, day, year|null } or null.
 */
export function parseDutchDate(str) {
  if (!str) return null;
  const re = new RegExp(`(\\d{1,2})\\s+(${MONTH_RE})\\.?(?:\\s+(\\d{4}))?`, 'i');
  const match = clean(str).match(re);
  if (!match) return null;
  const monthKey = match[2].toLowerCase().replace(/\.$/, '');
  const month = MONTHS[monthKey] || MONTHS[monthKey.substring(0, 3)];
  if (!month) return null;
  return {
    day: parseInt(match[1], 10),
    month,
    year: match[3] ? parseInt(match[3], 10) : null,
  };
}

/** Format a parsed date as the site's reviewDate format: MM-DD-YYYY. */
export function toReviewDate(date) {
  if (!date || !date.year) return '';
  return `${pad2(date.month)}-${pad2(date.day)}-${date.year}`;
}

/** Split "A, B en C" / "A & B" name lists into an array of names. */
export function splitNames(str) {
  const cleaned = clean(str)
    .replace(/\be\.?v\.?a\.?\b/gi, '')
    .replace(/\be\.a\.\b/gi, '')
    .replace(/\s+en\s+/g, ',')
    .replace(/\s*&(amp;)?\s*/g, ',');
  if (!cleaned) return [];
  return cleaned
    .split(',')
    .map(name => clean(name))
    .filter(name => name.length > 1);
}

function startsWithQuote(text) {
  return QUOTE_CHARS.includes((text || '').trim().charAt(0));
}

function yearFromHints(folderHint, fileName) {
  const match = `${folderHint} ${fileName}`.match(/20\d{2}/);
  return match ? match[0] : '';
}

/**
 * Parse an old-style slash-separated meta line into review fields.
 * Segments are either labeled ("Regie: X") or positional (groups, play name).
 */
function parseSlashMeta(line, draft) {
  const segments = line.split('/').map(clean).filter(Boolean);
  const positional = [];

  for (const segment of segments) {
    const labelMatch = segment.match(/^([a-zA-Zëé &]+?)\s*:\s*(.+)$/);
    if (labelMatch) {
      const label = labelMatch[1].toLowerCase();
      const value = labelMatch[2];
      if (label.includes('regie')) draft.directors = splitNames(value);
      else if (label.includes('tekst') || label.includes('script')) draft.writers = splitNames(value);
      else if (label.includes('spel') || label === 'met' || label.includes('cast')) draft.actors = splitNames(value);
      else if (label.includes('choreografie')) draft.directors = draft.directors.concat(splitNames(value));
      else if (label.includes('gezien') || label.includes('premi')) parseGezien(value, draft);
      // Info:, Foto:, www links etc. are intentionally dropped
    } else if (/^gezien\b/i.test(segment)) {
      parseGezien(segment.replace(/^gezien(\s+op)?:?\s*/i, ''), draft);
    } else if (/^(theater|dans|opera|cabaret|recensie|interview|margriet prinssen)$/i.test(segment)) {
      // Category/byline noise
    } else if (/margriet prinssen/i.test(segment)) {
      // "Recensie Margriet Prinssen" variants
    } else if (!/^(www\.|info\b|http)/i.test(segment)) {
      positional.push(segment);
    }
  }

  // Positional leftovers: first = group(s), second = play name.
  if (positional.length >= 2) {
    draft.groups = splitNames(positional[0]);
    draft.name = positional[1];
  } else if (positional.length === 1) {
    draft.groups = splitNames(positional[0]);
  }
}

/**
 * Parse a "Gezien ..." value: a Dutch date plus up to two place names
 * (theater and/or city, in either order — the wizard disambiguates against
 * the known cities list; here place1/place2 are kept in source order).
 */
function parseGezien(value, draft) {
  const date = parseDutchDate(value);
  if (date) {
    draft._parsedDate = date;
  }
  const dateRe = new RegExp(`(?:gezien\\s*(?:op)?\\s*:?\\s*)?\\d{1,2}\\s+(?:${MONTH_RE})\\.?(?:\\s+\\d{4})?`, 'i');
  const places = clean(value)
    .replace(dateRe, '')
    .split(',')
    .map(clean)
    .filter(p => p && !/^(nog\b|aldaar|t\/m|tm\b|vanaf|info\b|www\.)/i.test(p) && !/\d{4}/.test(p));
  if (places[0]) draft._place1 = places[0];
  if (places[1]) draft._place2 = places[1];
}

/**
 * Main entry point.
 * @param {{text: string, html: string}[]} paragraphs - non-empty paragraphs, in order
 * @param {string} fileName
 * @param {string} folderHint - e.g. "naar site 2024/recensies"
 * @returns draft record
 */
export function parseArticle(paragraphs, fileName = '', folderHint = '') {
  const paras = paragraphs.filter(p => clean(p.text));
  const warnings = [];

  const folderIsInterview = /interview/i.test(folderHint);
  const folderIsReview = /recensie/i.test(folderHint);

  // Locate signals in the first paragraphs
  const headScan = Math.min(paras.length, 6);
  let gezienIdx = -1;
  let interviewIdx = -1;
  let slashMetaIdx = -1;
  for (let i = 0; i < headScan; i++) {
    const text = clean(paras[i].text);
    if (gezienIdx === -1 && /^gezien\b/i.test(text)) gezienIdx = i;
    if (interviewIdx === -1 && /^(jd\s+)?interview\b/i.test(text) && text.length < 80) interviewIdx = i;
    if (slashMetaIdx === -1 && i === 0 && (text.match(/\//g) || []).length >= 3) slashMetaIdx = i;
  }

  const isInterview = folderIsInterview || (!folderIsReview && interviewIdx !== -1);

  return isInterview
    ? parseInterview(paras, fileName, folderHint, { interviewIdx, slashMetaIdx, warnings })
    : parseReview(paras, fileName, folderHint, { gezienIdx, slashMetaIdx, warnings });
}

function parseReview(paras, fileName, folderHint, { gezienIdx, slashMetaIdx, warnings }) {
  const draft = {
    type: 'review',
    name: '',
    title: '',
    groups: [],
    writers: [],
    directors: [],
    actors: [],
    theater: '',
    city: '',
    reviewDate: '',
    year: '',
    bodyHtml: '',
    warnings,
    sourceFile: fileName,
  };

  let bodyStart = 0;

  if (slashMetaIdx === 0) {
    // Old-style: slash meta line, then (usually) a headline paragraph
    parseSlashMeta(clean(paras[0].text), draft);
    bodyStart = 1;
    if (paras[1] && clean(paras[1].text).length < 90) {
      draft.title = clean(paras[1].text);
      bodyStart = 2;
    }
  } else if (gezienIdx > 0) {
    // New-style: header block of [groups, name, title?] then the Gezien line
    const header = paras.slice(0, gezienIdx).map(p => clean(p.text));
    if (header.length >= 3) {
      draft.groups = splitNames(header[0]);
      draft.name = header[1];
      draft.title = header[header.length - 1];
    } else if (header.length === 2) {
      draft.groups = splitNames(header[0]);
      draft.name = header[1];
      warnings.push('Geen titel (kop) gevonden');
    } else {
      draft.name = header[0] || '';
      warnings.push('Kort kopblok: alleen naam voorstelling gegokt');
    }
    parseGezien(clean(paras[gezienIdx].text).replace(/^gezien(\s+op)?:?\s*/i, ''), draft);
    bodyStart = gezienIdx + 1;
  } else {
    warnings.push('Geen herkenbaar kopblok; velden handmatig invullen');
    // Take a guess: short first paragraphs up to the first long one are header-ish
    while (bodyStart < paras.length - 1 && clean(paras[bodyStart].text).length < 90) bodyStart++;
    const header = paras.slice(0, bodyStart).map(p => clean(p.text));
    if (header[0]) draft.groups = splitNames(header[0]);
    if (header[1]) draft.name = header[1];
    if (header[2]) draft.title = header[2];
  }

  // Date & year
  const date = draft._parsedDate;
  if (date && !date.year) {
    const hintYear = yearFromHints(folderHint, fileName);
    if (hintYear) date.year = parseInt(hintYear, 10);
  }
  draft.reviewDate = toReviewDate(date);
  draft.year = date && date.year ? String(date.year) : yearFromHints(folderHint, fileName);
  if (!draft.reviewDate) warnings.push('Geen datum gevonden');

  // Theater/city: keep source order; the wizard reassigns using the known
  // cities list. Default: place1 = theater, place2 = city (new-style order).
  draft.theater = draft._place1 || '';
  draft.city = draft._place2 || '';

  draft.bodyHtml = paras.slice(bodyStart).map(p => p.html).join('');
  if (!draft.name) warnings.push('Geen naam voorstelling gevonden');

  delete draft._parsedDate;
  delete draft._place1;
  delete draft._place2;
  return draft;
}

function parseInterview(paras, fileName, folderHint, { interviewIdx, slashMetaIdx, warnings }) {
  const draft = {
    type: 'interview',
    title: '',
    persons: [],
    interviewDate: '',
    year: yearFromHints(folderHint, fileName),
    bodyHtml: '',
    warnings,
    sourceFile: fileName,
  };

  let bodyStart = 0;

  // Persons from the "Interview (met) <names>" paragraph, else from filename
  const interviewLine = interviewIdx !== -1 ? clean(paras[interviewIdx].text) : clean(fileName.replace(/\.docx$/i, ''));
  const personsMatch = interviewLine.match(/interview\s+(?:met\s+)?(.+)$/i);
  if (personsMatch) {
    draft.persons = splitNames(personsMatch[1].replace(/[:'‘’].*$/, ''));
  }
  if (draft.persons.length === 0) warnings.push('Geen personen gevonden');

  if (interviewIdx !== -1) bodyStart = interviewIdx + 1;

  // Old-style slash meta line before/instead: mine it for a date, skip it
  if (slashMetaIdx === 0 && interviewIdx !== 0) {
    const tmp = { directors: [], writers: [], actors: [], groups: [] };
    parseSlashMeta(clean(paras[0].text), tmp);
    if (tmp._parsedDate) draft._parsedDate = tmp._parsedDate;
    if (bodyStart < 1) bodyStart = 1;
  }

  // Title: quote-opening paragraph right after the interview line. Some files
  // glue "Interview X" and the quote into one paragraph — split those.
  const quoteInLine = interviewLine.match(/([‘’“„'"].{10,})$/);
  if (quoteInLine && interviewIdx !== -1) {
    draft.title = clean(quoteInLine[1]);
  } else {
    // Prefer a quote-opening paragraph, else accept any short headline-like
    // paragraph (many interview titles have no quote marks at all).
    const candidates = [];
    for (let i = bodyStart; i < Math.min(paras.length, bodyStart + 2); i++) {
      const text = clean(paras[i].text);
      if (text.length < 140 && !/^quote\b/i.test(text)) candidates.push({ i, text });
    }
    const pick = candidates.find(c => startsWithQuote(c.text)) || candidates[0];
    if (pick) {
      draft.title = pick.text;
      bodyStart = pick.i + 1;
    }
  }
  if (!draft.title) warnings.push('Geen titel (quote) gevonden');

  const date = draft._parsedDate;
  if (date && date.year) {
    draft.interviewDate = toReviewDate(date);
    draft.year = String(date.year);
  }

  draft.bodyHtml = paras.slice(bodyStart).map(p => p.html).join('');
  delete draft._parsedDate;
  return draft;
}
