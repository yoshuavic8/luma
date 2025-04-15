"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { searchVerses, BibleVerse, availableTranslations } from "@/lib/bibleApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BibleVerseSearchProps {
  onSelectVerse: (verse: BibleVerse) => void
  onClose: () => void
  initialQuery?: string
}

export default function BibleVerseSearch({ onSelectVerse, onClose, initialQuery = "" }: BibleVerseSearchProps) {
  console.log('BibleVerseSearch initialQuery:', initialQuery);
  const [query, setQuery] = useState(initialQuery)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([])
  const [selectedTranslation, setSelectedTranslation] = useState("en_asv")
  const [error, setError] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setError("")
    setSearchResults([])

    try {
      const results = await searchVerses(query, selectedTranslation)
      setSearchResults(results.verses || [])

      if (results.verses.length === 0) {
        setError("No verses found. Try a different search term or translation.")
      }
    } catch (error) {
      console.error("Error searching verses:", error)
      setError("Failed to search verses. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Search Bible Verses</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search by reference or keyword..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Select
              value={selectedTranslation}
              onValueChange={setSelectedTranslation}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Translation" />
              </SelectTrigger>
              <SelectContent>
                {availableTranslations.map((translation) => (
                  <SelectItem key={translation.id} value={translation.id}>
                    {translation.shortname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSearch} disabled={isSearching} className="w-full">
            {isSearching ? "Searching..." : "Search"}
          </Button>

          {error && (
            <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}

          <div className="mt-4 max-h-[300px] overflow-y-auto">
            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((verse) => (
                  <div
                    key={verse.id}
                    className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{verse.reference}</p>
                        <p className="text-sm mt-1">{verse.text.length > 100
                          ? `${verse.text.substring(0, 100)}...`
                          : verse.text}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          // Make sure we're passing the complete verse object
                          console.log('Selecting verse:', verse);
                          onSelectVerse(verse);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
