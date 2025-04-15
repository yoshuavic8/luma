import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Import Firestore dengan cara yang berbeda untuk menghindari masalah CORS
import * as firebase from "firebase/app";
import * as firestore from "firebase/firestore";

// Firebase configuration
// Only log in development mode
if (process.env.NODE_ENV === "development") {
  // Removed console statement
  console.log(
    "API Key:",
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Set (hidden)" : "Not set"
  );
  console.log(
    "Auth Domain:",
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "Set (hidden)" : "Not set"
  );
  console.log(
    "Project ID:",
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "Set (hidden)" : "Not set"
  );
}

// Replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID",
};

// Initialize Firebase
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Initialize Firestore with custom settings to avoid CORS issues
let db;

if (typeof window !== "undefined") {
  // Browser environment - use special configuration to avoid CORS issues
  db = firestore.initializeFirestore(app, {
    // These settings help avoid CORS issues in browser environments
    experimentalForceLongPolling: true,
    useFetchStreams: false,
    cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
  });

  // Disable WebSocket transport completely
  // @ts-ignore - Accessing internal property to force XHR
  window._FIREBASE_FORCE_XHR_TRANSPORT = true;

  // Enable offline persistence with a different approach
  try {
    firestore
      .enableIndexedDbPersistence(db)
      .then(() => {
        if (process.env.NODE_ENV === "development") {
          // Removed console statement
        }
      })
      .catch((err) => {
        if (err.code === "failed-precondition") {
          // Multiple tabs open, persistence can only be enabled in one tab at a time
          // Removed console statement
        } else if (err.code === "unimplemented") {
          // The current browser does not support persistence
          // Removed console statement
        } else {
          // Removed console statement
        }
      });
  } catch (error) {
    // Removed console statement
  }
} else {
  // Server environment - use standard configuration
  db = firestore.initializeFirestore(app, {});
}

// For development, connect to Firestore emulator if needed
if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
) {
  // Use emulator if configured
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "localhost";
  const port = parseInt(
    process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || "8080",
    10
  );
  // Removed console statement
  firestore.connectFirestoreEmulator(db, host, port);
}

// Initialize Functions
const functions = getFunctions(app);

// Enable Firestore logging in development
// Commented out to reduce console noise
// if (process.env.NODE_ENV === "development") {
//   // Removed console statement
// }

export { app, auth, db, functions };
