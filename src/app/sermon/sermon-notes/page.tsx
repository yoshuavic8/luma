"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  FileDown,
  Search,
  Calendar,
  ArrowUpDown
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
// Dialog components removed in favor of native confirm
import BottomNavigation from "@/components/BottomNavigation"
import { useAuth } from "@/contexts/AuthContext"
import { useStorage, SermonNote } from "@/lib/storageService"

export default function SermonNotes() {
  const { user, userData } = useAuth()
  const storage = useStorage()
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [notes, setNotes] = useState<SermonNote[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

  // Load notes on component mount
  useEffect(() => {
    // Use a ref instead of a regular variable
    const isMountedRef = { current: true };

    const loadNotesWithCheck = async () => {
      try {
        setIsLoading(true);
        const fetchedNotes = await storage.getSermonNotes(userData);
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setNotes(fetchedNotes);
        }
      } catch (error) {
        console.error("Error loading notes:", error);
        // Only show toast if component is still mounted
        if (isMountedRef.current) {
          toast({
            title: "Error",
            description: "Failed to load sermon notes",
            variant: "destructive",
          });
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadNotesWithCheck();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [])

  // Function to load notes
  const loadNotes = async () => {
    try {
      setIsLoading(true)
      const fetchedNotes = await storage.getSermonNotes(userData)
      setNotes(fetchedNotes)
      // Remove toast notification for successful loading
      // Only show toast for errors
    } catch (error) {
      console.error("Error loading notes:", error)
      toast({
        title: "Error",
        description: "Failed to load sermon notes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to delete a note
  const deleteNote = async (id: string) => {
    try {
      setIsLoading(true)
      await storage.deleteSermonNote(id, userData)
      setNotes(notes.filter(note => note.id !== id))
      toast({
        title: "Note deleted",
        description: "Sermon note deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Error",
        description: "Failed to delete sermon note",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setNoteToDelete(null)
    }
  }

  // Filter notes based on search term
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort notes by date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0)
    const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0)

    return sortOrder === "desc"
      ? dateB.getTime() - dateA.getTime()
      : dateA.getTime() - dateB.getTime()
  })

  // Format date for display
  const formatDate = (date: any) => {
    if (!date) return "Unknown date"

    try {
      // Handle Firebase Timestamp
      if (typeof date === 'object' && date.seconds) {
        return format(new Date(date.seconds * 1000), "MMM d, yyyy")
      }

      // Handle ISO string
      return format(new Date(date), "MMM d, yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-base md:text-lg font-semibold">Luma</span>
            <span className="text-gray-400 mx-1 md:mx-2">|</span>
            <span className="text-base md:text-lg font-semibold">Sermon Notes</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/home-screen">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Sermon Notes</h1>
            <p className="text-gray-600">Manage your sermon notes</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                type="search"
                placeholder="Search notes..."
                className="pl-10 w-full sm:w-[200px] md:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === "desc" ? "Newest first" : "Oldest first"}
            </Button>

            <Button onClick={() => router.push("/sermon/sermon-note-templates")}>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sermon notes found</h3>
            <p className="text-gray-500 mb-6">Create your first sermon note to get started</p>
            <Button onClick={() => router.push("/sermon/sermon-note-templates")}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Note
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedNotes.map((note) => (
              <Card key={note.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-2 flex-grow">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Last updated: {formatDate(note.updatedAt)}</span>
                  </div>
                  <p className="text-gray-600 line-clamp-3">
                    {note.content.introduction?.content || "No introduction content"}
                  </p>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between border-t">
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/sermon/sermon-note-editor?id=${note.id}`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>

                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/sermon/sermon-note-preview?id=${note.id}`)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this sermon note? This action cannot be undone.')) {
                          deleteNote(note.id || '');
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
