'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Presentation, File, User } from 'lucide-react';

export default function BottomNavigation() {
  const pathname = usePathname();

  // Function to determine if a link is active
  const isActive = (path: string) => {
    if (path === '/home-screen' && pathname === '/home-screen') {
      return true;
    }
    if (path === '/bible-reader' && (pathname === '/bible-reader' || pathname.startsWith('/bible-reader'))) {
      return true;
    }
    if (path === '/sermon/sermon-builder' && pathname.includes('/sermon/sermon-builder')) {
      return true;
    }
    if (path === '/sermon/sermon-notes' && (
      pathname.includes('/sermon/sermon-notes') ||
      pathname.includes('/sermon/sermon-note-editor') ||
      pathname.includes('/sermon/sermon-note-preview')
    )) {
      return true;
    }
    if (path === '/settings' && pathname === '/settings') {
      return true;
    }
    return false;
  };

  return (
    <nav className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-center justify-around">
        <Link href="/home-screen" className={`flex flex-col items-center ${isActive('/home-screen') ? 'text-[#2c3e50]' : 'text-gray-500'}`}>
          <Home className="h-5 w-5" />
          <span className="mt-1 text-xs">Home</span>
        </Link>
        <Link href="/bible-reader" className={`flex flex-col items-center ${isActive('/bible-reader') ? 'text-[#2c3e50]' : 'text-gray-500'}`}>
          <BookOpen className="h-5 w-5" />
          <span className="mt-1 text-xs">Bible</span>
        </Link>
        <Link href="/sermon/sermon-builder" className={`flex flex-col items-center ${isActive('/sermon/sermon-builder') ? 'text-[#2c3e50]' : 'text-gray-500'}`}>
          <Presentation className="h-5 w-5" />
          <span className="mt-1 text-xs">Sermon</span>
        </Link>
        <Link href="/sermon/sermon-notes" className={`flex flex-col items-center ${isActive('/sermon/sermon-notes') ? 'text-[#2c3e50]' : 'text-gray-500'}`}>
          <File className="h-5 w-5" />
          <span className="mt-1 text-xs">Notes</span>
        </Link>
        <Link href="/settings" className={`flex flex-col items-center ${isActive('/settings') ? 'text-[#2c3e50]' : 'text-gray-500'}`}>
          <User className="h-5 w-5" />
          <span className="mt-1 text-xs">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
