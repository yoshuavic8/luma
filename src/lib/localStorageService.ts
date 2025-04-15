// Simple encryption for localStorage
const encryptData = (data: any): string => {
  try {
    // In a real app, use a proper encryption library
    // This is just a simple obfuscation
    const jsonString = JSON.stringify(data);
    return btoa(jsonString); // Base64 encoding
  } catch (error) {
    // Removed console statement
    return '';
  }
};

const decryptData = (encryptedData: string): any => {
  try {
    // In a real app, use a proper decryption method
    const jsonString = atob(encryptedData); // Base64 decoding
    return JSON.parse(jsonString);
  } catch (error) {
    // Removed console statement
    return null;
  }
};

// Save data to localStorage with encryption
export const saveToLocalStorage = (key: string, data: any): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const encryptedData = encryptData(data);
    localStorage.setItem(key, encryptedData);
  } catch (error) {
    // Removed console statement
  }
};

// Get data from localStorage with decryption
export const getFromLocalStorage = (key: string): any => {
  if (typeof window === 'undefined') return null;
  
  try {
    const encryptedData = localStorage.getItem(key);
    if (!encryptedData) return null;
    
    return decryptData(encryptedData);
  } catch (error) {
    // Removed console statement
    return null;
  }
};

// Remove data from localStorage
export const removeFromLocalStorage = (key: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Removed console statement
  }
};

// Clear all app data from localStorage
export const clearAppData = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const appKeys = [
      'luma_sermon_outlines',
      'luma_saved_verses',
      'luma_recent_searches'
    ];
    
    appKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    // Removed console statement
  }
};
