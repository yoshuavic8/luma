'use client';

import { ReactNode } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Re-enable ProtectedRoute now that we've fixed the routing issue
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
