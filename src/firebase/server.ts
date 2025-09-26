// IMPORTANT: DO NOT USE THIS ON THE CLIENT.
// This is a server-only utility to initialize a Firebase app with admin-like privileges.

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

let app: FirebaseApp;

/**
 * Initializes and returns a Firebase app instance for server-side operations.
 * It uses a service account for admin-like privileges, bypassing security rules.
 * This should ONLY be used in server environments (like Genkit flows).
 */
export function initializeFirebase(): { firestore: Firestore, auth: Auth } {
  if (getApps().length === 0) {
    try {
      // In a server environment like Firebase App Hosting, calling initializeApp() with no
      // arguments will automatically use the service account credentials.
      app = initializeApp();
    } catch (e) {
      console.warn(
        'Automatic server initialization failed. Falling back to firebaseConfig. This is expected in local development.',
        e
      );
      // Fallback for local development or other environments without automatic credentials
      app = initializeApp(firebaseConfig);
    }
  } else {
    // If apps are already initialized, get the default app.
    app = getApp();
  }

  const firestore = getFirestore(app);
  const auth = getAuth(app);

  return { firestore, auth };
}
