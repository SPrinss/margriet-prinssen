/**
 * Seed the local Firestore EMULATOR from a dump made by dump-firestore.js.
 *
 * SAFETY: refuses to run unless FIRESTORE_EMULATOR_HOST is set, so this can
 * never write to production.
 *
 * Usage:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 \
 *   NODE_PATH=../margriet-prinssen/functions/node_modules \
 *     node seed-emulator.js <dumpDir>
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('FATAL: FIRESTORE_EMULATOR_HOST is not set. Refusing to run against production.');
  process.exit(1);
}

admin.initializeApp({ projectId: 'margriet-prinssen' });
const db = admin.firestore();

// Restore Firestore-specific types serialized by dump-firestore.js.
function deserialize(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(deserialize);
  switch (value.__type) {
    case 'timestamp':
      return new admin.firestore.Timestamp(value.seconds, value.nanoseconds);
    case 'geopoint':
      return new admin.firestore.GeoPoint(value.latitude, value.longitude);
    case 'ref':
      return db.doc(value.path);
    default: {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = deserialize(v);
      return out;
    }
  }
}

let writer;
let docCount = 0;

function seedTree(colRef, tree) {
  for (const [docId, entry] of Object.entries(tree)) {
    const docRef = colRef.doc(docId);
    writer.set(docRef, deserialize(entry._data));
    docCount++;
    if (entry._collections) {
      for (const [subId, subTree] of Object.entries(entry._collections)) {
        seedTree(docRef.collection(subId), subTree);
      }
    }
  }
}

async function main() {
  const dumpDir = process.argv[2];
  if (!dumpDir || !fs.existsSync(dumpDir)) {
    console.error('Usage: node seed-emulator.js <dumpDir>');
    process.exit(1);
  }

  writer = db.bulkWriter();
  const files = fs.readdirSync(dumpDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const colId = path.basename(file, '.json');
    const before = docCount;
    const tree = JSON.parse(fs.readFileSync(path.join(dumpDir, file), 'utf8'));
    seedTree(db.collection(colId), tree);
    console.log(`${colId}: ${docCount - before} docs queued`);
  }
  await writer.close();
  console.log(`\nDone: ${docCount} documents written to emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
