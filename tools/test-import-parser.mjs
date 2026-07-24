/**
 * Run the import parser over all .docx files in new_fioles and report
 * per-field extraction rates, so parser heuristics can be validated against
 * the real corpus before they reach the wizard.
 *
 * Usage (from margriet-prinssen/ so mammoth resolves):
 *   node ../tools/test-import-parser.mjs [--samples N]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { parseArticle, htmlToParagraphs } from '../src/lib/import-parser.mjs';

const require = createRequire(new URL('../package.json', import.meta.url));
const mammoth = require('mammoth');

const ROOT = '/Users/samprinssen/Development/margriet-prinssen-files/read_from_files/new_fioles';

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.docx$/i.test(entry.name) && !entry.name.startsWith('~$')) out.push(full);
  }
  return out;
}

const sampleCount = process.argv.includes('--samples')
  ? parseInt(process.argv[process.argv.indexOf('--samples') + 1], 10)
  : 0;

const files = walk(ROOT);
const stats = { review: {}, interview: {} };
const samples = [];
let failures = 0;

function bump(type, field) {
  stats[type][field] = (stats[type][field] || 0) + 1;
}

for (const file of files) {
  const folderHint = path.dirname(path.relative(ROOT, file));
  const fileName = path.basename(file);
  try {
    const { value: html } = await mammoth.convertToHtml({ path: file });
    const paragraphs = htmlToParagraphs(html);
    const draft = parseArticle(paragraphs, fileName, folderHint);
    bump(draft.type, 'total');
    if (draft.type === 'review') {
      if (draft.name) bump('review', 'name');
      if (draft.title) bump('review', 'title');
      if (draft.groups.length) bump('review', 'groups');
      if (draft.reviewDate) bump('review', 'reviewDate');
      if (draft.theater) bump('review', 'theater');
      if (draft.city) bump('review', 'city');
      if (draft.directors.length) bump('review', 'directors');
      if (draft.bodyHtml.length > 500) bump('review', 'body>500');
    } else {
      if (draft.title) bump('interview', 'title');
      if (draft.persons.length) bump('interview', 'persons');
      if (draft.year) bump('interview', 'year');
      if (draft.bodyHtml.length > 500) bump('interview', 'body>500');
    }
    if (draft.warnings.length === 0) bump(draft.type, 'no-warnings');
    samples.push({ file: path.relative(ROOT, file), draft });
  } catch (err) {
    failures++;
    console.error(`FAIL ${fileName}: ${err.message}`);
  }
}

console.log(`\nFiles: ${files.length}, parse failures: ${failures}\n`);
for (const type of ['review', 'interview']) {
  const s = stats[type];
  console.log(`== ${type} (${s.total || 0}) ==`);
  for (const [field, count] of Object.entries(s).filter(([f]) => f !== 'total')) {
    console.log(`  ${field.padEnd(12)} ${count} (${Math.round((count / s.total) * 100)}%)`);
  }
}

if (sampleCount > 0) {
  console.log('\n== samples ==');
  for (const { file, draft } of samples.slice(0, sampleCount)) {
    const { bodyHtml, ...fields } = draft;
    console.log(`\n--- ${file}`);
    console.log(JSON.stringify({ ...fields, bodyLen: bodyHtml.length }, null, 1));
  }
}
