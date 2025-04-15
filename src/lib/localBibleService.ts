import { BibleVerse } from './bibleApi'

export interface BibleTranslation {
  id: string
  name: string
  shortname: string
  language: string
  languageCode: string
  path: string
}

export interface LocalBibleVerse {
  book_name: string
  book: number
  chapter: number
  verse: number
  text: string
  // Add a unique identifier for each verse
  id?: string // Optional for backward compatibility
}

export interface BibleBook {
  id: number
  name: string
  chapters: number
}

export interface BibleChapter {
  book: number
  book_name: string
  chapter: number
  verses: LocalBibleVerse[]
}

export interface BibleData {
  metadata: {
    name: string
    shortname: string
    module: string
    year: string
    publisher: string
    owner: string
    description: string
    lang: string
    lang_short: string
  }
  verses: LocalBibleVerse[]
}

// Available Bible translations
export const availableTranslations: BibleTranslation[] = [
  // Indonesian Translations
  {
    id: 'indo_tb',
    name: 'Terjemahan Baru',
    shortname: 'TB',
    language: 'Indonesian',
    languageCode: 'id',
    path: '/assets/bible/ID-Indonesian/indo_tb.json'
  },
  {
    id: 'indo_tm',
    name: 'Terjemahan Modern',
    shortname: 'TM',
    language: 'Indonesian',
    languageCode: 'id',
    path: '/assets/bible/ID-Indonesian/indo_tm.json'
  },
  // English Translations
  {
    id: 'en_asv',
    name: 'American Standard Version',
    shortname: 'ASV',
    language: 'English',
    languageCode: 'en',
    path: '/assets/bible/EN-English/asv.json'
  }
]

// Cache for loaded Bible data
const bibleCache: Record<string, BibleData> = {}

/**
 * Load Bible data from local JSON file
 */
export async function loadBibleData(translationId: string): Promise<BibleData | null> {
  // Return from cache if available
  if (bibleCache[translationId]) {
    return bibleCache[translationId]
  }

  // Find the translation
  const translation = availableTranslations.find(t => t.id === translationId)
  if (!translation) {
    // Removed console statement
    return null
  }

  try {
    // Load the Bible data
    const response = await fetch(translation.path)
    if (!response.ok) {
      throw new Error(`Failed to load Bible data: ${response.status}`)
    }

    const data = await response.json()

    // Add unique ID to each verse if not already present
    if (data.verses && Array.isArray(data.verses)) {
      data.verses = data.verses.map((verse: LocalBibleVerse) => {
        if (!verse.id) {
          // Create a unique ID based on book, chapter, and verse
          verse.id = `${translationId}_${verse.book}_${verse.chapter}_${verse.verse}`
        }
        return verse
      })
    }

    // Cache the data
    bibleCache[translationId] = data

    return data
  } catch (error) {
    // Removed console statement
    return null
  }
}

/**
 * Search for verses in the local Bible data
 * This is a completely rewritten version with better performance and safety measures
 */
