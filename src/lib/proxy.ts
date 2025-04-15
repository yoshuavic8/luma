/**
 * Firebase Proxy untuk mengatasi masalah CORS
 * 
 * File ini mengimplementasikan proxy untuk permintaan Firestore
 * dengan menggunakan API route lokal sebagai perantara.
 */

// Hanya jalankan di browser
if (typeof window !== 'undefined') {
  // Intercept Firestore requests
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const inputUrl = input instanceof Request ? input.url : input.toString();
    
    // Cek apakah ini adalah permintaan ke Firestore
    if (inputUrl.includes('firestore.googleapis.com')) {
      console.log('Intercepting Firestore request:', inputUrl);
      
      // Gunakan API route lokal sebagai proxy
      const proxyUrl = '/api/firebase-proxy';
      
      // Buat body untuk permintaan proxy
      const proxyBody = {
        url: inputUrl,
        method: init?.method || 'GET',
        headers: init?.headers,
        data: init?.body ? JSON.parse(init.body.toString()) : undefined
      };
      
      // Kirim permintaan melalui proxy
      return originalFetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proxyBody)
      });
    }
    
    // Untuk permintaan non-Firestore, gunakan fetch asli
    return originalFetch(input, init);
  };
  
  console.log('Firebase proxy initialized');
}

export {};
