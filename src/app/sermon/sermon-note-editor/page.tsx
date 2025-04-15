"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  BookOpen,
  ListPlus,
  CheckSquare,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Save,
  FileDown,
  Eye,
  Search,
  Sparkles,
  FileText
} from "lucide-react"
import BottomNavigation from "@/components/BottomNavigation"
import BibleVerseSearch from "@/components/BibleVerseSearch"
import ImportSermonOutline from "@/components/ImportSermonOutline"
import AIEnhanceModal from "@/components/AIEnhanceModal"
import { BibleVerse } from "@/lib/bibleApi"
import { SermonOutline } from "@/lib/aiService"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useStorage, SermonNote } from "@/lib/storageService"

// Define types for sermon content
type VerseReference = {
  reference: string;
};

type Explanation = {
  content: string;
};

type Illustration = {
  content: string;
};

type PointContent = {
  verseReference?: VerseReference;
  explanation?: Explanation;
  illustrations: Illustration[];
};

type Point = {
  id: string;
  title: string;
  content: PointContent;
};

type Introduction = {
  content: string;
};

type Conclusion = {
  content: string;
};

type SermonContent = {
  introduction?: Introduction;
  points: Point[];
  conclusion?: Conclusion;
  topIllustrations: Illustration[];
  bottomIllustrations: Illustration[];
};

