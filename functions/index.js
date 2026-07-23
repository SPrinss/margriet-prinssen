const functions = require('firebase-functions/v1');

const algoliasearch = require('algoliasearch');

const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');

// Algolia config comes from environment variables (.env at deploy, .env.local in the emulator).
// Safety: when running in the emulator, index names default to *_test so emulated
// functions can never write to the production indices, even with missing config.
const emulated = process.env.FUNCTIONS_EMULATOR === 'true';
const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
const reviewsIndex = algoliaClient.initIndex(process.env.ALGOLIA_REVIEWS_INDEX || (emulated ? 'reviews_test' : 'reviews'));
const interviewsIndex = algoliaClient.initIndex(process.env.ALGOLIA_INTERVIEWS_INDEX || (emulated ? 'interviews_test' : 'interviews'));

admin.initializeApp();

function parseIds(obj) {
  return Object.entries(obj).map(([key, val]) => {
    if(Array.isArray(val)) {
      // [{id, name}]
      const obj = {[key]: []};
      val.forEach(item => {
        obj[key].push(item.name)
      })
      return obj;
    } else if (val.constructor === Object) {
      // {id, name}
      return {[key]: val.name}
    } else {
      // value
      return {[key]: val}
    }
  }).reduce(((r, c) => Object.assign(r, c)), {});
}

function parseSearchableReviewData(dbData) {
  // get relevant data from all dbData
  const searchableData = (({ groups, name, theater, writers, directors, title, reviewDate, actors, city, year }) => ({ groups, name, theater, writers, directors, title, reviewDate, actors, city, year }))(dbData);
  searchableData.persons = [].concat(...searchableData.writers, ...searchableData.directors, ...searchableData.actors);

  // remove empty values since Firestore won't accept them
  Object.keys(searchableData).forEach((key) => (searchableData[key] === null || typeof searchableData[key] === 'undefined') && delete searchableData[key]);

  // parse id's from searchableData
  const searchableParsedData  = parseIds(searchableData);
  return searchableParsedData;
}

function parseSearchableInterviewData(dbData) {
  // deconstruct object into parsed obj
  const searchableData = (({ title, persons, interviewDate,year, images }) => ({ title, persons, interviewDate, year, images }))(dbData);
  // remove empty values since Firestore won't accept them
  Object.keys(searchableData).forEach((key) => (searchableData[key] === null || typeof searchableData[key] === 'undefined') && delete searchableData[key]);
  const searchableParsedData  = parseIds(searchableData);
  return searchableParsedData;
}

exports.addToReviewIndex = functions.firestore.document('reviews/{reviewId}')
  .onCreate(snapshot => {
      const data = snapshot.data();
      const objectID = snapshot.id;
      return reviewsIndex.saveObject({ ...parseSearchableReviewData(data), objectID: objectID });
      }
  );

exports.updateReviewIndex = functions.firestore.document('reviews/{reviewId}')
    .onUpdate((change) => {
        const data = change.after.data();
        // Saving using an existing objectID overwrites the record
        const objectID = change.after.id;
        return reviewsIndex.saveObject({ ...parseSearchableReviewData(data), objectID: objectID });
      }
    );

exports.deleteFromReviewIndex = functions.firestore.document('reviews/{reviewId}')
    .onDelete(snapshot => 
      reviewsIndex.deleteObject(snapshot.id)
    );

exports.addToInterviewIndex = functions.firestore.document('interviews/{interviewId}')
  .onCreate(snapshot => {
      const data = snapshot.data();
      const objectID = snapshot.id;
      return interviewsIndex.saveObject({ ...parseSearchableInterviewData(data), objectID: objectID });
      }
  );

exports.updateInterviewIndex = functions.firestore.document('interviews/{interviewId}')
    .onUpdate((change) => {
        const data = change.after.data();
        // Saving using an existing objectID overwrites the record
        const objectID = change.after.id;
        return interviewsIndex.saveObject({ ...parseSearchableInterviewData(data), objectID: objectID });
      }
    );

exports.deleteFromInterviewIndex = functions.firestore.document('interviews/{interviewId}')
    .onDelete(snapshot => 
      interviewsIndex.deleteObject(snapshot.id)
    );

// ---------------------------------------------------------------------------
// Site rebuild triggering
//
// The site is statically generated, so content changes require a rebuild.
// Every write to reviews/interviews marks meta/rebuild as pending; a scheduled
// function dispatches ONE GitHub Actions deploy once writes have quieted down
// for 5+ minutes (so a bulk import causes a single rebuild, not one per doc).
// meta/rebuild is not client-writable (no rule grants access); only these
// admin-SDK functions touch it.

const REBUILD_QUIET_MS = 5 * 60 * 1000;

function markContentChanged() {
  return admin.firestore().doc('meta/rebuild').set({
    pending: true,
    lastContentWriteAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

// Note: the Firestore database is in eur3; NEW gen1 Firestore triggers are
// not supported for it (the pre-existing us-central1 triggers above are
// grandfathered), so these use v2 triggers instead.
const { onDocumentWritten } = require('firebase-functions/v2/firestore');

exports.rebuildOnReviewWrite = onDocumentWritten(
  { document: 'reviews/{reviewId}', region: 'europe-west1' },
  () => markContentChanged()
);

exports.rebuildOnInterviewWrite = onDocumentWritten(
  { document: 'interviews/{interviewId}', region: 'europe-west1' },
  () => markContentChanged()
);

// Homepage curation changes also require a rebuild. Loop-safe: writes only
// meta/rebuild, which has no trigger listening to it.
exports.rebuildOnHomepageChange = onDocumentWritten(
  { document: 'settings/{settingId}', region: 'europe-west1' },
  () => markContentChanged()
);

exports.dispatchSiteRebuild = functions.pubsub.schedule('every 10 minutes').onRun(async () => {
  const docRef = admin.firestore().doc('meta/rebuild');
  const snapshot = await docRef.get();
  const data = snapshot.data();
  if (!data || !data.pending || !data.lastContentWriteAt) return null;

  // Debounce: wait until content writes have stopped for a while
  if (Date.now() - data.lastContentWriteAt.toMillis() < REBUILD_QUIET_MS) return null;

  const token = process.env.GH_DISPATCH_TOKEN;
  if (!token) {
    console.warn('GH_DISPATCH_TOKEN not set; skipping site rebuild dispatch');
    return null;
  }

  const response = await fetch(
    'https://api.github.com/repos/SPrinss/margriet-prinssen/actions/workflows/deploy.yml/dispatches',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: 'master' }),
    }
  );

  if (response.status === 204) {
    await docRef.set({
      pending: false,
      lastDispatchedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('Site rebuild dispatched to GitHub Actions');
  } else {
    const body = await response.text();
    console.error(`GitHub workflow dispatch failed: ${response.status} ${body}`);
  }
  return null;
});

exports.sendEmail = functions.https.onRequest((req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const {name, contactInfo, message} = JSON.parse(req.body);
    admin.firestore().collection('messages').add({
      to: ['info@margrietprinssen.nl'],
      message: {
        subject: 'Een nieuw bericht van de website :)',
        text: `Hallo! \n\n ${name || '?'} (${contactInfo || '?'}) heeft een bericht achter gelaten: \n\n ${message || '?'} \n Ok doei, \n\n X `
      }
    }).then(dbRes => {
      return res.send(202);
    }).catch(e => {
      return res.send(500);
    })
})
