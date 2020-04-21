const functions = require('firebase-functions');
const algoliasearch = require('algoliasearch');

const algoliaClient = algoliasearch(functions.config().algolia.app, functions.config().algolia.key);
const reviewsIndex = algoliaClient.initIndex('reviews');
const interviewsIndex = algoliaClient.initIndex('interviews');

function parseSearchableReviewData(dbData) {
  // get relevant data from all dbData
  const searchableData = (({ groups, name, theater, writers, directors, title, reviewDate, actors, city, year }) => ({ groups, name, theater, writers, directors, title, reviewDate, actors, city, year }))(dbData);

  // remove empty values since Firestore won't accept them
  Object.keys(searchableData).forEach((key) => (searchableData[key] === null || typeof searchableData[key] === 'undefined') && delete searchableData[key]);

  // parse id's from searchableData
  const searchableParsedData  = Object.entries(searchableData).map(([key, val]) => {
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

  return searchableParsedData;
}

function parseSearchableInterviewData(dbData) {
  // deconstruct object into parsed obj
  const searchableData = (({ title, person, magazine, interviewDate }) => ({ title, person, magazine, interviewDate }))(dbData);
  // remove empty values since Firestore won't accept them
  Object.keys(searchableData).forEach((key) => (searchableData[key] === null || typeof searchableData[key] === 'undefined') && delete searchableData[key]);
  return searchableData;
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

