'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function BibleSearchLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
