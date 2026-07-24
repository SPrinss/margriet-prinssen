/**
 * Recursively dump ALL collections (incl. subcollections) of production
 * Firestore to JSON files — one file per root collection.
 * Read-only: only .get()/.listCollections() calls, never writes.
 *
 * Output shape per root collection file:
 *   { "<docId>": { "_data": {...}, "_collections": { "<colId>": { <same shape> } } } }
 * ("_collections" only present when the doc has subcollections)
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=<key> NODE_PATH=../margriet-prinssen/functions/node_modules \
 *     node dump-firestore.js <outDir>
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'margriet-prinssen',
});
const db = admin.firestore();

let docCount = 0;

// Serialize Firestore-specific types so the seed script can restore them.
function serialize(value) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof admin.firestore.Timestamp) {
    return { __type: 'timestamp', seconds: value.seconds, nanoseconds: value.nanoseconds };
  }
  if (value instanceof admin.firestore.GeoPoint) {
    return { __type: 'geopoint', latitude: value.latitude, longitude: value.longitude };
  }
  if (value instanceof admin.firestore.DocumentReference) {
    return { __type: 'ref', path: value.path };
  }
  if (Array.isArray(value)) return value.map(serialize);
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
  return out;
}

// Run async mappers with limited concurrency.
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

async function dumpCollection(col) {
  const snapshot = await col.get();
  const entries = await mapLimit(snapshot.docs, 20, async doc => {
    docCount++;
    if (docCount % 2000 === 0) console.log(`  ...${docCount} docs`);
    const entry = { _data: serialize(doc.data()) };
    const subs = await doc.ref.listCollections();
    if (subs.length > 0) {
      entry._collections = {};
      for (const sub of subs) {
        entry._collections[sub.id] = await dumpCollection(sub);
      }
    }
    return [doc.id, entry];
  });
  return Object.fromEntries(entries);
}

async function main() {
  const outDir = process.argv[2];
  if (!outDir) {
    console.error('Usage: node dump-firestore.js <outDir>');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const collections = await db.listCollections();
  console.log(`Found ${collections.length} root collections: ${collections.map(c => c.id).join(', ')}\n`);

  for (const col of collections) {
    const before = docCount;
    const tree = await dumpCollection(col);
    const file = path.join(outDir, `${col.id}.json`);
    fs.writeFileSync(file, JSON.stringify(tree, null, 1));
    console.log(`${col.id}: ${docCount - before} docs (incl. subcollections) → ${file}`);
  }
  console.log(`\nDone: ${docCount} documents exported to ${outDir}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
