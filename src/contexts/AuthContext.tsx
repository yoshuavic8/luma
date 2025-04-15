'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Define user data interface
export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  tier: 'free' | 'pro';
  usageCount: number;
  lastUsageReset: string;
  createdAt: any;
}

// Define auth context interface
interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  incrementUsage: () => Promise<boolean>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  incrementUsage: async () => false,
});

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to increment usage count
  const incrementUsage = async (): Promise<boolean> => {
    if (!user || !userData) return false;

    try {
      // Check if we need to reset the usage count (daily reset)
      const lastReset = new Date(userData.lastUsageReset);
      const now = new Date();
      const isNewDay = lastReset.getDate() !== now.getDate() ||
                      lastReset.getMonth() !== now.getMonth() ||
                      lastReset.getFullYear() !== now.getFullYear();

      // If it's a new day, reset the count
      if (isNewDay) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          usageCount: 1,
          lastUsageReset: now.toISOString()
        });

        setUserData({
          ...userData,
          usageCount: 1,
          lastUsageReset: now.toISOString()
        });

        return true;
      }

      // Check if user has reached their limit
      if (userData.tier === 'free' && userData.usageCount >= 5) {
        return false;
      }

      // Increment the count
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        usageCount: userData.usageCount + 1
      });

      setUserData({
        ...userData,
        usageCount: userData.usageCount + 1
      });

      return true;
    } catch (error) {
      // Removed console statement
      return false;
    }
  };

  useEffect(() => {
    // Removed console statement

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Removed console statement
      setUser(currentUser);

      if (currentUser) {
        try {
          // Removed console statement
          // Fetch user data from Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);

          try {
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              // Removed console statement
              setUserData(userDoc.data() as UserData);
            } else {
              // Removed console statement
              // Create new user document if it doesn't exist
              const newUserData: UserData = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                tier: 'free',
                usageCount: 0,
                lastUsageReset: new Date().toISOString(),
                createdAt: serverTimestamp()
              };

              try {
                await setDoc(userDocRef, newUserData);
                // Removed console statement
                setUserData(newUserData);
              } catch (docError) {
                // Removed console statement
                // Still set the user data even if saving to Firestore fails
                setUserData(newUserData);
              }
            }
          } catch (getDocError) {
            // Removed console statement
            // Create a basic user data object if Firestore access fails
            const fallbackUserData: UserData = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              tier: 'free',
              usageCount: 0,
              lastUsageReset: new Date().toISOString(),
              createdAt: null
            };
            setUserData(fallbackUserData);
          }
        } catch (error) {
          // Removed console statement
          // Set basic user data even if there's an error
          const fallbackUserData: UserData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            tier: 'free',
            usageCount: 0,
            lastUsageReset: new Date().toISOString(),
            createdAt: null
          };
          setUserData(fallbackUserData);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    }, (error) => {
      // Error handler for onAuthStateChanged
      // Removed console statement
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, incrementUsage }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);
