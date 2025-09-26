// IMPORTANT: DO NOT USE THIS ON THE CLIENT.
// This is a server-only utility to initialize a Firebase app with admin-like privileges.

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

// This creates a singleton of the Firebase app instance on the server.
let serverApp: FirebaseApp | null = null;

interface FirebaseServerServices {
    app: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
}

/**
 * Initializes and returns a Firebase app instance for server-side operations.
 * It uses a service account for admin-like privileges, bypassing security rules.
 * This should ONLY be used in server environments (like Genkit flows).
 */
export function initializeFirebase(): FirebaseServerServices {
  if (getApps().length === 0) {
    // If no apps are initialized, initialize one.
    // In a server context (like Genkit), we can use the standard config
    // as we'll be operating with higher-level privileges if configured correctly.
    // For Genkit flows running in a Firebase environment (like Cloud Functions),
    // initializeApp() with no args would automatically pick up service account credentials.
    try {
        serverApp = initializeApp();
    } catch (e) {
        serverApp = initializeApp(firebaseConfig, "server");
    }
  } else {
    // If apps are already initialized, try to get the default app.
    // If you use named apps, you might need more specific logic here.
     try {
        serverApp = getApp("server");
    } catch (e) {
        serverApp = getApp();
    }
  }
  
  if (!serverApp) {
      throw new Error("Server Firebase app initialization failed.");
  }


  const firestore = getFirestore(serverApp);
  const auth = getAuth(serverApp);

  return { app: serverApp, firestore, auth };
}
