import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// Sign up with email and password
export async function signUp(email: string, password: string, name: string) {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Create user document in Firestore
    await createUserProfile(user, { displayName: name });

    return user;
  } catch (error) {
    // Removed console statement
    throw error;
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Sign in with Google using popup
export async function signInWithGoogle(useRedirect = false) {
  const provider = new GoogleAuthProvider();

  // Add scopes if needed
  provider.addScope("https://www.googleapis.com/auth/userinfo.email");
  provider.addScope("https://www.googleapis.com/auth/userinfo.profile");

  // Set custom parameters
  provider.setCustomParameters({
    prompt: "select_account",
  });

  // Removed console statement

  try {
    let user;

    if (useRedirect) {
      // Use redirect method as fallback
      // Removed console statement
      await signInWithRedirect(auth, provider);
      // Note: This won't continue execution here - page will reload
      return null;
    } else {
      // Use popup method (preferred)
      // Removed console statement
      const result = await signInWithPopup(auth, provider);
      // Removed console statement
      user = result.user;
    }

    // Check if user document exists, if not create it
    // Removed console statement
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      // Removed console statement
      await createUserProfile(user);
    } else {
      // Removed console statement
    }

    return user;
  } catch (error: any) {
    // Removed console statement
    // Removed console statement
    // Removed console statement

    // Check for specific error types
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Login canceled: You closed the popup window");
    } else if (error.code === "auth/popup-blocked") {
      // If popup is blocked, suggest using redirect method
      // Removed console statement
      throw new Error(
        "Popup blocked: Please try the alternative sign-in method"
      );
    } else if (error.code === "auth/cancelled-popup-request") {
      throw new Error("Login canceled: Multiple popup requests");
    } else {
      throw error;
    }
  }
}

// Handle redirect result
export async function handleGoogleRedirectResult() {
  try {
    // Removed console statement
    const result = await getRedirectResult(auth);

    if (result) {
      // Removed console statement
      const user = result.user;

      // Check if user document exists, if not create it
      // Removed console statement
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        // Removed console statement
        await createUserProfile(user);
      } else {
        // Removed console statement
      }

      return user;
    }

    return null;
  } catch (error) {
    // Removed console statement
    throw error;
  }
}

// Sign out
export async function signOut() {
  return firebaseSignOut(auth);
}

// Reset password
export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

// Create user profile in Firestore
async function createUserProfile(user: User, additionalData: any = {}) {
  const userRef = doc(db, "users", user.uid);

  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || additionalData.displayName || "",
    photoURL: user.photoURL || "",
    createdAt: serverTimestamp(),
    tier: "free",
    usageCount: 0,
    lastUsageReset: new Date().toISOString(),
    ...additionalData,
  };

  await setDoc(userRef, userData);
  return userData;
}

// Get current user profile from Firestore
export async function getUserProfile(uid: string) {
  const userRef = doc(db, "users", uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    return userDoc.data();
  }

  return null;
}
