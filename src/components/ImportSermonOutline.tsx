"use client"

import { useState, useEffect } from "react"
import { X, FileText, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useStorage } from "@/lib/storageService"
import { useAuth } from "@/contexts/AuthContext"
import { SermonOutline } from "@/lib/aiService"

interface ImportSermonOutlineProps {
  onImportOutline: (outline: SermonOutline) => void
  onClose: () => void
}

export default function ImportSermonOutline({ onImportOutline, onClose }: ImportSermonOutlineProps) {
  const { userData } = useAuth()
  const storage = useStorage()
  const [isLoading, setIsLoading] = useState(true)
  const [outlines, setOutlines] = useState<SermonOutline[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    const loadOutlines = async () => {
      try {
        setIsLoading(true)
        const fetchedOutlines = await storage.getSermonOutlines(userData)
        setOutlines(fetchedOutlines || [])
      } catch (error) {
        console.error("Error loading outlines:", error)
        setError("Failed to load sermon outlines. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadOutlines()
  }, [storage, userData])

  const handleImport = (outline: SermonOutline) => {
    onImportOutline(outline)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Import Sermon Outline</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : outlines.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No sermon outlines found</p>
              <p className="text-sm text-gray-400 mt-1">
                Generate outlines in the Sermon Builder first
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <div className="space-y-3">
                {outlines.map((outline) => (
                  <div
                    key={outline.id}
                    className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{outline.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{outline.scripture}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {outline.mainPoints.length} points
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleImport(outline)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Import
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
