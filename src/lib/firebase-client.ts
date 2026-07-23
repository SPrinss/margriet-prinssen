import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

// Set PUBLIC_USE_EMULATORS=true (e.g. `npm run dev:emulated`) to develop
// against the local Firebase emulators instead of production.
const useEmulators = import.meta.env.PUBLIC_USE_EMULATORS === 'true';

const firebaseConfig = {
  apiKey: 'AIzaSyC8em8nKNhnyhDFrj4_pTrRpGy8nmNxh8k',
  authDomain: 'margriet-prinssen.firebaseapp.com',
  projectId: 'margriet-prinssen',
  storageBucket: 'margriet-prinssen.appspot.com',
  appId: '1:840668873185:web:fc66cab4b29d56940052a0',
};

let app: FirebaseApp;
let auth: Auth;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const existingApps = getApps();
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    if (useEmulators) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
  }
  return auth;
}

let storage: FirebaseStorage;

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
    if (useEmulators) {
      connectStorageEmulator(storage, 'localhost', 9199);
    }
  }
  return storage;
}

export { firebaseConfig };
