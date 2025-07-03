import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, type FirebaseFunctions } from 'firebase/functions';

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingEnvVars = Object.entries(firebaseConfigValues)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

let app: FirebaseApp | undefined = undefined;
let authInstance: Auth | undefined = undefined; // Renamed to avoid conflict
let dbInstance: Firestore | undefined = undefined; // Renamed to avoid conflict
let functionsInstance: FirebaseFunctions | undefined = undefined;

if (missingEnvVars.length > 0) {
  const errorMessage = `Firebase config is missing the following environment variables: ${missingEnvVars.join(', ')}. Please ensure they are set in your .env.local file or environment. Firebase will not be initialized.`;
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.error("!!! FIREBASE INITIALIZATION ERROR !!!");
  console.error(errorMessage);
  console.error("Check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_ variables are set.");
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
} else {
  const firebaseConfig = {
    apiKey: firebaseConfigValues.apiKey!,
    authDomain: firebaseConfigValues.authDomain!,
    projectId: firebaseConfigValues.projectId!,
    storageBucket: firebaseConfigValues.storageBucket!,
    messagingSenderId: firebaseConfigValues.messagingSenderId!,
    appId: firebaseConfigValues.appId!,
  };

  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e: any) {
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.error("!!! FIREBASE initializeApp FAILED !!!");
      console.error("Error Message:", e.message);
      console.error("Full Error:", e);
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    }
  } else {
    app = getApps()[0];
  }

  if (app) {
    try {
      authInstance = getAuth(app);
      dbInstance = getFirestore(app);
      functionsInstance = getFunctions(app); 

      // Connect to emulators in development mode
      // Make sure NEXT_PUBLIC_NODE_ENV is set to 'development' in your local .env file for this to work
      // or adjust the condition as needed for your environment.
      if (process.env.NEXT_PUBLIC_NODE_ENV === 'development') {
        console.log("Connecting to Firebase Emulators...");
        try {
          connectAuthEmulator(authInstance, "http://localhost:9099", { disableWarnings: true });
          console.log("Auth Emulator connected on port 9099");
        } catch (e: any) { console.error("Auth Emulator connection FAILED:", e.message); }
        
        try {
          connectFirestoreEmulator(dbInstance, "localhost", 8080);
          console.log("Firestore Emulator connected on port 8080");
        } catch (e: any) { console.error("Firestore Emulator connection FAILED:", e.message); }
        
        try {
          connectFunctionsEmulator(functionsInstance, "localhost", 5001);
          console.log("Functions Emulator connected on port 5001");
        } catch (e: any) { console.error("Functions Emulator connection FAILED:", e.message); }
      } else {
        console.log("Connecting to PRODUCTION Firebase services.");
      }

    } catch (e: any) {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("!!! FIREBASE getAuth/getFirestore/getFunctions FAILED !!!");
        console.error("Error Message:", e.message);
        console.error("Full Error:", e);
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    }
  } else {
    console.error("Firebase app object is undefined. Auth, Firestore, and Functions cannot be initialized.");
  }
}

// Export the initialized instances with their original names
export { app, authInstance as auth, dbInstance as db, functionsInstance as functions };