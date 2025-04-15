import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Inisialisasi Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // Gunakan service account atau environment variables
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : require("../../path-to-service-account.json");

    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  return getFirestore();
};

// Export Firestore instance
export const adminDb = initializeFirebaseAdmin();
