'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { searchVerses, getVerse, availableTranslations, BibleVerse } from '@/lib/bibleApi'
import { getBibleBooks } from '@/lib/localBibleService'
import { saveToLocalStorage, getFromLocalStorage } from '@/lib/localStorageService'
import BottomNavigation from '@/components/BottomNavigation'
import AIBibleInsights from '@/components/AIBibleInsights'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
// ProtectedRoute is now handled in the layout

export default function BibleSearchPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BibleVerse[]>([])
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [alternativeTranslations, setAlternativeTranslations] = useState<BibleVerse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTranslation, setSelectedTranslation] = useState('indo_tb') // Default to Indonesian TB
  // Used for authentication check in layout.tsx
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userData } = useAuth()
  const router = useRouter()

  // State for recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  // State to track if search has been performed
  const [hasSearched, setHasSearched] = useState<boolean>(false)
  // State for responsive text truncation
  const [maxLength, setMaxLength] = useState(65) // Default to large screens
  const resultsContainerRef = useRef<HTMLDivElement>(null)

  // Update maxLength based on container size
  useEffect(() => {
    if (!resultsContainerRef.current) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        // Sesuaikan maxLength berdasarkan lebar container
        // Kurangi 8 karakter dari setiap batas untuk memberikan margin yang lebih baik
        if (width < 300) {
          setMaxLength(22) // 30 - 8
        } else if (width < 400) {
          setMaxLength(32) // 40 - 8
        } else if (width < 500) {
          setMaxLength(42) // 50 - 8
        } else {
          setMaxLength(57) // 65 - 8
        }
      }
    })

    resizeObserver.observe(resultsContainerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Load recent searches from local storage
  useEffect(() => {
    const savedSearches = getFromLocalStorage('luma_recent_searches') || []
    setRecentSearches(savedSearches)
  }, [])

  // Check for URL parameters when the component mounts
  useEffect(() => {
    const queryParam = searchParams.get('query')
    const translationParam = searchParams.get('translation')

    // Set initial values from URL parameters
    if (queryParam) {
      setQuery(queryParam)
    }

    if (translationParam) {
      setSelectedTranslation(translationParam)
    }
  }, [searchParams]) // Only depend on searchParams

  // Perform search when query or translation changes
  useEffect(() => {
    // Don't search if query is empty
    if (!query.trim()) return

    // Check if we should perform a search
    // Either when URL has a query parameter and we haven't searched yet
    // OR when hasSearched is explicitly set to false (indicating a new search request)
    if ((searchParams.get('query') && !hasSearched) || hasSearched === false) {
      const performSearch = async () => {
        try {
          setHasSearched(true) // Mark that we've performed the search
          setIsLoading(true)
          setError('')
          // Removed console statement

          try {
            // Set a timeout to prevent hanging on large searches
            const searchPromise = searchVerses(query, selectedTranslation)
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Search timeout - query may be too broad')), 10000)
            })

            const data = (await Promise.race([searchPromise, timeoutPromise])) as {
              verses: BibleVerse[]
            }

            // Check if we have too many results
            if (data.verses.length >= 1000) {
              setError('Your search returned too many results. Please use more specific keywords.')
            }

            setResults(data.verses || [])
          } catch (searchError: unknown) {
            const error = searchError as Error
            if (error.message.includes('timeout')) {
              setError('Search took too long. Please use more specific keywords.')
              setResults([])
            } else {
              throw searchError // Re-throw to be caught by the outer catch
            }
          }

          // Save to recent searches
          const searches = [...recentSearches]
          // Remove the query if it already exists (to move it to the top)
          const existingIndex = searches.indexOf(query)
          if (existingIndex !== -1) {
            searches.splice(existingIndex, 1)
          }
          // Add the query to the beginning
          searches.unshift(query)
          // Keep only the 5 most recent searches
          const updatedSearches = searches.slice(0, 5)
          // Save to local storage and update state
          saveToLocalStorage('luma_recent_searches', updatedSearches)
          setRecentSearches(updatedSearches)
        } catch (err: unknown) {
          // Removed console statement
          const error = err as Error
          setError(error.message || 'Failed to search verses. Please try again.')
        } finally {
          setIsLoading(false)
        }
      }

      performSearch()
    }
  }, [query, selectedTranslation, hasSearched, recentSearches, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) return

    // First, explicitly set hasSearched to false to trigger a new search
    setHasSearched(false)

    // Then update the URL - the useEffect will handle the actual search
    // Use a small timeout to ensure state update happens before URL change
    setTimeout(() => {
      router.push(
        `/bible-search?query=${encodeURIComponent(query)}&translation=${selectedTranslation}`,
        { scroll: false }
      )
    }, 0)
  }

  const handleRecentSearch = (searchTerm: string) => {
    setQuery(searchTerm)
    // Reset the hasSearched flag so the useEffect will perform a new search
    setHasSearched(false)

    // Use a small timeout to ensure state updates happen before URL change
    setTimeout(() => {
      router.push(
        `/bible-search?query=${encodeURIComponent(searchTerm)}&translation=${selectedTranslation}`,
        { scroll: false }
      )
    }, 0)
  }

  // Function to get book ID from book name
  const getBookIdFromName = async (bookName: string | undefined) => {
    if (!bookName) return null

    try {
      // Get all Bible books for the selected translation
      const books = await getBibleBooks(selectedTranslation)

      // Normalize the book name for comparison
      const normalizedName = bookName.toLowerCase().trim()

      // Try to find an exact match first
      let matchedBook = books.find(book => book.name.toLowerCase() === normalizedName)

      // If no exact match, try partial match
      if (!matchedBook) {
        matchedBook = books.find(
          book =>
            book.name.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(book.name.toLowerCase())
        )
      }

      return matchedBook ? matchedBook.id : null
    } catch (error) {
      console.error('Error getting book ID:', error)
      return null
    }
  }

  const handleVerseSelect = async (verse: BibleVerse) => {
    setIsLoading(true)
    setError('')
    setSelectedVerse(verse) // Immediately set the selected verse to show something
    setAlternativeTranslations([])

    try {
      // Get the same verse in other translations
      const otherTranslations = availableTranslations.filter(t => t.id !== selectedTranslation)
      const alternativeVerses: BibleVerse[] = []

      // Extract reference parts (book, chapter, verse)
      // First try to parse the reference directly
      let bookName = ''
      let chapter = ''
      let verseNum = ''

      // Normalize the reference by removing extra spaces and ensuring consistent format
      const normalizedReference = verse.reference.replace(/\s+/g, ' ').trim()

      // Check if we have a case like "Keluaran 1 0:23" which should be "Keluaran 10:23"
      // This regex looks for book name followed by digits with spaces between them before the colon
      const spacedNumberMatch = normalizedReference.match(
        /^([\p{L}\s0-9]+?)\s+(\d+)\s+(\d+):(\d+)$/u
      )

      if (spacedNumberMatch) {
        // We have something like "Book 1 0:23" which should be "Book 10:23"
        const [, bookPart, num1, num2, verse] = spacedNumberMatch
        bookName = bookPart.trim()
        chapter = `${num1}${num2}` // Combine the numbers (e.g., "1" and "0" become "10")
        verseNum = verse
        // Removed console statement
      } else {
        // Try different regex patterns to match various reference formats
        const refParts =
          normalizedReference.match(/^([\p{L}\s0-9]+)\s*(\d+):(\d+)$/u) ||
          normalizedReference.match(/^([\p{L}\s0-9]+)\s+(\d+):(\d+)$/u) ||
          normalizedReference.match(/^([\p{L}\s0-9]+)\s+(\d+)\s*:\s*(\d+)$/u)

        if (refParts) {
          ;[, bookName, chapter, verseNum] = refParts
          // Removed console statement

          // Determine the source language based on the selected translation
          const isIndonesianTranslation = selectedTranslation.includes('indo_')
          const sourceLanguage = isIndonesianTranslation ? 'id' : 'en'

          // Fetch the verse in each alternative translation
          for (const translation of otherTranslations) {
            try {
              // Determine target language for this translation
              const isTargetIndonesian = translation.id.includes('indo_')
              const targetLanguage = isTargetIndonesian ? 'id' : 'en'

              // If source and target languages are different, translate the book name
              let translatedBookName = bookName
              if (sourceLanguage !== targetLanguage) {
                // Skip translation for now as it's causing issues
                translatedBookName = bookName
                // Removed console statement
              }

              // Try to get the verse using the reference with appropriate book name
              const reference = `${translatedBookName} ${chapter}:${verseNum}`
              console.log(`Looking for verse in ${translation.id}: ${reference}`)

              // Use a timeout to prevent hanging if the verse can't be found
              const altVersePromise = getVerse(reference, translation.id)
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), 3000)
              })

              const altVerse = (await Promise.race([altVersePromise, timeoutPromise])) as BibleVerse

              if (altVerse) {
                alternativeVerses.push(altVerse)
              }
            } catch (_error) {
              // Removed console statement

              // Try with hardcoded mappings for problematic books
              try {
                let hardcodedBookName = ''
                const lowerBookName = bookName.toLowerCase()

                // Handle specific problematic cases
                if (lowerBookName === 'amsal' && !translation.id.includes('indo_')) {
                  hardcodedBookName = 'Proverbs'
                } else if (lowerBookName === 'yeremia' && !translation.id.includes('indo_')) {
                  hardcodedBookName = 'Jeremiah'
                } else if (lowerBookName === 'wahyu' && !translation.id.includes('indo_')) {
                  hardcodedBookName = 'Revelation'
                } else if (lowerBookName === 'proverbs' && translation.id.includes('indo_')) {
                  hardcodedBookName = 'Amsal'
                } else if (lowerBookName === 'jeremiah' && translation.id.includes('indo_')) {
                  hardcodedBookName = 'Yeremia'
                } else if (lowerBookName === 'revelation' && translation.id.includes('indo_')) {
                  hardcodedBookName = 'Wahyu'
                } else if (
                  (lowerBookName === 'kisah rasul' ||
                    lowerBookName === 'kisah para rasul' ||
                    lowerBookName === 'kisah rasul-rasul') &&
                  !translation.id.includes('indo_')
                ) {
                  hardcodedBookName = 'Acts'
                } else if (lowerBookName === 'acts' && translation.id.includes('indo_')) {
                  hardcodedBookName = 'Kisah Rasul-rasul'
                }

                if (hardcodedBookName) {
                  const reference = `${hardcodedBookName} ${chapter}:${verseNum}`
                  // Removed console statement

                  const altVersePromise = getVerse(reference, translation.id)
                  const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Timeout')), 2000)
                  })

                  const altVerse = (await Promise.race([
                    altVersePromise,
                    timeoutPromise
                  ])) as BibleVerse

                  if (altVerse) {
                    alternativeVerses.push(altVerse)
                    continue // Skip the next fallback if this one worked
                  }
                }

                // If hardcoded mapping failed or wasn't available, try with the original book name as fallback
                const reference = `${bookName} ${chapter}:${verseNum}`
                // Removed console statement

                const altVersePromise = getVerse(reference, translation.id)
                const timeoutPromise = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error('Timeout')), 2000)
                })

                const altVerse = (await Promise.race([
                  altVersePromise,
                  timeoutPromise
                ])) as BibleVerse

                if (altVerse) {
                  alternativeVerses.push(altVerse)
                }
              } catch (_fallbackError) {
                // Removed console statement
                // Continue with other translations
              }
            }
          }
        } else {
          // Removed console statement
        }
      }

      setAlternativeTranslations(alternativeVerses)
    } catch (_err: unknown) {
      // Removed console statement
      // Don't set error here since we already have the selected verse displayed
    } finally {
      setIsLoading(false)
    }
  }

  // Function to highlight search terms in text
  const highlightSearchTerms = (text: string, searchQuery: string): React.ReactNode => {
    // Don't highlight if it's a verse reference search (contains numbers and colons)
    if (/\d+:\d+/.test(searchQuery)) {
      // For verse references, simply truncate the text
      if (text.length <= maxLength) return text
      return `${text.substring(0, maxLength)}...`
    }

    // For keyword searches, highlight the terms
    const keywords = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(k => k.length > 0)

    if (keywords.length === 0) {
      // No keywords to highlight, simply truncate
      if (text.length <= maxLength) return text
      return `${text.substring(0, maxLength)}...`
    }

    // Create a regex pattern for all keywords
    const pattern = new RegExp(`(${keywords.join('|')})`, 'gi')

    // Find all matches with their positions
    const matches: { keyword: string; index: number }[] = []
    let match
    const regex = new RegExp(pattern)

    // Find all matches and their positions
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        keyword: match[0],
        index: match.index
      })

      // Avoid infinite loops with zero-width matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++
      }
    }

    // If no matches found, simply truncate
    if (matches.length === 0) {
      if (text.length <= maxLength) return text
      return `${text.substring(0, maxLength)}...`
    }

    // Determine the best section to show based on matches
    let startPos = 0
    let endPos = Math.min(maxLength, text.length)

    // If text is longer than maxLength, try to center around a match
    if (text.length > maxLength) {
      // Find the first match that can be centered within the maxLength window
      for (const match of matches) {
        // Try to position the match in the middle of the window
        const idealStart = Math.max(0, match.index - Math.floor(maxLength / 2))
        const idealEnd = Math.min(text.length, idealStart + maxLength)

        // Check if this window contains at least one match
        const windowText = text.substring(idealStart, idealEnd)
        if (windowText.toLowerCase().match(pattern)) {
          startPos = idealStart
          // Ensure we don't exceed maxLength characters
          endPos = Math.min(idealEnd, startPos + maxLength)
          break
        }
      }

      // If no good window found, default to showing the first match
      if (startPos === 0 && endPos === maxLength && matches.length > 0) {
        const firstMatch = matches[0]
        startPos = Math.max(0, firstMatch.index - 20) // Show some context before the match
        // Ensure we don't exceed maxLength characters
        endPos = Math.min(text.length, startPos + maxLength)
      }

      // Final check to ensure we never exceed maxLength characters
      if (endPos - startPos > maxLength) {
        endPos = startPos + maxLength
      }
    }

    // Extract the section to display
    const displayText = text.substring(startPos, endPos)

    // Add ellipsis if needed
    const prefix = startPos > 0 ? '...' : ''
    const suffix = endPos < text.length ? '...' : ''

    // Split the display text by the pattern for highlighting
    const parts = displayText.split(pattern)
    const matches2 = displayText.match(pattern) || []

    // Create the highlighted elements
    const elements: React.ReactNode[] = []

    // Add prefix if needed
    if (prefix) elements.push(<span key="prefix">{prefix}</span>)

    // Add highlighted parts
    let matchIndex = 0
    for (let i = 0; i < parts.length; i++) {
      // Add the non-matching part
      if (parts[i]) elements.push(<span key={`p${i}`}>{parts[i]}</span>)

      // Add the matching part (if there is one)
      if (matchIndex < matches2.length) {
        elements.push(
          <span key={`m${i}`} className="bg-yellow-200 font-medium">
            {matches2[matchIndex]}
          </span>
        )
        matchIndex++
      }
    }

    // Add suffix if needed
    if (suffix) elements.push(<span key="suffix">{suffix}</span>)

    return <>{elements}</>
  }

  const handleCopyVerse = () => {
    if (!selectedVerse) return

    const textToCopy = `${selectedVerse.text} - ${selectedVerse.reference} (${selectedVerse.translation})`

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        alert('Verse copied to clipboard!')
      })
      .catch(_err => {
        // Removed console statement
        alert('Failed to copy verse. Please try again.')
      })
  }

  const handleShareVerse = () => {
    if (selectedVerse) {
      // Check if Web Share API is available
      if (navigator.share) {
        navigator
          .share({
            title: `Bible Verse: ${selectedVerse.reference}`,
            text: `${selectedVerse.reference} - "${selectedVerse.text}" (${selectedVerse.translation})`,
            url: window.location.href
          })
          .catch(error => {
            console.error('Error sharing:', error)
          })
      } else {
        // Fallback for browsers that don't support Web Share API
        handleCopyVerse()
        alert('Link copied to clipboard! You can now paste it to share.')
      }
    }
  } // Make sure this semicolon is present

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-base md:text-lg font-semibold">Luma</span>
            <span className="text-gray-400 mx-1 md:mx-2">|</span>
            <span className="text-base md:text-lg font-semibold">Bible Search</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/home-screen">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 md:p-6">
        {/* Search Form */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Search the Bible</CardTitle>
            <CardDescription>
              Enter a verse reference (e.g., &quot;John 3:16&quot;) or keywords to search
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <Input
                  type="text"
                  placeholder="Enter verse reference or keywords..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="flex-1"
                />
                <Select value={selectedTranslation} onValueChange={setSelectedTranslation}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select translation" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTranslations.map(translation => (
                      <SelectItem key={translation.id} value={translation.id}>
                        {translation.name} ({translation.shortname})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={isLoading || !query.trim()}>
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </form>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-500">Recent Searches:</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecentSearch(search)}
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results and Verse Details */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Search Results */}
          <Card>
            <CardHeader className="pb-2 border-b">
              <CardTitle>Search Results</CardTitle>
              {results.length > 0 && (
                <CardDescription>{results.length} verses found</CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-0" ref={resultsContainerRef}>
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-center text-gray-500">Searching...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-center text-gray-500">
                    {query.trim()
                      ? 'No verses found. Try a different search.'
                      : 'Enter a search term to find verses.'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {results.map(verse => (
                    <li key={verse.id} className="relative">
                      {selectedVerse?.id === verse.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4/5 bg-blue-500 rounded-r-md"></div>
                      )}
                      <Button
                        variant={selectedVerse?.id === verse.id ? 'default' : 'ghost'}
                        className={`w-full justify-start text-left transition-colors ${selectedVerse?.id === verse.id ? 'bg-blue-50 hover:bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                        onClick={() => handleVerseSelect(verse)}
                      >
                        <div className="w-full">
                          <p
                            className={`font-medium ${selectedVerse?.id === verse.id ? 'text-blue-800' : ''}`}
                          >
                            {verse.reference}
                          </p>
                          <p
                            className={`${selectedVerse?.id === verse.id ? 'text-blue-700' : 'text-gray-600'}`}
                          >
                            {highlightSearchTerms(verse.text, query)}
                          </p>
                        </div>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Verse Details */}
          <Card>
            <CardHeader className="pb-2 border-b">
              <CardTitle>Verse Details</CardTitle>
              {selectedVerse && (
                <CardDescription className="font-medium text-base">
                  {selectedVerse.reference}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {selectedVerse ? (
                <div className="space-y-6">
                  {/* Primary Translation */}
                  <div className="rounded-md bg-blue-50 p-5 shadow-inner border border-blue-100 relative">
                    <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md shadow-sm">
                      {selectedVerse.translation}
                    </div>
                    <p className="text-lg leading-relaxed whitespace-pre-line text-blue-900 mt-3">
                      &ldquo;{selectedVerse.text}&rdquo;
                    </p>
                    <p className="text-right mt-3 text-sm font-medium text-blue-700">
                      {selectedVerse.reference}
                    </p>
                  </div>

                  {/* Alternative Translations */}
                  {alternativeTranslations.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-500">Other Translations:</h3>
                      {alternativeTranslations.map((altVerse, index) => (
                        <div
                          key={index}
                          className="rounded-md bg-gray-50 p-4 shadow-inner border border-gray-100 relative"
                        >
                          <div className="absolute -top-2 -left-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-md shadow-sm">
                            {altVerse.translation}
                          </div>
                          <p className="text-lg leading-relaxed whitespace-pre-line text-gray-800 mt-2">
                            &ldquo;{altVerse.text}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-500">Actions:</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyVerse}
                        className="flex items-center gap-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-clipboard"
                        >
                          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        </svg>
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={handleShareVerse}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-share"
                        >
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" x2="12" y1="2" y2="15" />
                        </svg>
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={async () => {
                          // Parse the verse reference properly
                          const reference = selectedVerse.reference
                          console.log('Opening verse in Bible Reader:', reference)

                          // Handle different reference formats
                          let book, chapter, verse

                          // Try to extract book, chapter, and verse
                          const colonParts = reference.split(':')
                          if (colonParts.length === 2) {
                            // Format: "Book Chapter:Verse"
                            verse = colonParts[1].trim()

                            // Now extract book and chapter
                            const spaceParts = colonParts[0].trim().split(' ')
                            if (spaceParts.length >= 2) {
                              // Last part is the chapter
                              chapter = spaceParts[spaceParts.length - 1]
                              // Everything else is the book name
                              book = spaceParts.slice(0, spaceParts.length - 1).join(' ')
                            }
                          }

                          try {
                            // Get all Bible books for the selected translation
                            const books = await getBibleBooks(selectedTranslation)
                            console.log(`Loaded ${books.length} books for ${selectedTranslation}`)

                            // Try to find the book by name
                            const normalizedBookName = book?.toLowerCase().trim() || ''

                            // Try exact match first
                            let matchedBook = books.find(
                              b => b.name.toLowerCase() === normalizedBookName
                            )

                            // If no exact match, try partial match
                            if (!matchedBook) {
                              matchedBook = books.find(
                                b =>
                                  b.name.toLowerCase().includes(normalizedBookName) ||
                                  normalizedBookName.includes(b.name.toLowerCase())
                              )
                            }

                            if (matchedBook) {
                              console.log(`Found book: ${matchedBook.name} (ID: ${matchedBook.id})`)
                              router.push(
                                `/bible-reader?book=${matchedBook.id}&chapter=${chapter}&verse=${verse}&translation=${selectedTranslation}`
                              )
                              return
                            }
                          } catch (error) {
                            console.error('Error finding book:', error)
                          }

                          // Fallback to direct navigation if book matching fails
                          if (book && chapter && verse) {
                            console.log(`Fallback navigation with: ${book}, ${chapter}, ${verse}`)
                            router.push(
                              `/bible-reader?book=${book}&chapter=${chapter}&verse=${verse}&translation=${selectedTranslation}`
                            )
                          } else {
                            alert('Could not parse verse reference. Please try another verse.')
                          }

                          if (book && chapter && verse) {
                            router.push(
                              `/bible-reader?book=${book}&chapter=${chapter}&verse=${verse}&translation=${selectedTranslation}`
                            )
                          } else {
                            // Fallback if parsing fails
                            alert('Could not parse verse reference. Please try another verse.')
                          }
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-book-open"
                        >
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        Read in Context
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        onClick={() => setShowAIInsights(true)}
                      >
                        <Sparkles className="h-4 w-4" />
                        AI Insights
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-center text-gray-500">
                    Select a verse from the search results to view details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* AI Bible Insights Modal */}
      {showAIInsights && selectedVerse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <AIBibleInsights verse={selectedVerse} onClose={() => setShowAIInsights(false)} />
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
