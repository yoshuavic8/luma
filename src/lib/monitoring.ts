/**
 * Utility untuk monitoring dan logging
 */

// Konstanta untuk environment
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Fungsi untuk logging dengan level dan konteks
export function logMessage(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: any) {
  // Format timestamp
  const timestamp = new Date().toISOString();
  
  // Buat objek log
  const logObject = {
    timestamp,
    level,
    message,
    ...(context && { context }),
    environment: process.env.NODE_ENV,
  };
  
  // Log sesuai level
  switch (level) {
    case 'info':
      console.info(`[INFO] ${timestamp}:`, message, context || '');
      break;
    case 'warn':
      console.warn(`[WARN] ${timestamp}:`, message, context || '');
      break;
    case 'error':
      console.error(`[ERROR] ${timestamp}:`, message, context || '');
      break;
    case 'debug':
      if (!IS_PRODUCTION) {
        console.debug(`[DEBUG] ${timestamp}:`, message, context || '');
      }
      break;
  }
  
  // Di production, kita bisa mengirim log ke layanan monitoring eksternal
  if (IS_PRODUCTION) {
    // TODO: Kirim log ke layanan monitoring eksternal
  }
  
  return logObject;
}

// Fungsi untuk mengukur performa
export function measurePerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const startTime = performance.now();
  
  return fn().then(result => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    logMessage('info', `Performance: ${name} took ${duration.toFixed(2)}ms`);
    
    return result;
  }).catch(error => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    logMessage('error', `Performance: ${name} failed after ${duration.toFixed(2)}ms`, { error });
    
    throw error;
  });
}

// Fungsi untuk melacak error
export function trackError(error: Error, context?: any) {
  logMessage('error', `Error: ${error.message}`, {
    stack: error.stack,
    ...context,
  });
  
  // Di production, kita bisa mengirim error ke layanan monitoring eksternal
  if (IS_PRODUCTION) {
    // TODO: Kirim error ke layanan monitoring eksternal
  }
}

// Fungsi untuk melacak API request
export function trackApiRequest(endpoint: string, method: string, startTime: number) {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  logMessage('info', `API Request: ${method} ${endpoint} took ${duration.toFixed(2)}ms`);
  
  return {
    endpoint,
    method,
    duration,
    timestamp: new Date().toISOString(),
  };
}

// Fungsi untuk melacak API response
export function trackApiResponse(endpoint: string, method: string, status: number, startTime: number) {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  logMessage('info', `API Response: ${method} ${endpoint} returned ${status} in ${duration.toFixed(2)}ms`);
  
  return {
    endpoint,
    method,
    status,
    duration,
    timestamp: new Date().toISOString(),
  };
}

// Fungsi untuk melacak performa AI
export function trackAiPerformance(model: string, prompt: string, startTime: number, success: boolean) {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  const status = success ? 'succeeded' : 'failed';
  
  logMessage('info', `AI Request: ${model} ${status} in ${duration.toFixed(2)}ms`, {
    promptLength: prompt.length,
  });
  
  return {
    model,
    duration,
    success,
    promptLength: prompt.length,
    timestamp: new Date().toISOString(),
  };
}

// Ekspor objek monitoring
export const monitoring = {
  log: logMessage,
  trackError,
  measurePerformance,
  trackApiRequest,
  trackApiResponse,
  trackAiPerformance,
};

export default monitoring;
