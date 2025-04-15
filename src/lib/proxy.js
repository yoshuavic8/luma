// Proxy untuk mengatasi masalah CORS dengan Firebase
// Ini akan dijalankan di sisi klien untuk mengganti XMLHttpRequest dan fetch API

if (typeof window !== 'undefined') {
  // Simpan referensi asli
  const originalXHR = window.XMLHttpRequest;
  const originalFetch = window.fetch;

  // Override XMLHttpRequest untuk menambahkan header CORS
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;

    xhr.open = function(method, url, ...args) {
      // Tambahkan header CORS untuk permintaan ke Firebase
      if (typeof url === 'string' && url.includes('firestore.googleapis.com')) {
        console.log('Intercepting XHR to Firestore:', url);
        // Selalu gunakan proxy API untuk permintaan Firestore
        const proxyUrl = '/api/firebase-proxy';
        return originalOpen.call(this, method, proxyUrl, ...args);
      }

      return originalOpen.call(this, method, url, ...args);
    };

    return xhr;
  };

  // Override fetch API untuk menambahkan header CORS
  window.fetch = function(url, options = {}) {
    if (typeof url === 'string' && url.includes('firestore.googleapis.com')) {
      console.log('Intercepting fetch to Firestore:', url);
      // Selalu gunakan proxy API untuk permintaan Firestore
      const proxyUrl = '/api/firebase-proxy';

      // Tambahkan URL asli dan metode ke body
      const proxyOptions = {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        body: JSON.stringify({
          url: url,
          method: options.method || 'GET',
          headers: options.headers || {},
          data: options.body ? JSON.parse(options.body) : null
        })
      };

      return originalFetch(proxyUrl, proxyOptions);
    }

    return originalFetch(url, options);
  };

  console.log('Firebase proxy initialized (all Firestore requests will be proxied)');

  // Tambahkan flag untuk menandai bahwa proxy telah diinisialisasi
  window._FIREBASE_PROXY_INITIALIZED = true;
}

const proxyModule = {};
export default proxyModule;