export async function searchLocalVerses(
  query: string,
  translationId: string = 'en_asv'
): Promise<BibleVerse[]> {
  // Set a maximum execution time to prevent browser hanging
  const startTime = Date.now()
  const MAX_EXECUTION_TIME = 5000 // 5 seconds max
  const MAX_RESULTS = 50 // Limit results to 50 verses

  // Function to check if we've exceeded the time limit
  const isTimeExceeded = () => Date.now() - startTime > MAX_EXECUTION_TIME

  try {
    // Load Bible data
    const bibleData = await loadBibleData(translationId)
    if (!bibleData) {
      console.error(`Failed to load Bible data for translation ${translationId}`)
      return []
    }

    const translation = availableTranslations.find(t => t.id === translationId)
    if (!translation) {
      console.error(`Translation ${translationId} not found in available translations`)
      return []
    }

    // Normalize and clean the query
    const cleanQuery = query.trim()
    if (!cleanQuery) {
      return []
    }

    // Check if it's a reference search
    const referenceMatch = cleanQuery.match(/^(\d*\s*[\p{L}\s]+)\s*(\d+)(?::(\d+))?$/u)

    if (referenceMatch) {
      // Reference search (e.g., "John 3:16")
      // Removed console statement
      const [, bookName, chapter, verse] = referenceMatch

      // Normalize book name
      const normalizedBookName = bookName.toLowerCase().replace(/\s+/g, '')

      // Create a chapter number for comparison
      const chapterNum = parseInt(chapter, 10)

      // Create a verse number for comparison if provided
      const verseNum = verse ? parseInt(verse, 10) : null

      // Find matching verses with early termination
      const results = []

      // First, try to find exact book matches
      for (let i = 0; i < bibleData.verses.length && results.length < MAX_RESULTS; i++) {
        // Check time limit periodically
        if (i % 1000 === 0 && isTimeExceeded()) {
          console.warn(`Reference search timed out after ${MAX_EXECUTION_TIME}ms`)
          break
        }

        const v = bibleData.verses[i]
        const normalizedVerseBookName = v.book_name.toLowerCase().replace(/\s+/g, '')

        // Check for book match
        const bookMatches =
          normalizedVerseBookName === normalizedBookName ||
          normalizedVerseBookName.includes(normalizedBookName) ||
          normalizedBookName.includes(normalizedVerseBookName)

        // Check for chapter match
        const chapterMatches = v.chapter === chapterNum

        // Check for verse match if provided
        const verseMatches = verseNum === null || v.verse === verseNum

        if (bookMatches && chapterMatches && verseMatches) {
          results.push(convertToStandardFormat(v, translation))
        }
      }

      // Removed console statement
      return results
    } else {
      // Keyword search
      // Removed console statement

      // Split into keywords and filter out empty ones
      const keywords = cleanQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(k => k.length > 0)

      if (keywords.length === 0) {
        return []
      }

      // For very short or common keywords, add a warning
      const shortKeywords = keywords.filter(k => k.length < 3)
      if (shortKeywords.length > 0) {
        console.warn(
          `Search contains very short keywords which may return too many results: ${shortKeywords.join(
            ', '
          )}`
        )
      }

      // Find verses containing any of the keywords with early termination
      const results = []
      const processedVerses = new Set() // To avoid duplicates

      // Process in chunks to allow for time checking
      const CHUNK_SIZE = 500

      for (let i = 0; i < bibleData.verses.length; i += CHUNK_SIZE) {
        // Check time limit at the start of each chunk
        if (isTimeExceeded()) {
          console.warn(`Keyword search timed out after ${MAX_EXECUTION_TIME}ms`)
          break
        }

        // Process a chunk of verses
        const chunk = bibleData.verses.slice(i, i + CHUNK_SIZE)

        for (const verse of chunk) {
          // Skip if we've already processed this verse or reached the limit
          if (processedVerses.has(verse.id) || results.length >= MAX_RESULTS) {
            continue
          }

          const text = verse.text.toLowerCase()

          // Check if any keyword is in the text
          if (keywords.some(keyword => text.includes(keyword))) {
            // Calculate relevance score (number of keywords matched)
            const matchCount = keywords.filter(keyword => text.includes(keyword)).length

            results.push({
              verse: convertToStandardFormat(verse, translation),
              score: matchCount
            })

            processedVerses.add(verse.id)
          }
        }

        // If we have enough results, stop searching
        if (results.length >= MAX_RESULTS) {
          // Removed console statement
          break
        }
      }

      // Sort by relevance score
      results.sort((a, b) => b.score - a.score)

      console.log(`Keyword search found ${results.length} results (limited to ${MAX_RESULTS})`)

      // Return just the verses (without scores)
      return results.map(item => item.verse)
    }
  } catch (error: any) {
    // Removed console statement
    throw new Error(`Failed to search verses: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Get a specific verse by reference
 */
export async function getLocalVerse(
  reference: string,
  translationId: string = 'en_asv'
): Promise<BibleVerse | null> {
  const bibleData = await loadBibleData(translationId)
  if (!bibleData) {
    return null
  }

  const translation = availableTranslations.find(t => t.id === translationId)
  if (!translation) {
    return null
  }

  // Normalize the reference by removing extra spaces and ensuring consistent format
  const normalizedReference = reference.replace(/\s+/g, ' ').trim()
  // Removed console statement

  // Check for cases like "Keluaran 1 0:23" which should be "Keluaran 10:23"
  // This regex looks for book name followed by digits with spaces between them before the colon
  const spacedNumberMatch = normalizedReference.match(/^([\p{L}\s0-9]+?)\s+(\d+)\s+(\d+):(\d+)$/u)

  let bookName, chapter, verse

  if (spacedNumberMatch) {
    // We have something like "Book 1 0:23" which should be "Book 10:23"
    const [, bookPart, num1, num2, verseNum] = spacedNumberMatch
    bookName = bookPart.trim()
    chapter = `${num1}${num2}` // Combine the numbers (e.g., "1" and "0" become "10")
    verse = verseNum
    console.log(
      `Fixed spaced number reference: "${normalizedReference}" -> Book: "${bookName}", Chapter: ${chapter}, Verse: ${verse}`
    )
  } else {
    // Try different regex patterns to match various reference formats
    const referenceMatch =
      normalizedReference.match(/^([\p{L}\s0-9]+)\s*(\d+):(\d+)$/u) ||
      normalizedReference.match(/^([\p{L}\s0-9]+)\s+(\d+):(\d+)$/u) ||
      normalizedReference.match(/^([\p{L}\s0-9]+)\s+(\d+)\s*:\s*(\d+)$/u)

    if (!referenceMatch) {
      // Try one more pattern for cases like "Book Chapter Verse" without colon
      const noColonMatch = normalizedReference.match(/^([\p{L}\s0-9]+)\s+(\d+)\s+(\d+)$/u)
      if (noColonMatch) {
        ;[, bookName, chapter, verse] = noColonMatch
        console.log(
          `Matched reference without colon: Book "${bookName}", Chapter ${chapter}, Verse ${verse}`
        )
      } else {
        // Removed console statement
        return null
      }
    } else {
      ;[, bookName, chapter, verse] = referenceMatch
    }
  }
  console.log(`Looking for verse: Book "${bookName}", Chapter ${chapter}, Verse ${verse}`)

  // Clean up and normalize book name
  // Remove any digits that might have been captured with the book name
  const cleanBookName = bookName.replace(/\d+$/, '').trim()
  const normalizedBookName = cleanBookName.toLowerCase().replace(/\s+/g, '')

  // Find the verse
  const verseData = bibleData.verses.find(v => {
    // Normalize verse book name
    const normalizedVerseBookName = v.book_name.toLowerCase().replace(/\s+/g, '')

    // Check if the normalized book name is contained in the verse book name
    // or if the verse book name is contained in the normalized book name
    const bookMatches =
      normalizedVerseBookName.includes(normalizedBookName) ||
      normalizedBookName.includes(normalizedVerseBookName)

    return bookMatches && v.chapter === parseInt(chapter) && v.verse === parseInt(verse)
  })

  if (!verseData) {
    console.log(`Verse not found: "${reference}" in translation ${translationId}`)
    // Log some sample book names from the Bible data for comparison
    const sampleBooks = [...new Set(bibleData.verses.slice(0, 100).map(v => v.book_name))]
    console.log(`Sample book names in translation ${translationId}:`, sampleBooks)
  }

  if (!verseData) {
    return null
  }

  return convertToStandardFormat(verseData, translation)
}

/**
 * Convert local Bible verse format to standard format
 */
function convertToStandardFormat(
  verse: LocalBibleVerse,
  translation: BibleTranslation
): BibleVerse {
  return {
    id: `${verse.book}.${verse.chapter}.${verse.verse}`,
    reference: `${verse.book_name} ${verse.chapter}:${verse.verse}`,
    text: verse.text,
    translation: translation.shortname
  }
}

/**
 * Get all books in the Bible
 */
export async function getBibleBooks(translationId: string): Promise<BibleBook[]> {
  // translationId: string = "en_asv"
  const bibleData = await loadBibleData(translationId)
  if (!bibleData) {
    return []
  }

  // Create a map to store book information
  const booksMap = new Map<number, { name: string; chapters: Set<number> }>()

  // Process all verses to extract book and chapter information
  bibleData.verses.forEach(verse => {
    if (!booksMap.has(verse.book)) {
      booksMap.set(verse.book, {
        name: verse.book_name,
        chapters: new Set<number>()
      })
    }
    booksMap.get(verse.book)?.chapters.add(verse.chapter)
  })

  // Convert map to array of BibleBook objects
  const books: BibleBook[] = []
  booksMap.forEach((value, key) => {
    books.push({
      id: key,
      name: value.name,
      chapters: value.chapters.size
    })
  })

  // Sort books by ID (which should correspond to their order in the Bible)
  return books.sort((a, b) => a.id - b.id)
}

/**
 * Get all chapters in a book
 */
export async function getBookChapters(
  bookId: number,
  translationId: string = 'en_asv'
): Promise<number[]> {
  const bibleData = await loadBibleData(translationId)
  if (!bibleData) {
    return []
  }

  // Extract all chapter numbers for the specified book
  const chapters = new Set<number>()
  bibleData.verses
    .filter(verse => verse.book === bookId)
    .forEach(verse => chapters.add(verse.chapter))

  // Convert set to array and sort numerically
  return Array.from(chapters).sort((a, b) => a - b)
}

/**
 * Get all verses in a chapter
 */
export async function getChapterVerses(
  bookId: number,
  chapterNumber: number,
  translationId: string = 'en_asv'
): Promise<BibleChapter | null> {
  const bibleData = await loadBibleData(translationId)
  if (!bibleData) {
    return null
  }

  // Filter verses for the specified book and chapter
  const verses = bibleData.verses.filter(
    verse => verse.book === bookId && verse.chapter === chapterNumber
  )

  if (verses.length === 0) {
    return null
  }

  // Sort verses by verse number
  const sortedVerses = verses.sort((a, b) => a.verse - b.verse)

  return {
    book: bookId,
    book_name: sortedVerses[0].book_name,
    chapter: chapterNumber,
    verses: sortedVerses
  }
}

/**
 * Get the next chapter
 */
export async function getNextChapter(
  bookId: number,
  chapterNumber: number,
  translationId: string = 'en_asv'
): Promise<{ bookId: number; chapterNumber: number } | null> {
  const books = await getBibleBooks(translationId)
  if (books.length === 0) {
    return null
  }

  const bookIndex = books.findIndex(book => book.id === bookId)
  if (bookIndex === -1) {
    return null
  }

  const currentBook = books[bookIndex]

  // If there are more chapters in the current book
  if (chapterNumber < currentBook.chapters) {
    return { bookId, chapterNumber: chapterNumber + 1 }
  }

  // If this is the last book, there is no next chapter
  if (bookIndex === books.length - 1) {
    return null
  }

  // Move to the first chapter of the next book
  return { bookId: books[bookIndex + 1].id, chapterNumber: 1 }
}

/**
 * Get the previous chapter
 */
export async function getPreviousChapter(
  bookId: number,
  chapterNumber: number,
  translationId: string = 'en_asv'
): Promise<{ bookId: number; chapterNumber: number } | null> {
  const books = await getBibleBooks(translationId)
  if (books.length === 0) {
    return null
  }

  const bookIndex = books.findIndex(book => book.id === bookId)
  if (bookIndex === -1) {
    return null
  }

  // If there are previous chapters in the current book
  if (chapterNumber > 1) {
    return { bookId, chapterNumber: chapterNumber - 1 }
  }

  // If this is the first book, there is no previous chapter
  if (bookIndex === 0) {
    return null
  }

  // Move to the last chapter of the previous book
  const previousBook = books[bookIndex - 1]
  return { bookId: previousBook.id, chapterNumber: previousBook.chapters }
}
