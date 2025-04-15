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
      if (url.includes('firestore.googleapis.com')) {
        // Redirect ke proxy API jika mengakses dari IP lokal
        if (window.location.hostname === '192.168.18.216' || 
            window.location.hostname.startsWith('192.168.')) {
          // Ubah URL ke proxy API
          const proxyUrl = '/api/firebase-proxy';
          return originalOpen.call(this, method, proxyUrl, ...args);
        }
      }
      
      return originalOpen.call(this, method, url, ...args);
    };
    
    return xhr;
  };
  
  // Override fetch API untuk menambahkan header CORS
  window.fetch = function(url, options = {}) {
    if (typeof url === 'string' && url.includes('firestore.googleapis.com')) {
      // Redirect ke proxy API jika mengakses dari IP lokal
      if (window.location.hostname === '192.168.18.216' || 
          window.location.hostname.startsWith('192.168.')) {
        // Ubah URL ke proxy API
        const proxyUrl = '/api/firebase-proxy';
        
        // Tambahkan URL asli dan metode ke body
        options.body = JSON.stringify({
          url: url,
          method: options.method || 'GET',
          headers: options.headers || {},
          data: options.body ? JSON.parse(options.body) : null
        });
        
        // Ubah metode ke POST untuk proxy
        options.method = 'POST';
        
        // Pastikan headers ada
        options.headers = {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        };
        
        return originalFetch(proxyUrl, options);
      }
    }
    
    return originalFetch(url, options);
  };
}

export default {};
