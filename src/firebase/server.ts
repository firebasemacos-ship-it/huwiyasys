// IMPORTANT: DO NOT USE THIS ON THE CLIENT.
// This is a server-only utility to initialize a Firebase app with admin-like privileges.

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Initializes and returns a Firebase app instance for server-side operations.
 * It uses a service account for admin-like privileges, bypassing security rules.
 * This should ONLY be used in server environments (like Genkit flows).
 */
export function initializeFirebase(): { firestore: Firestore, auth: Auth } {
  // Check if any apps are already initialized.
  if (getApps().length === 0) {
    // In a server environment like Firebase App Hosting, calling initializeApp() with no
    // arguments will automatically use the service account credentials.
    // In local development, it will fall back to the config object.
    try {
      initializeApp();
    } catch (e) {
      console.warn(
        'Automatic server initialization failed. Falling back to firebaseConfig. This is expected in local development.',
        e
      );
      initializeApp(firebaseConfig);
    }
  }
  
  // Get the default app which is now guaranteed to be initialized.
  const app = getApp();
  const firestore = getFirestore(app);
  const auth = getAuth(app);

  return { firestore, auth };
}
