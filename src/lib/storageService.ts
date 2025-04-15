import {
  doc,
  collection,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { SermonOutline } from "./aiService";
import {
  saveToLocalStorage,
  getFromLocalStorage,
  removeFromLocalStorage,
} from "./localStorageService";

// Define sermon note type
export type SermonNote = {
  id?: string;
  title: string;
  content: {
    introduction?: { content: string };
    points: {
      id: string;
      title: string;
      content: {
        verseReference?: { reference: string };
        explanation?: { content: string };
        illustrations: { content: string }[];
      };
    }[];
    conclusion?: { content: string };
    topIllustrations: { content: string }[];
    bottomIllustrations: { content: string }[];
  };
  createdAt?: any;
  updatedAt?: any;
  userId?: string;
  isTemplate?: boolean;
  templateType?: string;
};

// Define sermon note template type
export type SermonNoteTemplate = {
  id?: string;
  title: string;
  description?: string;
  templateType: string; // e.g., 'expository', 'topical', 'narrative', 'custom'
  content: {
    introduction?: { content: string };
    points: {
      id: string;
      title: string;
      content: {
        verseReference?: { reference: string };
        explanation?: { content: string };
        illustrations: { content: string }[];
      };
    }[];
    conclusion?: { content: string };
    topIllustrations: { content: string }[];
    bottomIllustrations: { content: string }[];
  };
  createdAt?: any;
  updatedAt?: any;
  userId?: string;
};

export function useStorage() {
  // Determine if we should use Firestore or localStorage based on user data
  // This will be passed from the component that uses this hook
  const useFirestore = (userData: any) => {
    return userData?.tier === "pro" && !!userData?.uid;
  };

  // Save sermon outline
  const saveSermonOutline = async (
    outline: SermonOutline,
    userData: any,
    forceSaveToFirestore: boolean = false
  ) => {
    // Check if we should use Firestore
    // Either user is pro tier, or forceSaveToFirestore is true
    if (useFirestore(userData) || forceSaveToFirestore) {
      // Save to Firestore
      try {
        // Only log in development
        const isDev = process.env.NODE_ENV === "development";

        if (outline.id && !outline.id.startsWith("local_")) {
          // Update existing document
          if (isDev) {
            // Removed console statement
          }
          const docRef = doc(db, "sermons", outline.id);
          await updateDoc(docRef, {
            ...outline,
            updatedAt: serverTimestamp(),
          });
          return outline.id;
        } else {
          // Create new document
          if (isDev) {
            // Removed console statement
          }
          const docRef = await addDoc(collection(db, "sermons"), {
            ...outline,
            userId: userData?.uid || "anonymous",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          if (isDev) {
            // Removed console statement
          }
          return docRef.id;
        }
      } catch (error) {
        // Removed console statement
        throw new Error("Failed to save sermon outline to Firestore");
      }
    } else {
      // Save to localStorage
      try {
        if (process.env.NODE_ENV === "development") {
          // Removed console statement
        }
        const outlines = getFromLocalStorage("luma_sermon_outlines") || [];

        if (outline.id && outline.id.startsWith("local_")) {
          // Update existing outline
          const updatedOutlines = outlines.map((o: SermonOutline) =>
            o.id === outline.id
              ? { ...outline, updatedAt: new Date().toISOString() }
              : o
          );
          saveToLocalStorage("luma_sermon_outlines", updatedOutlines);
          return outline.id;
        } else {
          // Create new outline
          const newOutline = {
            ...outline,
            id: `local_${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          outlines.push(newOutline);
          saveToLocalStorage("luma_sermon_outlines", outlines);
          return newOutline.id;
        }
      } catch (error) {
        // Removed console statement
        throw new Error("Failed to save sermon outline to localStorage");
      }
    }
  };

  // Get all sermon outlines
  const getSermonOutlines = async (userData: any) => {
    // Always try to get from Firestore first
    try {
      // Only log in development
      const isDev = process.env.NODE_ENV === "development";
      if (isDev)
        console.log(
          "Fetching outlines from Firestore for user:",
          userData?.uid
        );

      // If userData exists and has uid, query by userId
      if (userData?.uid) {
        try {
          // Explicitly set timeout for Firestore query
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Firestore query timeout")),
              4000
            );
          });

          // Create the Firestore query
          const q = query(
            collection(db, "sermons"),
            where("userId", "==", userData.uid)
          );

          // Race between query and timeout
          const queryPromise = getDocs(q);
          const querySnapshot = (await Promise.race([
            queryPromise,
            timeoutPromise,
          ])) as any;

          const outlines = querySnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }));
          if (isDev)
            // Removed console statement
            return outlines;
        } catch (queryError) {
          // Removed console statement
          // If query times out or fails, return empty array
          return [];
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          // Removed console statement
        }
        return [];
      }
    } catch (error) {
      // Removed console statement

      // Fallback to localStorage if Firestore fails
      try {
        if (process.env.NODE_ENV === "development") {
          // Removed console statement
        }
        return getFromLocalStorage("luma_sermon_outlines") || [];
      } catch (localError) {
        // Removed console statement
        // Return empty array instead of throwing error
        return [];
      }
    }
  };

  // Get a single sermon outline
  const getSermonOutline = async (id: string, userData: any) => {
    if (useFirestore(userData) && !id.startsWith("local_")) {
      // Get from Firestore
      try {
        const docRef = doc(db, "sermons", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          return {
            id: docSnap.id,
            ...docSnap.data(),
          };
        } else {
          throw new Error("Sermon outline not found");
        }
      } catch (error) {
        // Removed console statement
        throw new Error("Failed to get sermon outline");
      }
    } else {
      // Get from localStorage
      try {
        const outlines = getFromLocalStorage("luma_sermon_outlines") || [];
        const outline = outlines.find((o: SermonOutline) => o.id === id);

        if (outline) {
          return outline;
        } else {
          throw new Error("Sermon outline not found");
        }
      } catch (error) {
        // Removed console statement
        throw new Error("Failed to get sermon outline");
      }
    }
  };

  // Delete a sermon outline
  const deleteSermonOutline = async (
    id: string,
    userData: any,
    forceFirestoreDelete: boolean = true
  ) => {
    // Always try to delete from Firestore first if ID is not a local ID
    // or if forceFirestoreDelete is true
    if (
      (useFirestore(userData) || forceFirestoreDelete) &&
      !id.startsWith("local_")
    ) {
      // Delete from Firestore
      try {
        const isDev = process.env.NODE_ENV === "development";
        if (isDev)
          console.log(
            `Attempting to delete sermon outline with ID: ${id} from Firestore`
          );

        await deleteDoc(doc(db, "sermons", id));

        if (isDev)
          console.log(
            `Successfully deleted sermon outline with ID: ${id} from Firestore`
          );
        return true; // Return success
      } catch (error) {
        // Removed console statement
        throw new Error(
          `Failed to delete sermon outline from Firestore: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else if (id.startsWith("local_")) {
      // Delete from localStorage
      try {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `Attempting to delete sermon outline with ID: ${id} from localStorage`
          );
        }

        const outlines = getFromLocalStorage("luma_sermon_outlines") || [];
        const updatedOutlines = outlines.filter(
          (o: SermonOutline) => o.id !== id
        );
        saveToLocalStorage("luma_sermon_outlines", updatedOutlines);

        if (process.env.NODE_ENV === "development") {
          console.log(
            `Successfully deleted sermon outline with ID: ${id} from localStorage`
          );
        }

        return true; // Return success
      } catch (error) {
        // Removed console statement
        throw new Error(
          `Failed to delete sermon outline from localStorage: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else {
      console.error(
        `Cannot delete sermon outline with ID: ${id} - Invalid ID or storage location`
      );
      throw new Error(
        "Cannot delete sermon outline - Invalid ID or storage location"
      );
    }
  };

  // Sync local data to Firestore (when upgrading to Pro)
  const syncToFirestore = async (userData: any) => {
    if (!userData?.uid) return;

    try {
      // Get all local data
      const sermonOutlines = getFromLocalStorage("luma_sermon_outlines") || [];
      const sermonNotes = getFromLocalStorage("luma_sermon_notes") || [];
      const savedVerses = getFromLocalStorage("luma_saved_verses") || [];

      // Upload to Firestore
      for (const outline of sermonOutlines) {
        const { id, ...outlineData } = outline;
        await addDoc(collection(db, "sermons"), {
          ...outlineData,
          userId: userData.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const note of sermonNotes) {
        const { id, ...noteData } = note;
        await addDoc(collection(db, "notes"), {
          ...noteData,
          userId: userData.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const verse of savedVerses) {
        await addDoc(collection(db, "bibleVerses"), {
          ...verse,
          userId: userData.uid,
          createdAt: serverTimestamp(),
        });
      }

      // Clear local storage after successful sync
      removeFromLocalStorage("luma_sermon_outlines");
      removeFromLocalStorage("luma_sermon_notes");
      removeFromLocalStorage("luma_saved_verses");

      return true;
    } catch (error) {
      console.error("Failed to sync data to Firestore:", error);
      throw new Error("Failed to sync data to Firestore");
    }
  };

  // Save sermon note
  const saveSermonNote = async (
    note: SermonNote,
    userData: any,
    forceSaveToFirestore: boolean = false
  ) => {
    // Debug logging only in development
    if (process.env.NODE_ENV === "development") {
      console.log("saveSermonNote called with:", {
        note,
        userData,
        forceSaveToFirestore,
        useFirestoreResult: useFirestore(userData) || forceSaveToFirestore,
      });
    }

    // Check if we should use Firestore
    // Either user is pro tier, or forceSaveToFirestore is true
    if (useFirestore(userData) || forceSaveToFirestore) {
      // Save to Firestore
      try {
        // Log only in development
        if (process.env.NODE_ENV === "development") {
          console.log(`Attempting to save sermon note to Firestore`);
          console.log(`User data:`, userData);
        }

        if (note.id && !note.id.startsWith("local_")) {
          // Update existing document
          console.log(`Updating sermon note with ID: ${note.id} in Firestore`);

          // Remove id field to avoid undefined values in Firestore
          const { id, ...noteWithoutId } = note;
          console.log(`Updating note without id field:`, noteWithoutId);

          const docRef = doc(db, "notes", note.id);
          await updateDoc(docRef, {
            ...noteWithoutId,
            updatedAt: serverTimestamp(),
          });
          console.log(
            `Successfully updated sermon note with ID: ${note.id} in Firestore`
          );
          return note.id;
        } else {
          // Create new document
          console.log(`Creating new sermon note in Firestore`);

          // Ensure we have a userId, even if userData is incomplete
          const userId = userData?.uid || "anonymous";
          console.log(`Using userId: ${userId} for new sermon note`);

          // Remove id field to avoid undefined values in Firestore
          const { id, ...noteWithoutId } = note;
          console.log(`Saving note without id field:`, noteWithoutId);

          const docRef = await addDoc(collection(db, "notes"), {
            ...noteWithoutId,
            userId: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          if (process.env.NODE_ENV === "development") {
            console.log(
              `Successfully created sermon note with ID: ${docRef.id} in Firestore`
            );
          }
          return docRef.id;
        }
      } catch (error) {
        console.error("Failed to save sermon note to Firestore:", error);
        throw new Error(
          "Failed to save your sermon note. Please try again later."
        );
      }
    } else {
      // Save to localStorage
      try {
        if (process.env.NODE_ENV === "development") {
          console.log(`Saving sermon note to localStorage`);
        }

        const notes = getFromLocalStorage("luma_sermon_notes") || [];

        if (note.id && note.id.startsWith("local_")) {
          // Update existing note
          if (process.env.NODE_ENV === "development") {
            console.log(
              `Updating existing note with ID: ${note.id} in localStorage`
            );
          }

          const updatedNotes = notes.map((n: SermonNote) =>
            n.id === note.id
              ? { ...note, updatedAt: new Date().toISOString() }
              : n
          );
          saveToLocalStorage("luma_sermon_notes", updatedNotes);

          if (process.env.NODE_ENV === "development") {
            console.log(`Successfully updated note in localStorage`);
          }
          return note.id;
        } else {
          // Create new note
          const newId = `local_${Date.now()}`;
          if (process.env.NODE_ENV === "development") {
            console.log(`Creating new note with ID: ${newId} in localStorage`);
          }

          const newNote = {
            ...note,
            id: newId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          notes.push(newNote);
          saveToLocalStorage("luma_sermon_notes", notes);

          if (process.env.NODE_ENV === "development") {
            console.log(`Successfully created new note in localStorage`);
          }
          return newNote.id;
        }
      } catch (error) {
        console.error("Failed to save sermon note to localStorage:", error);
        throw new Error(
          "Failed to save your sermon note. Please try again later."
        );
      }
    }
  };

  // Get all sermon notes
  const getSermonNotes = async (userData: any) => {
    // Always try to get from Firestore first
    try {
      // Only log in development
      const isDev = process.env.NODE_ENV === "development";
      if (isDev)
        console.log("Fetching notes from Firestore for user:", userData?.uid);

      // If userData exists and has uid, query by userId
      if (userData?.uid) {
        try {
          // Explicitly set timeout for Firestore query
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Firestore query timeout")),
              4000
            );
          });

          // Create the Firestore query
          const q = query(
            collection(db, "notes"),
            where("userId", "==", userData.uid)
          );

          // Race between query and timeout
          const queryPromise = getDocs(q);
          const querySnapshot = (await Promise.race([
            queryPromise,
            timeoutPromise,
          ])) as any;

          const notes = querySnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
          }));
          if (isDev)
            console.log(`Found ${notes.length} sermon notes in Firestore`);
          return notes;
        } catch (queryError) {
          console.error(
            "Error fetching sermon notes from Firestore:",
            queryError
          );
          // If query times out or fails, return empty array
          return [];
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log("No user ID available, not fetching from Firestore");
        }
        return [];
      }
    } catch (error) {
      console.error("Error in getSermonNotes:", error);

      // Fallback to localStorage if Firestore fails
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("Falling back to localStorage for sermon notes");
        }
        return getFromLocalStorage("luma_sermon_notes") || [];
      } catch (localError) {
        console.error(
          "Error fetching sermon notes from localStorage:",
          localError
        );
        // Return empty array instead of throwing error
        return [];
      }
    }
  };

  // Cache for sermon notes to prevent repeated fetches
  const sermonNoteCache = new Map();

  // Get a single sermon note
  const getSermonNote = async (id: string, userData: any) => {
    // Check cache first
    if (sermonNoteCache.has(id)) {
      if (process.env.NODE_ENV === "development") {
        console.log(`Returning cached sermon note with ID: ${id}`);
      }
      return sermonNoteCache.get(id);
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`Attempting to get sermon note with ID: ${id}`);
    }

    // First try to get from Firestore if the ID doesn't start with "local_"
    if (!id.startsWith("local_")) {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `Trying to get sermon note from Firestore with ID: ${id}`
          );
        }
        const docRef = doc(db, "notes", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          if (process.env.NODE_ENV === "development") {
            console.log(`Found sermon note in Firestore with ID: ${id}`);
          }
          const note = {
            id: docSnap.id,
            ...docSnap.data(),
          };
          // Cache the result
          sermonNoteCache.set(id, note);
          return note;
        } else {
          if (process.env.NODE_ENV === "development") {
            console.log(`Sermon note not found in Firestore with ID: ${id}`);
          }
          // If not found in Firestore, try localStorage
        }
      } catch (error) {
        console.error("Failed to get sermon note from Firestore:", error);
        // Continue to try localStorage if Firestore fails
      }
    }

    // If we're here, either the ID starts with "local_", or the note wasn't found in Firestore
    // Try to get from localStorage
    try {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `Trying to get sermon note from localStorage with ID: ${id}`
        );
      }
      const notes = getFromLocalStorage("luma_sermon_notes") || [];
      if (process.env.NODE_ENV === "development") {
        console.log(`Found ${notes.length} notes in localStorage`);
      }

      const note = notes.find((n: SermonNote) => n.id === id);

      if (note) {
        if (process.env.NODE_ENV === "development") {
          console.log(`Found sermon note in localStorage with ID: ${id}`);
        }
        // Cache the result
        sermonNoteCache.set(id, note);
        return note;
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log(`Sermon note not found in localStorage with ID: ${id}`);
        }
        // Cache the null result to prevent repeated lookups
        sermonNoteCache.set(id, null);
        // Return null instead of throwing error to allow graceful handling
        return null;
      }
    } catch (error) {
      console.error("Failed to get sermon note:", error);
      // Return null instead of throwing error to allow graceful handling
      return null;
    }
  };

  // Delete a sermon note
  const deleteSermonNote = async (
    id: string,
    userData: any,
    forceFirestoreDelete: boolean = true
  ) => {
    // Clear cache for this note ID if it exists
    if (sermonNoteCache.has(id)) {
      sermonNoteCache.delete(id);
    }
    // Always try to delete from Firestore first if ID is not a local ID
    // or if forceFirestoreDelete is true
    if (
      (useFirestore(userData) || forceFirestoreDelete) &&
      !id.startsWith("local_")
    ) {
      // Delete from Firestore
      try {
        const isDev = process.env.NODE_ENV === "development";
        if (isDev)
          console.log(
            `Attempting to delete sermon note with ID: ${id} from Firestore`
          );

        await deleteDoc(doc(db, "notes", id));

        if (isDev)
          console.log(
            `Successfully deleted sermon note with ID: ${id} from Firestore`
          );
        return true; // Return success
      } catch (error) {
        console.error("Failed to delete sermon note from Firestore:", error);
        throw new Error(
          `Failed to delete sermon note from Firestore: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else if (id.startsWith("local_")) {
      // Delete from localStorage
      try {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `Attempting to delete sermon note with ID: ${id} from localStorage`
          );
        }

        const notes = getFromLocalStorage("luma_sermon_notes") || [];
        const updatedNotes = notes.filter((n: SermonNote) => n.id !== id);
        saveToLocalStorage("luma_sermon_notes", updatedNotes);

        if (process.env.NODE_ENV === "development") {
          console.log(
            `Successfully deleted sermon note with ID: ${id} from localStorage`
          );
        }

        return true; // Return success
      } catch (error) {
        console.error("Failed to delete sermon note from localStorage:", error);
        throw new Error(
          `Failed to delete sermon note from localStorage: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else {
      console.error(
        `Cannot delete sermon note with ID: ${id} - Invalid ID or storage location`
      );
      throw new Error(
        "Cannot delete sermon note - Invalid ID or storage location"
      );
    }
  };

  return {
    saveSermonOutline,
    getSermonOutlines,
    getSermonOutline,
    deleteSermonOutline,
    syncToFirestore,
    saveSermonNote,
    getSermonNotes,
    getSermonNote,
    deleteSermonNote,
  };
}