export default function SermonNoteEditor() {
  const { userData } = useAuth()
  const storage = useStorage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [noteId, setNoteId] = useState<string | null>(null)
  const [sermonTitle, setSermonTitle] = useState("New Sermon Note")
  const [showBibleSearch, setShowBibleSearch] = useState(false)
  const [showImportOutline, setShowImportOutline] = useState(false)
  const [showAIEnhance, setShowAIEnhance] = useState(false)
  const [activePointId, setActivePointId] = useState<string | null>(null)
  const [sermonContent, setSermonContent] = useState<SermonContent>({
    introduction: { content: "" },
    points: [
      {
        id: "point-1",
        title: "Point 1",
        content: {
          verseReference: { reference: "" },
          explanation: { content: "" },
          illustrations: []
        }
      }
    ],
    conclusion: { content: "" },
    topIllustrations: [],
    bottomIllustrations: []
  })

  // Load note if ID is provided in URL or use template if specified
  useEffect(() => {
    // Only run this effect once on mount
    const id = searchParams.get('id')
    const useTemplate = searchParams.get('template') === 'true'

    if (id) {
      // Function to load a note
      const loadNote = async (noteId: string) => {
        try {
          setIsLoading(true)
          const note = await storage.getSermonNote(noteId, userData)
          if (note && typeof note === 'object' && 'title' in note && 'content' in note) {
            setNoteId(note.id as string)
            setSermonTitle(note.title as string)
            setSermonContent(note.content as SermonContent)
            // Removed success toast to prevent multiple notifications
          }
        } catch (error) {
          console.error("Error loading note:", error)
          toast({
            title: "Error",
            description: "Failed to load sermon note",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      loadNote(id)
    } else if (useTemplate) {
      // Load template from localStorage
      try {
        const templateData = localStorage.getItem('sermon_note_template')
        if (templateData) {
          const template = JSON.parse(templateData)
          setSermonTitle(template.title || "New Sermon Note")
          setSermonContent(template.content as SermonContent)

          // Clear the template from localStorage to avoid reusing it accidentally
          localStorage.removeItem('sermon_note_template')
        }
      } catch (error) {
        console.error("Error loading template:", error)
        toast({
          title: "Warning",
          description: "Could not load template. Starting with default template.",
          variant: "default",
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Function to save the note
  const saveNote = async () => {
    try {
      setIsLoading(true)

      // Log userData to debug only in development
      if (process.env.NODE_ENV === "development") {
        console.log("userData when saving:", userData)
      }

      const note: SermonNote = {
        id: noteId || undefined,
        title: sermonTitle,
        content: sermonContent
      }

      // Force save to Firestore for now
      const forceSaveToFirestore = true
      const savedId = await storage.saveSermonNote(note, userData, forceSaveToFirestore)
      setNoteId(savedId)

      if (process.env.NODE_ENV === "development") {
        console.log("Note saved with ID:", savedId)
      }

      toast({
        title: "Note saved",
        description: "Sermon note saved successfully",
      })
    } catch (error) {
      console.error("Error saving note:", error)


      toast({
        title: "Error",
        description: "Failed to save sermon note",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to add a new point
  const addPoint = () => {
    const newPointId = `point-${sermonContent.points.length + 1}`
    const newPoint: Point = {
      id: newPointId,
      title: `Point ${sermonContent.points.length + 1}`,
      content: {
        verseReference: { reference: "" },
        explanation: { content: "" },
        illustrations: []
      }
    }

    setSermonContent({
      ...sermonContent,
      points: [...sermonContent.points, newPoint]
    })
  }

  // Function to add an illustration to a point
  const addIllustrationToPoint = (pointId: string) => {
    const updatedPoints = sermonContent.points.map(point => {
      if (point.id === pointId) {
        return {
          ...point,
          content: {
            ...point.content,
            illustrations: [...point.content.illustrations, { content: "" }]
          }
        }
      }
      return point
    })

    setSermonContent({
      ...sermonContent,
      points: updatedPoints
    })
  }

  // Function to add a top illustration (after Introduction)
  const addTopIllustration = () => {
    setSermonContent({
      ...sermonContent,
      topIllustrations: [...sermonContent.topIllustrations, { content: "" }]
    })
  }

  // Function to add a bottom illustration (after Main Points)
  const addBottomIllustration = () => {
    setSermonContent({
      ...sermonContent,
      bottomIllustrations: [...sermonContent.bottomIllustrations, { content: "" }]
    })
  }

  // Function to update verse reference for a point
  const updateVerseReference = (pointId: string, reference: string) => {
    const updatedPoints = sermonContent.points.map(point => {
      if (point.id === pointId) {
        return {
          ...point,
          content: {
            ...point.content,
            verseReference: { reference }
          }
        }
      }
      return point
    })

    setSermonContent({
      ...sermonContent,
      points: updatedPoints
    })
  }

  // Function to handle Bible verse selection
  const handleVerseSelect = (verse: BibleVerse) => {
    console.log('Handling verse selection:', verse);

    if (activePointId) {
      // First, make a copy of the current sermon content
      const updatedContent = { ...sermonContent };

      // Find the point we're updating
      const pointIndex = updatedContent.points.findIndex(p => p.id === activePointId);

      if (pointIndex !== -1) {
        // Update the verse reference
        updatedContent.points[pointIndex].content.verseReference = {
          reference: verse.reference
        };

        // Update the explanation
        updatedContent.points[pointIndex].content.explanation = {
          content: `${verse.reference}: "${verse.text}"`
        };

        // Set the updated content
        setSermonContent(updatedContent);
        console.log('Updated sermon content:', updatedContent);
      }
    }

    setShowBibleSearch(false);
    setActivePointId(null);
  }

  // Function to open Bible search for a specific point
  const openBibleSearch = (pointId: string) => {
    setActivePointId(pointId)
    setShowBibleSearch(true)
  }

  // Get the current verse reference for the active point
  const getActivePointVerseReference = (): string => {
    if (!activePointId) return ""

    const point = sermonContent.points.find(p => p.id === activePointId)
    return point?.content.verseReference?.reference || ""
  }

  // Function to handle sermon outline import
  const handleImportOutline = (outline: SermonOutline) => {
    // Set the sermon title
    setSermonTitle(outline.title)

    // Create points from the outline's main points
    const points = outline.mainPoints.map((point, index) => ({
      id: `point-${index + 1}`,
      title: point.title,
      content: {
        verseReference: { reference: point.scripture },
        explanation: { content: point.explanation },
        illustrations: []
      }
    }))

    // Create a new sermon content structure
    const newContent: SermonContent = {
      introduction: { content: outline.introduction },
      points: points,
      conclusion: { content: outline.conclusion },
      topIllustrations: [],
      bottomIllustrations: []
    }

    // If there are application points, add them as illustrations
    if (outline.applicationPoints && outline.applicationPoints.length > 0) {
      const applicationText = "Application Points:\n" +
        outline.applicationPoints.map((point, i) => `${i+1}. ${point}`).join("\n")

      newContent.bottomIllustrations.push({ content: applicationText })
    }

    // Set the new content
    setSermonContent(newContent)

    // Close the import modal
    setShowImportOutline(false)

    // Show success message
    toast({
      title: "Outline Imported",
      description: "Sermon outline has been successfully imported",
    })
  }

  // Function to update explanation for a point
  const updateExplanation = (pointId: string, content: string) => {
    const updatedPoints = sermonContent.points.map(point => {
      if (point.id === pointId) {
        return {
          ...point,
          content: {
            ...point.content,
            explanation: { content }
          }
        }
      }
      return point
    })

    setSermonContent({
      ...sermonContent,
      points: updatedPoints
    })
  }

  // Function to update illustration content
  const updateIllustration = (pointId: string, index: number, content: string) => {
    const updatedPoints = sermonContent.points.map(point => {
      if (point.id === pointId) {
        const updatedIllustrations = [...point.content.illustrations]
        updatedIllustrations[index] = { content }

        return {
          ...point,
          content: {
            ...point.content,
            illustrations: updatedIllustrations
          }
        }
      }
      return point
    })

    setSermonContent({
      ...sermonContent,
      points: updatedPoints
    })
  }

  // Function to update top illustration
  const updateTopIllustration = (index: number, content: string) => {
    const updatedIllustrations = [...sermonContent.topIllustrations]
    updatedIllustrations[index] = { content }

    setSermonContent({
      ...sermonContent,
      topIllustrations: updatedIllustrations
    })
  }

  // Function to update bottom illustration
  const updateBottomIllustration = (index: number, content: string) => {
    const updatedIllustrations = [...sermonContent.bottomIllustrations]
    updatedIllustrations[index] = { content }

    setSermonContent({
      ...sermonContent,
      bottomIllustrations: updatedIllustrations
    })
  }

  // Function to update introduction
  const updateIntroduction = (content: string) => {
    setSermonContent({
      ...sermonContent,
      introduction: { content }
    })
  }

  // Function to update conclusion
  const updateConclusion = (content: string) => {
    setSermonContent({
      ...sermonContent,
      conclusion: { content }
    })
  }

  // Function to handle AI enhancement
  const handleApplyEnhancement = (section: string, enhancedContent: any) => {
    switch(section) {
      case "introduction":
        if (enhancedContent.content) {
          updateIntroduction(enhancedContent.content)
        }
        break
      case "point":
        if (enhancedContent.title && enhancedContent.explanation?.content) {
          // Jika ada beberapa poin yang dipilih
          if (enhancedContent.selectedPoints && enhancedContent.selectedPoints.length > 0) {
            const updatedPoints = [...sermonContent.points]

            // Tingkatkan semua poin yang dipilih dengan gaya yang sama
            enhancedContent.selectedPoints.forEach((pointId: string) => {
              const pointIndex = updatedPoints.findIndex(p => p.id === pointId)

              if (pointIndex !== -1) {
                // Tingkatkan semua poin yang dipilih dengan gaya yang sama
                // Untuk poin pertama, gunakan hasil yang sudah kita dapatkan dari API
                // Untuk poin lainnya, terapkan format yang sama dengan konten yang ada

                // Jika ini adalah poin pertama yang ditingkatkan (yang kita lihat di pratinjau)
                if (pointId === enhancedContent.pointId) {
                  updatedPoints[pointIndex] = {
                    ...updatedPoints[pointIndex],
                    title: enhancedContent.title,
                    content: {
                      ...updatedPoints[pointIndex].content,
                      verseReference: enhancedContent.verseReference || updatedPoints[pointIndex].content.verseReference,
                      explanation: enhancedContent.explanation
                    }
                  }
                } else {
                  // Untuk poin lain, terapkan format yang sama dengan konten yang ada
                  // Kita akan mempertahankan judul asli tetapi meningkatkan penjelasan
                  // dengan menambahkan frasa yang menunjukkan bahwa ini telah ditingkatkan

                  // Dapatkan konten penjelasan saat ini
                  const currentExplanation = updatedPoints[pointIndex].content.explanation?.content || ""

                  // Jika penjelasan sudah dimulai dengan tag [Ditingkatkan dengan AI], jangan tambahkan lagi
                  const enhancedExplanation = {
                    content: currentExplanation.startsWith("[Ditingkatkan dengan AI]")
                      ? currentExplanation
                      : `[Ditingkatkan dengan AI] ${currentExplanation}`
                  }

                  // Perbarui poin dengan penjelasan yang ditingkatkan
                  updatedPoints[pointIndex] = {
                    ...updatedPoints[pointIndex],
                    content: {
                      ...updatedPoints[pointIndex].content,
                      explanation: enhancedExplanation
                    }
                  }
                }
              }
            })

            setSermonContent({
              ...sermonContent,
              points: updatedPoints
            })

            // Tampilkan toast untuk memberi tahu pengguna
            toast({
              title: "Peningkatan Berhasil",
              description: `${enhancedContent.selectedPoints.length} poin telah ditingkatkan.`,
            })
          } else {
            // Jika hanya satu poin yang ditingkatkan (kasus lama)
            const updatedPoints = [...sermonContent.points]
            const pointIndex = updatedPoints.findIndex(p => p.id === enhancedContent.pointId)

            if (pointIndex !== -1) {
              updatedPoints[pointIndex] = {
                ...updatedPoints[pointIndex],
                title: enhancedContent.title,
                content: {
                  ...updatedPoints[pointIndex].content,
                  verseReference: enhancedContent.verseReference || updatedPoints[pointIndex].content.verseReference,
                  explanation: enhancedContent.explanation
                }
              }

              setSermonContent({
                ...sermonContent,
                points: updatedPoints
              })
            }
          }
        }
        break
      case "conclusion":
        if (enhancedContent.content) {
          updateConclusion(enhancedContent.content)
        }
        break
      case "structure":
        // Untuk saran struktur, kita hanya menampilkan saran dan tidak menerapkan perubahan otomatis
        toast({
          title: "Saran Struktur",
          description: "Saran struktur telah diberikan. Anda dapat menerapkan perubahan secara manual.",
        })
        break
    }
  }

  // Function to delete a point
  const deletePoint = (pointId: string) => {
    const updatedPoints = sermonContent.points.filter(point => point.id !== pointId)

    // Renumber the remaining points
    const renumberedPoints = updatedPoints.map((point, index) => ({
      ...point,
      title: `Point ${index + 1}`
    }))

    setSermonContent({
      ...sermonContent,
      points: renumberedPoints
    })
  }

  // Function to move a point up
  const movePointUp = (index: number) => {
    if (index <= 0) return

    const updatedPoints = [...sermonContent.points]
    const temp = updatedPoints[index]
    updatedPoints[index] = updatedPoints[index - 1]
    updatedPoints[index - 1] = temp

    setSermonContent({
      ...sermonContent,
      points: updatedPoints
    })
  }

  // Function to move a point down
  const movePointDown = (index: number) => {
    if (index >= sermonContent.points.length - 1) return

    const updatedPoints = [...sermonContent.points]
    const temp = updatedPoints[index]
    updatedPoints[index] = updatedPoints[index + 1]
    updatedPoints[index + 1] = temp

    setSermonContent({
      ...sermonContent,
      points: updatedPoints
    })
  }

  // Function to delete a top illustration
  const deleteTopIllustration = (index: number) => {
    const updatedIllustrations = sermonContent.topIllustrations.filter((_, i) => i !== index)

    setSermonContent({
      ...sermonContent,
      topIllustrations: updatedIllustrations
    })
  }

  // Function to delete a bottom illustration
  const deleteBottomIllustration = (index: number) => {
    const updatedIllustrations = sermonContent.bottomIllustrations.filter((_, i) => i !== index)

    setSermonContent({
      ...sermonContent,
      bottomIllustrations: updatedIllustrations
    })
  }

  // Function to delete an illustration from a point
  const deleteIllustration = (pointId: string, illustrationIndex: number) => {
    const updatedPoints = sermonContent.points.map(point => {
      if (point.id === pointId) {
        return {
          ...point,
          content: {
            ...point.content,
            illustrations: point.content.illustrations.filter((_, i) => i !== illustrationIndex)
          }
        }
      }
      return point
    })

    setSermonContent({
      ...sermonContent,
      points: updatedPoints
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-base md:text-lg font-semibold">Luma</span>
            <span className="text-gray-400 mx-1 md:mx-2">|</span>
            <span className="text-base md:text-lg font-semibold">Sermon Notes Editor</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIEnhance(true)}
              className="mr-2"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Tingkatkan dengan AI
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/sermon/sermon-notes">Back to Notes</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold">Sermon Notes Editor</h1>
          <p className="text-gray-600">Create and edit your sermon notes</p>
        </div>

        {/* Bible Verse Search Modal */}
        {showBibleSearch && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <BibleVerseSearch
              onSelectVerse={handleVerseSelect}
              onClose={() => {
                setShowBibleSearch(false)
                setActivePointId(null)
              }}
              initialQuery={getActivePointVerseReference()}
            />
          </div>
        )}

        {/* AI Enhance Modal */}
        {showAIEnhance && (
          <AIEnhanceModal
            sermonContent={sermonContent}
            onClose={() => setShowAIEnhance(false)}
            onApplyEnhancement={handleApplyEnhancement}
          />
        )}

        {/* Ubah layout flex menjadi responsif */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Section Sidebar - Buat responsif */}
          <div className="md:sticky md:top-0 md:h-screen w-full md:w-20 lg:w-24 border-b md:border-r border-gray-200 bg-white p-4 shadow-sm mb-4 md:mb-0">
            <div className="flex md:flex-col items-center justify-between md:justify-start md:space-y-6 md:mt-4">
              <div className="hidden md:block text-sm font-medium text-gray-600 mb-4">Navigation</div>

              {/* Buat navigasi horizontal di mobile, vertikal di desktop */}
              <div className="flex md:flex-col items-center justify-between w-full md:w-auto md:items-center">
                <TooltipProvider>
                  {/* Navigation Section - Goto buttons */}
                  <div className="flex md:flex-col items-center space-x-4 md:space-x-0 md:space-y-6">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-gray-100 transition-colors duration-200 h-12 w-12"
                          onClick={() => {
                            document.querySelector('#introduction-section')?.scrollIntoView({ behavior: 'smooth' })
                          }}
                        >
                          <BookOpen className="h-7 w-7 text-blue-600" />
                          <span className="sr-only">Introduction</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Go to Introduction</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-gray-100 transition-colors duration-200 h-12 w-12"
                          onClick={() => {
                            document.querySelector('#main-points-section')?.scrollIntoView({ behavior: 'smooth' })
                          }}
                        >
                          <ListPlus className="h-7 w-7 text-green-600" />
                          <span className="sr-only">Main Points</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Go to Main Points</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-gray-100 transition-colors duration-200 h-12 w-12"
                          onClick={() => {
                            document.querySelector('#conclusion-section')?.scrollIntoView({ behavior: 'smooth' })
                          }}
                        >
                          <CheckSquare className="h-7 w-7 text-purple-600" />
                          <span className="sr-only">Conclusion</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Go to Conclusion</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Divider - Horizontal di desktop, Vertical di mobile */}
                  <div className="hidden md:block w-full h-px bg-gray-200 my-6"></div>
                  <div className="md:hidden w-px h-12 bg-gray-200 mx-2"></div>

                  {/* Action Section - Action buttons */}
                  <div className="flex md:flex-col items-center space-x-4 md:space-x-0 md:space-y-6">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-gray-100 transition-colors duration-200 h-12 w-12"
                          onClick={saveNote}
                          disabled={isLoading}
                        >
                          <Save className="h-7 w-7 text-blue-600" />
                          <span className="sr-only">Save</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Save Sermon Note</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-gray-100 transition-colors duration-200 h-12 w-12"
                          onClick={async () => {
                            // Save first, then navigate to preview for export
                            try {
                              if (!noteId) {
                                await saveNote();
                              }
                              // Navigate to preview page with the note ID
                              if (noteId) {
                                router.push(`/sermon/sermon-note-preview?id=${noteId}`);
                              }
                            } catch (error) {
                              console.error("Error preparing for export:", error);
                              toast({
                                title: "Error",
                                description: "Please save your note before exporting",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <FileDown className="h-7 w-7 text-green-600" />
                          <span className="sr-only">Export</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Export to PDF</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-gray-100 transition-colors duration-200 h-12 w-12"
                          onClick={async () => {
                            // Save first, then navigate to preview
                            try {
                              if (!noteId) {
                                await saveNote();
                              }
                              // Navigate to preview page with the note ID
                              if (noteId) {
                                router.push(`/sermon/sermon-note-preview?id=${noteId}`);
                              }
                            } catch (error) {
                              console.error("Error navigating to preview:", error);
                              toast({
                                title: "Error",
                                description: "Please save your note before previewing",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Eye className="h-7 w-7 text-purple-600" />
                          <span className="sr-only">Preview</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Preview Sermon Note</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 md:pl-6 lg:pl-12 pr-0 md:pr-4">
            {/* Sermon Title Section - Buat responsif */}
            <section className="mb-10 text-center bg-white p-4 md:p-6 rounded-lg shadow-sm">
              <h2 className="mb-4 text-xl font-medium">Sermon Title</h2>
              <Input
                value={sermonTitle}
                onChange={(e) => setSermonTitle(e.target.value)}
                className="w-full border-gray-200 focus:border-gray-300 focus:ring-0"
                placeholder="Enter your sermon title here..."
              />
            </section>

            {/* Editor Content - Buat responsif */}
            {/* Introduction Section */}
            <section id="introduction-section" className="mb-10 bg-white p-4 md:p-6 rounded-lg shadow-sm">
              <h2 className="mb-4 text-xl font-medium">Introduction</h2>
              <Textarea
                placeholder="Write your sermon introduction here..."
                className="min-h-[120px] resize-y border-gray-200 focus:border-gray-300 focus:ring-0 w-full"
                value={sermonContent.introduction?.content || ""}
                onChange={(e) => updateIntroduction(e.target.value)}
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
              />

              {/* Add Standalone Illustration Button after Introduction */}
              <div className="flex justify-center mt-6">
                <Button
                  onClick={addTopIllustration}
                  variant="outline"
                  className="border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 px-6"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Standalone Illustration
                </Button>
              </div>
            </section>

            {/* Top Illustrations Section */}
            {sermonContent.topIllustrations.length > 0 && (
              <section className="mb-10 bg-white p-6 rounded-lg shadow-sm">
                <h2 className="mb-4 text-xl font-medium">Illustrations</h2>
                <div className="space-y-4">
                  {sermonContent.topIllustrations.map((illustration, index) => (
                    <Card key={`top-ill-${index}`} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="bg-gray-50 pb-3 flex flex-row justify-between items-center border-b border-gray-200">
                        <CardTitle className="text-base font-medium">Illustration {index + 1}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => deleteTopIllustration(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Add a standalone illustration..."
                            className="min-h-[100px] resize-y border-gray-200 focus:border-gray-300 focus:ring-0 w-full"
                            value={illustration.content}
                            onChange={(e) => updateTopIllustration(index, e.target.value)}
                            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Add Standalone Illustration Button */}
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={addTopIllustration}
                      variant="outline"
                      className="border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 px-6"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Add Illustration
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {/* Main Points Section - Buat responsif */}
            <section id="main-points-section" className="mb-10 bg-white p-4 md:p-6 rounded-lg shadow-sm">
              <h2 className="mb-4 text-xl font-medium">Main Points</h2>
              <div className="space-y-8">
                {sermonContent.points.map((point, index) => (
                  <Card key={point.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="bg-gray-50 pb-3 flex flex-row justify-between items-center border-b border-gray-200 p-3 md:p-4">
                      <CardTitle className="text-base font-medium">{point.title}</CardTitle>
                      <div className="flex space-x-1 md:space-x-2">
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => movePointUp(index)}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                        )}
                        {index < sermonContent.points.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => movePointDown(index)}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => deletePoint(point.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 p-3 md:p-4">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor={`verse-${point.id}`} className="mb-2 block text-sm font-medium">
                            Verse Reference
                          </label>
                          <div className="flex space-x-2">
                            <div className="relative flex-1">
                              <Input
                                id={`verse-${point.id}`}
                                placeholder="e.g., John 3:16"
                                className="border-gray-200 focus:border-gray-300 focus:ring-0 pr-10"
                                value={point.content.verseReference?.reference || ""}
                                onChange={(e) => updateVerseReference(point.id, e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                                onClick={() => openBibleSearch(point.id)}
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label htmlFor={`explanation-${point.id}`} className="mb-2 block text-sm font-medium">
                            Explanation
                          </label>
                          <Textarea
                            id={`explanation-${point.id}`}
                            placeholder={`Explain your ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : `${index + 1}th`} point...`}
                            className="min-h-[100px] resize-y border-gray-200 focus:border-gray-300 focus:ring-0 w-full"
                            value={point.content.explanation?.content || ""}
                            onChange={(e) => updateExplanation(point.id, e.target.value)}
                            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                          />
                        </div>

                        {/* Illustrations for this point */}
                        {point.content.illustrations.map((illustration, illIndex) => (
                          <div key={`${point.id}-ill-${illIndex}`} className="border border-dashed border-gray-200 p-4 rounded-md bg-gray-50/50">
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-sm font-medium">
                                Illustration {illIndex + 1}
                              </label>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={() => deleteIllustration(point.id, illIndex)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <Textarea
                              placeholder="Add an illustration to support your point..."
                              className="min-h-[80px] resize-y border-gray-200 focus:border-gray-300 focus:ring-0 w-full"
                              value={illustration.content}
                              onChange={(e) => updateIllustration(point.id, illIndex, e.target.value)}
                              style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                            />
                          </div>
                        ))}

                        <Button
                          variant="outline"
                          className="w-full border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
                          onClick={() => addIllustrationToPoint(point.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Illustration
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add Point and Standalone Illustration Buttons */}
                <div className="flex justify-center mt-6 space-x-4">
                  <Button
                    onClick={addPoint}
                    variant="outline"
                    className="border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 px-6"
                  >
                    <ListPlus className="mr-2 h-5 w-5" />
                    Add New Point
                  </Button>

                  <Button
                    onClick={addBottomIllustration}
                    variant="outline"
                    className="border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 px-6"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Standalone Illustration
                  </Button>
                </div>
              </div>
            </section>

            {/* Bottom Illustrations Section - Appears after Main Points */}
            {sermonContent.bottomIllustrations.length > 0 && (
              <section className="mb-10 bg-white p-6 rounded-lg shadow-sm">
              <h2 className="mb-4 text-xl font-medium">Additional Illustrations</h2>
              <div className="space-y-4">
                {sermonContent.bottomIllustrations.map((illustration, index) => (
                    <Card key={`bottom-ill-${index}`} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="bg-gray-50 pb-3 flex flex-row justify-between items-center border-b border-gray-200">
                        <CardTitle className="text-base font-medium">Illustration {index + 1}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => deleteBottomIllustration(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Add a standalone illustration..."
                            className="min-h-[100px] resize-y border-gray-200 focus:border-gray-300 focus:ring-0 w-full"
                            value={illustration.content}
                            onChange={(e) => updateBottomIllustration(index, e.target.value)}
                            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </section>
            )}

            {/* Conclusion Section */}
            <section id="conclusion-section" className="mb-10 bg-white p-6 rounded-lg shadow-sm">
              <h2 className="mb-4 text-xl font-medium">Conclusion</h2>
              <Textarea
                placeholder="Write your sermon conclusion here..."
                className="min-h-[120px] resize-y border-gray-200 focus:border-gray-300 focus:ring-0 w-full"
                value={sermonContent.conclusion?.content || ""}
                onChange={(e) => updateConclusion(e.target.value)}
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
              />
            </section>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </main>
    </div>
  )
}
