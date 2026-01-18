import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Public Firebase config - safe for client-side use
const firebaseConfig = {
  apiKey: 'AIzaSyC8em8nKNhnyhDFrj4_pTrRpGy8nmNxh8k',
  authDomain: 'margriet-prinssen.firebaseapp.com',
  projectId: 'margriet-prinssen',
  storageBucket: 'margriet-prinssen.appspot.com',
  appId: '1:840668873185:web:fc66cab4b29d56940052a0',
};

let app: FirebaseApp;
let _db: Firestore;

function getApp(): FirebaseApp {
  if (!app) {
    const existingApps = getApps();
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getApp());
  }
  return _db;
}

export const db = getDb();
