'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bookmark, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DailyVerse {
  id: number;
  ayat: string;
  content: string;
  pic?: number; // Optional field for picture reference
}

export default function TodaysVerse() {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRandomVerse = async () => {
    setIsLoading(true);
    try {
      // Fetch verses from the public JSON file
      const response = await fetch('/assets/bible/daily/daily.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch verses: ${response.status}`);
      }

      const verses: DailyVerse[] = await response.json();

      if (verses && verses.length > 0) {
        // Get a random verse
        const randomIndex = Math.floor(Math.random() * verses.length);
        setVerse(verses[randomIndex]);
      } else {
        // Removed console statement
      }
    } catch (error) {
      // Removed console statement
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRandomVerse();
  }, []);

  return (
    <Card className="col-span-2 border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-medium text-[#2c3e50]">
          Today&apos;s Verse
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={loadRandomVerse}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 text-[#2c3e50]" />
              <span className="sr-only">Refresh</span>
            </Button>
            <Bookmark className="h-4 w-4 text-[#2c3e50]" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-16">
            <p className="text-sm text-gray-500">Loading verse...</p>
          </div>
        ) : verse ? (
          <>
            <p className="text-sm text-gray-700">
              &quot;{verse.content}&quot;
            </p>
            <p className="mt-2 text-xs font-medium text-[#2c3e50]">{verse.ayat}</p>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Could not load daily verse. Please try again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
