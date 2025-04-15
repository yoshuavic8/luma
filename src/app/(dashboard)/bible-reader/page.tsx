'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  Bookmark,
  Share,
  Menu,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import {
  availableTranslations,
  BibleVerse
} from '@/lib/bibleApi';
import {
  getBibleBooks,
  getBookChapters,
  getChapterVerses,
  getNextChapter,
  getPreviousChapter,
  BibleBook,
  BibleChapter,
  LocalBibleVerse
} from '@/lib/localBibleService';
import { useAuth } from '@/contexts/AuthContext';
import { saveToLocalStorage, getFromLocalStorage } from '@/lib/localStorageService';

export default function BibleReaderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userData } = useAuth();

  // Get parameters from URL or use defaults
  const bookIdParam = searchParams.get('book');
  const chapterParam = searchParams.get('chapter');
  const translationParam = searchParams.get('translation');

  // State for Bible navigation
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number>(bookIdParam ? parseInt(bookIdParam) : 1);
  const [chapters, setChapters] = useState<number[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number>(chapterParam ? parseInt(chapterParam) : 1);
  const [selectedTranslation, setSelectedTranslation] = useState<string>(translationParam || 'indo_tb');
  const [currentChapter, setCurrentChapter] = useState<BibleChapter | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // State for search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // State for bookmarks
  const [bookmarks, setBookmarks] = useState<BibleVerse[]>([]);
  const [recentReadings, setRecentReadings] = useState<{bookId: number; chapter: number; translation: string}[]>([]);

  // Load Bible data
  useEffect(() => {
    async function loadBibleData() {
      try {
        setIsLoading(true);
        setError('');

        // Load all books
        const bibleBooks = await getBibleBooks(selectedTranslation);
        setBooks(bibleBooks);

        // If no book is selected or the selected book doesn't exist, select the first book
        const validBookId = bibleBooks.some(book => book.id === selectedBookId)
          ? selectedBookId
          : (bibleBooks.length > 0 ? bibleBooks[0].id : 1);

        if (validBookId !== selectedBookId) {
          setSelectedBookId(validBookId);
        }

        // Load chapters for the selected book
        const bookChapters = await getBookChapters(validBookId, selectedTranslation);
        setChapters(bookChapters);

        // If no chapter is selected or the selected chapter doesn't exist, select the first chapter
        const validChapter = bookChapters.includes(selectedChapter)
          ? selectedChapter
          : (bookChapters.length > 0 ? bookChapters[0] : 1);

        if (validChapter !== selectedChapter) {
          setSelectedChapter(validChapter);
        }

        // Load verses for the selected chapter
        const chapterData = await getChapterVerses(validBookId, validChapter, selectedTranslation);
        setCurrentChapter(chapterData);

        // Save to recent readings
        saveRecentReading(validBookId, validChapter, selectedTranslation);

        // Update URL without refreshing the page
        router.push(`/bible-reader?book=${validBookId}&chapter=${validChapter}&translation=${selectedTranslation}`,
          { scroll: false });
      } catch (err: any) {
        // Removed console statement
        setError('Failed to load Bible data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadBibleData();
  }, [selectedBookId, selectedChapter, selectedTranslation]);

  // Load bookmarks and recent readings from local storage
  useEffect(() => {
    const savedBookmarks = getFromLocalStorage('luma_bookmarks') || [];
    setBookmarks(savedBookmarks);

    const savedRecentReadings = getFromLocalStorage('luma_recent_readings') || [];
    setRecentReadings(savedRecentReadings);
  }, []);

  // Save recent reading to local storage
  const saveRecentReading = (bookId: number, chapter: number, translation: string) => {
    const currentReading = { bookId, chapter, translation };
    const readings = getFromLocalStorage('luma_recent_readings') || [];

    // Remove duplicate if exists
    const filteredReadings = readings.filter(
      (r: any) => !(r.bookId === bookId && r.chapter === chapter && r.translation === translation)
    );

    // Add current reading to the beginning
    filteredReadings.unshift(currentReading);

    // Keep only the 10 most recent readings
    saveToLocalStorage('luma_recent_readings', filteredReadings.slice(0, 10));

    // Update state
    setRecentReadings(filteredReadings.slice(0, 10));
  };

  // Handle book selection
  const handleBookChange = (bookId: string) => {
    setSelectedBookId(parseInt(bookId));
    setSelectedChapter(1); // Reset to first chapter when book changes
  };

  // Handle chapter selection
  const handleChapterChange = (chapter: string) => {
    setSelectedChapter(parseInt(chapter));
  };

  // Handle translation selection
  const handleTranslationChange = (translation: string) => {
    setSelectedTranslation(translation);
  };

  // Navigate to next chapter
  const handleNextChapter = async () => {
    try {
      const nextChapter = await getNextChapter(selectedBookId, selectedChapter, selectedTranslation);
      if (nextChapter) {
        setSelectedBookId(nextChapter.bookId);
        setSelectedChapter(nextChapter.chapterNumber);
      }
    } catch (err) {
      // Removed console statement
    }
  };

  // Navigate to previous chapter
  const handlePreviousChapter = async () => {
    try {
      const prevChapter = await getPreviousChapter(selectedBookId, selectedChapter, selectedTranslation);
      if (prevChapter) {
        setSelectedBookId(prevChapter.bookId);
        setSelectedChapter(prevChapter.chapterNumber);
      }
    } catch (err) {
      // Removed console statement
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/bible-search?query=${encodeURIComponent(searchQuery)}&translation=${selectedTranslation}`);
    }
  };

  // Toggle bookmark for a verse
  const toggleBookmark = (verse: LocalBibleVerse) => {
    const bookmarks = getFromLocalStorage('luma_bookmarks') || [];
    const verseId = `${verse.book}.${verse.chapter}.${verse.verse}`;

    // Check if verse is already bookmarked
    const existingIndex = bookmarks.findIndex((b: BibleVerse) => b.id === verseId);

    if (existingIndex >= 0) {
      // Remove bookmark
      bookmarks.splice(existingIndex, 1);
    } else {
      // Add bookmark
      const translation = availableTranslations.find(t => t.id === selectedTranslation);
      const newBookmark: BibleVerse = {
        id: verseId,
        reference: `${verse.book_name} ${verse.chapter}:${verse.verse}`,
        text: verse.text,
        translation: translation?.shortname || selectedTranslation
      };
      bookmarks.push(newBookmark);
    }

    // Save to local storage
    saveToLocalStorage('luma_bookmarks', bookmarks);

    // Update state
    setBookmarks(bookmarks);
  };

  // Check if a verse is bookmarked
  const isVerseBookmarked = (verse: LocalBibleVerse): boolean => {
    const verseId = `${verse.book}.${verse.chapter}.${verse.verse}`;
    return bookmarks.some((b: BibleVerse) => b.id === verseId);
  };

  // Get current book name
  const getCurrentBookName = (): string => {
    const book = books.find(b => b.id === selectedBookId);
    return book ? book.name : '';
  };

  // Get current translation name
  const getCurrentTranslationName = (): string => {
    const translation = availableTranslations.find(t => t.id === selectedTranslation);
    return translation ? translation.name : '';
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/home-screen">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">Bible Reader</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Bible Navigation</SheetTitle>
                </SheetHeader>

                <Tabs defaultValue="books" className="mt-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="books">Books</TabsTrigger>
                    <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="books" className="mt-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {books.map(book => (
                        <Button
                          key={book.id}
                          variant={book.id === selectedBookId ? "default" : "outline"}
                          size="sm"
                          className="justify-start"
                          onClick={() => handleBookChange(book.id.toString())}
                        >
                          {book.name}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="bookmarks" className="mt-4 max-h-[70vh] overflow-y-auto">
                    {bookmarks.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No bookmarks yet</p>
                    ) : (
                      <div className="space-y-3">
                        {bookmarks.map((bookmark, index) => {
                          const [book, chapter, verse] = bookmark.id.split('.').map(Number);
                          return (
                            <Card key={index} className="cursor-pointer hover:bg-gray-50"
                              onClick={() => {
                                setSelectedBookId(book);
                                setSelectedChapter(chapter);
                                router.push(`/bible-reader?book=${book}&chapter=${chapter}&translation=${selectedTranslation}`,
                                  { scroll: false });
                              }}
                            >
                              <CardContent className="p-3">
                                <p className="font-medium">{bookmark.reference}</p>
                                <p className="text-sm text-gray-600 line-clamp-2">{bookmark.text}</p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="mt-4 max-h-[70vh] overflow-y-auto">
                    {recentReadings.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No reading history yet</p>
                    ) : (
                      <div className="space-y-3">
                        {recentReadings.map((reading, index) => {
                          const book = books.find(b => b.id === reading.bookId);
                          const translation = availableTranslations.find(t => t.id === reading.translation);
                          return (
                            <Button
                              key={index}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => {
                                setSelectedBookId(reading.bookId);
                                setSelectedChapter(reading.chapter);
                                setSelectedTranslation(reading.translation);
                              }}
                            >
                              <div className="text-left">
                                <p className="font-medium">{book?.name} {reading.chapter}</p>
                                <p className="text-xs text-gray-500">{translation?.name || reading.translation}</p>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Bible Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Select value={selectedBookId.toString()} onValueChange={handleBookChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select book" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {books.map(book => (
                  <SelectItem key={book.id} value={book.id.toString()}>
                    {book.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedChapter.toString()} onValueChange={handleChapterChange}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Chapter" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {chapters.map(chapter => (
                  <SelectItem key={chapter} value={chapter.toString()}>
                    {chapter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedTranslation} onValueChange={handleTranslationChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Translation" />
              </SelectTrigger>
              <SelectContent>
                {availableTranslations.map(translation => (
                  <SelectItem key={translation.id} value={translation.id}>
                    {translation.shortname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Search Dialog */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-16">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Search Bible</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter reference or keyword"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!searchQuery.trim()}>
                    Search
                  </Button>
                </div>

                <p className="text-sm text-gray-500">
                  Search by reference (e.g., "John 3:16") or keyword (e.g., "love")
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Bible Text */}
      <main className="flex-1 px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading Bible text...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div>
            {/* Chapter Title */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold">{getCurrentBookName()} {selectedChapter}</h2>
              <p className="text-gray-500">{getCurrentTranslationName()}</p>
            </div>

            {/* Bible Text */}
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
              <div className="prose prose-lg max-w-none">
                {currentChapter?.verses.map(verse => (
                  <div key={verse.verse} className="group flex mb-4">
                    <span className="text-gray-400 mr-2 text-sm mt-1">{verse.verse}</span>
                    <div className="flex-1">
                      <p className="inline">{verse.text} </p>
                      <button
                        className={`ml-1 opacity-0 group-hover:opacity-100 transition-opacity ${isVerseBookmarked(verse) ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => toggleBookmark(verse)}
                      >
                        <Bookmark className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chapter Navigation */}
            <div className="flex justify-between items-center max-w-3xl mx-auto">
              <Button
                variant="outline"
                onClick={handlePreviousChapter}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="text-center">
                <span className="text-sm text-gray-500">
                  {getCurrentBookName()} {selectedChapter}
                </span>
              </div>

              <Button
                variant="outline"
                onClick={handleNextChapter}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
