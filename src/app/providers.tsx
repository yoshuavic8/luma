'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

// Import proxy untuk mengatasi masalah CORS
import '@/lib/proxy';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
