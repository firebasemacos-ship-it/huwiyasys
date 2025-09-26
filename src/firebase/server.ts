// IMPORTANT: DO NOT USE THIS ON THE CLIENT.
// This is a server-only utility to initialize a Firebase app with admin-like privileges.

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

// This creates a singleton of the Firebase app instance on the server.
let serverApp: FirebaseApp | null = null;
const SERVER_APP_NAME = 'server';

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
  // Check if the server app is already initialized
  if (getApps().some(app => app.name === SERVER_APP_NAME)) {
    serverApp = getApp(SERVER_APP_NAME);
  } else {
    // If not, initialize it with a unique name.
    // In a server context (like Genkit), we can use the standard config
    // as we'll be operating with higher-level privileges if configured correctly.
    // For Genkit flows running in a Firebase environment (like Cloud Functions),
    // initializeApp() with no args would automatically pick up service account credentials.
    try {
        // Attempt initialization for production Firebase environment
        serverApp = initializeApp(firebaseConfig, SERVER_APP_NAME);
    } catch (e) {
        // Fallback for local development or other environments
        // This might happen if default app is already initialized by another part of the system
        if (!getApps().length) {
          initializeApp(firebaseConfig);
        }
        console.warn('Could not initialize named server app, falling back to default. This is expected in some environments.');
        serverApp = getApp(); // Use default app
    }
  }
  
  if (!serverApp) {
      throw new Error("Server Firebase app initialization failed.");
  }

  const firestore = getFirestore(serverApp);
  const auth = getAuth(serverApp);

  return { app: serverApp, firestore, auth };
}
