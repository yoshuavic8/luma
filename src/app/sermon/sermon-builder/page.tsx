'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import * as Sentry from '@sentry/nextjs'
import { monitoring } from '@/lib/monitoring'
import jsPDF from 'jspdf'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { generateSermonOutline, SermonOutline, SermonGenerationOptions } from '@/lib/aiService'
import { useStorage } from '@/lib/storageService'
import BottomNavigation from '@/components/BottomNavigation'
import { Menu, Trash2, RefreshCw, FileDown } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from '@/components/ui/sheet'
// ProtectedRoute is now handled in the layout

export default function SermonBuilderPage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [scripture, setScripture] = useState('')
  const [audience, setAudience] = useState<'general' | 'youth' | 'children' | 'seniors'>('general')
  const [style, setStyle] = useState<'expository' | 'topical' | 'narrative'>('expository')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [includeApplicationPoints, setIncludeApplicationPoints] = useState(true)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutline, setGeneratedOutline] = useState<SermonOutline | null>(null)
  const [error, setError] = useState('')
  const [savedOutlines, setSavedOutlines] = useState<SermonOutline[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<{
    id: string
    status: 'deleting' | 'success' | 'error'
  } | null>(null)

  const { userData } = useAuth()
  const storage = useStorage()

  const handleGenerate = async () => {
    if (!topic && !scripture) {
      setError('Please provide either a topic or a scripture reference.')
      return
    }

    setIsGenerating(true)
    setError('')

    monitoring.log('info', 'User initiated sermon generation', {
      topic,
      scripture,
      audience,
      style,
      length
    })

    try {
      // Generate sermon outline
      const options: SermonGenerationOptions = {
        topic,
        scripture,
        audience,
        style,
        length,
        includeApplicationPoints
      }

      monitoring.log('info', 'Calling generateSermonOutline', { options })
      const outline = await generateSermonOutline(options)
      monitoring.log('info', 'Sermon outline generated successfully')
      setGeneratedOutline(outline)

      // Track successful generation
      Sentry.addBreadcrumb({
        category: 'sermon',
        message: 'Sermon outline generated successfully',
        level: 'info'
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      monitoring.trackError(error instanceof Error ? error : new Error(errorMessage), {
        topic,
        scripture,
        audience,
        style,
        length
      })

      // Send error to Sentry
      Sentry.captureException(error, {
        tags: {
          feature: 'sermon_generation',
          style,
          audience
        },
        extra: {
          topic,
          scripture,
          length
        }
      })

      // Pesan error yang lebih user-friendly berdasarkan jenis error
      if (errorMessage.includes('504') || errorMessage.includes('timeout')) {
        setError(
          'The AI service took too long to respond. Please try again with a simpler request or check your internet connection.'
        )
      } else if (errorMessage.includes('429')) {
        setError('Too many requests to the AI service. Please wait a moment and try again.')
      } else if (errorMessage.includes('pattern')) {
        setError(
          'The AI service returned an invalid response format. Please try again with different parameters.'
        )
      } else {
        setError(errorMessage || 'Failed to generate sermon outline. Please try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Reference for debouncedLoadOutlines
  const debouncedLoadOutlinesRef = useRef<(() => void) | null>(null)

  const handleSaveOutline = async () => {
    if (!generatedOutline) return

    try {
      // Save to storage - force save to Firestore regardless of tier
      const forceSaveToFirestore = true
      await storage.saveSermonOutline(generatedOutline, userData, forceSaveToFirestore)
      // Outline saved successfully

      // Refresh saved outlines
      if (debouncedLoadOutlinesRef.current) debouncedLoadOutlinesRef.current()

      // Show success message
      alert('Sermon outline saved successfully!')
    } catch {
      // Handle save error
      alert('Failed to save sermon outline. Please try again.')
    }
  }

  const handleDeleteOutline = async (id: string) => {
    if (confirm('Are you sure you want to delete this outline?')) {
      try {
        // Set visual feedback
        setDeleteStatus({ id, status: 'deleting' })

        // Set forceFirestoreDelete to true to ensure it's deleted from Firestore
        const success = await storage.deleteSermonOutline(id, userData, true)

        if (success) {
          // Show success message
          // Outline deleted successfully
          setDeleteStatus({ id, status: 'success' })

          // Refresh the list after a short delay to allow Firestore to update
          setTimeout(() => {
            if (debouncedLoadOutlinesRef.current) debouncedLoadOutlinesRef.current()
            setDeleteStatus(null)
          }, 1000)
        }
      } catch {
        // Handle delete error
        setDeleteStatus({ id, status: 'error' })

        // Reset status after showing error
        setTimeout(() => {
          setDeleteStatus(null)
        }, 2000)

        alert('Failed to delete outline. Please try again.')
      }
    }
  }

  const handleLoadOutline = (outline: SermonOutline) => {
    setGeneratedOutline(outline)
  }

  // Function to export outline to PDF using direct jsPDF approach
  const exportToPDF = async () => {
    if (!generatedOutline) return

    try {
      // Show loading state
      setIsGenerating(true)

      // Create PDF document (A4 format)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const margin = 20 // Margin in mm
      const contentWidth = pageWidth - margin * 2
      const lineHeight = 5 // Line height in mm (increased for better readability)

      // Variable to track current vertical position
      let yPos = margin + 20

      // Helper function to add text with word wrapping and improved line spacing
      const addWrappedText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        fontSize: number = 12,
        fontStyle: string = 'normal'
      ) => {
        pdf.setFontSize(fontSize)
        pdf.setFont('helvetica', fontStyle)

        // Split text into words
        const words = text.split(' ')
        let line = ''
        let currentY = y

        // Process each word
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' '
          const testWidth = (pdf.getStringUnitWidth(testLine) * fontSize) / pdf.internal.scaleFactor

          if (testWidth > maxWidth && i > 0) {
            // Add the line and move to next line
            pdf.text(line, x, currentY)
            line = words[i] + ' '
            currentY += lineHeight * 1.3 // Increased line spacing by 30%

            // Check if we need a new page
            if (currentY > pageHeight - margin) {
              pdf.addPage()
              currentY = margin + lineHeight
            }
          } else {
            line = testLine
          }
        }

        // Add the last line
        if (line.trim() !== '') {
          pdf.text(line, x, currentY)
          currentY += lineHeight * 1.3 // Increased line spacing by 30%
        }

        return currentY
      }

      // Add title
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      const title = generatedOutline.title
      pdf.text(title, pageWidth / 2, margin, { align: 'center' })

      // Add scripture reference with word wrapping
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(100, 100, 100)
      const scripture = generatedOutline.scripture

      // Check if scripture is too long and needs wrapping
      if ((pdf.getStringUnitWidth(scripture) * 12) / pdf.internal.scaleFactor > contentWidth) {
        // Split scripture into words and create wrapped lines
        const words = scripture.split(' ')
        let line = ''
        const lines = []

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' '
          const testWidth = (pdf.getStringUnitWidth(testLine) * 12) / pdf.internal.scaleFactor

          if (testWidth > contentWidth * 0.8 && i > 0) {
            // Use 80% of content width for centered text
            lines.push(line.trim())
            line = words[i] + ' '
          } else {
            line = testLine
          }
        }

        if (line.trim() !== '') {
          lines.push(line.trim())
        }

        // Add each line centered
        let yPosition = margin + 10
        lines.forEach(line => {
          pdf.text(line, pageWidth / 2, yPosition, { align: 'center' })
          yPosition += lineHeight * 0.8 // Slightly reduced spacing for scripture lines
        })

        // Update starting position for next content
        yPos = yPosition + 10
      } else {
        // Scripture fits on one line
        pdf.text(scripture, pageWidth / 2, margin + 10, { align: 'center' })
        yPos = margin + 20
      }

      // Start position for content is now set in the scripture handling code above

      // Add hook if available
      if (generatedOutline.hook) {
        pdf.setFillColor(255, 250, 240) // Light yellow
        pdf.rect(
          margin,
          yPos,
          contentWidth,
          10 + (generatedOutline.hook.length / 50) * lineHeight,
          'F'
        )

        pdf.setTextColor(0, 0, 0)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(14)
        pdf.text('Opening Hook', margin + 5, yPos + 7)

        yPos += 12
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(12)
        yPos = addWrappedText(`"${generatedOutline.hook}"`, margin + 5, yPos, contentWidth - 10)
        yPos += 5
      }

      // Add introduction
      pdf.setFillColor(240, 248, 255) // Light blue
      pdf.rect(
        margin,
        yPos,
        contentWidth,
        10 + (generatedOutline.introduction.length / 50) * lineHeight,
        'F'
      )

      pdf.setTextColor(0, 0, 0)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      pdf.text('Introduction', margin + 5, yPos + 7)

      yPos += 12
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(12)
      yPos = addWrappedText(generatedOutline.introduction, margin + 5, yPos, contentWidth - 10)
      yPos += 5

      // Add main points
      generatedOutline.mainPoints.forEach((point, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 60) {
          pdf.addPage()
          yPos = margin
        }

        pdf.setFillColor(240, 255, 240) // Light green
        const pointHeight =
          15 + ((point.explanation.length + (point.scripture?.length || 0)) / 50) * lineHeight
        pdf.rect(margin, yPos, contentWidth, pointHeight, 'F')

        // Point number in circle
        pdf.setFillColor(0, 100, 0) // Dark green
        pdf.circle(margin + 10, yPos + 7, 5, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.text((index + 1).toString(), margin + 10, yPos + 9, { align: 'center' })

        // Point title
        pdf.setTextColor(0, 0, 0)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(14)
        pdf.text(point.title, margin + 20, yPos + 7)

        yPos += 12

        // Scripture reference if available
        if (point.scripture) {
          pdf.setFont('helvetica', 'italic')
          pdf.setFontSize(11)
          pdf.setTextColor(100, 100, 100)
          yPos = addWrappedText(point.scripture, margin + 20, yPos, contentWidth - 25)
        }

        // Point explanation
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(12)
        pdf.setTextColor(0, 0, 0)
        yPos = addWrappedText(point.explanation, margin + 20, yPos, contentWidth - 25)
        yPos += 5
      })

      // Add conclusion
      if (yPos > pageHeight - 60) {
        pdf.addPage()
        yPos = margin
      }

      pdf.setFillColor(248, 240, 255) // Light purple
      pdf.rect(
        margin,
        yPos,
        contentWidth,
        10 + (generatedOutline.conclusion.length / 50) * lineHeight,
        'F'
      )

      pdf.setTextColor(0, 0, 0)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      pdf.text('Conclusion', margin + 5, yPos + 7)

      yPos += 12
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(12)
      yPos = addWrappedText(generatedOutline.conclusion, margin + 5, yPos, contentWidth - 10)
      yPos += 5

      // Add biblical solution if available
      if (generatedOutline.biblicalSolution) {
        if (yPos > pageHeight - 60) {
          pdf.addPage()
          yPos = margin
        }

        pdf.setFillColor(240, 255, 255) // Light cyan
        const solutionText = generatedOutline.biblicalSolution.explanation
        const illustrationText = generatedOutline.biblicalSolution.illustration || ''
        const solutionHeight =
          15 + ((solutionText.length + illustrationText.length) / 50) * lineHeight

        pdf.rect(margin, yPos, contentWidth, solutionHeight, 'F')

        pdf.setTextColor(0, 0, 0)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(14)
        pdf.text('Biblical Solution', margin + 5, yPos + 7)

        yPos += 12
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(12)
        yPos = addWrappedText(solutionText, margin + 5, yPos, contentWidth - 10)

        if (illustrationText) {
          pdf.setFont('helvetica', 'italic')
          pdf.setTextColor(100, 100, 100)
          yPos = addWrappedText(`"${illustrationText}"`, margin + 15, yPos, contentWidth - 20)
        }

        yPos += 5
      }

      // Add application points if available
      if (generatedOutline.applicationPoints && generatedOutline.applicationPoints.length > 0) {
        if (yPos > pageHeight - 60) {
          pdf.addPage()
          yPos = margin
        }

        pdf.setFillColor(255, 240, 240) // Light red
        const pointsHeight =
          15 + (generatedOutline.applicationPoints.join(' ').length / 50) * lineHeight
        pdf.rect(margin, yPos, contentWidth, pointsHeight, 'F')

        pdf.setTextColor(0, 0, 0)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(14)
        pdf.text('Application Points', margin + 5, yPos + 7)

        yPos += 12

        generatedOutline.applicationPoints.forEach((point, index) => {
          // Circle with number
          pdf.setFillColor(139, 0, 0) // Dark red
          pdf.circle(margin + 10, yPos, 5, 'F')
          pdf.setTextColor(255, 255, 255)
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(10)
          pdf.text((index + 1).toString(), margin + 10, yPos + 2, { align: 'center' })

          // Point text
          pdf.setTextColor(0, 0, 0)
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(12)
          yPos = addWrappedText(point, margin + 20, yPos, contentWidth - 25)
          yPos += 2
        })

        yPos += 5
      }

      // Add personal challenge if available
      if (generatedOutline.personalChallenge) {
        if (yPos > pageHeight - 60) {
          pdf.addPage()
          yPos = margin
        }

        pdf.setFillColor(255, 240, 245) // Light pink
        const challengeText = generatedOutline.personalChallenge.challenge
        const illustrationText = generatedOutline.personalChallenge.illustration || ''
        const challengeHeight =
          15 + ((challengeText.length + illustrationText.length) / 50) * lineHeight

        pdf.rect(margin, yPos, contentWidth, challengeHeight, 'F')

        pdf.setTextColor(0, 0, 0)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(14)
        pdf.text('Personal Challenge', margin + 5, yPos + 7)

        yPos += 12
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(12)
        yPos = addWrappedText(challengeText, margin + 5, yPos, contentWidth - 10)

        if (illustrationText) {
          pdf.setFont('helvetica', 'italic')
          pdf.setTextColor(100, 100, 100)
          yPos = addWrappedText(`"${illustrationText}"`, margin + 15, yPos, contentWidth - 20)
        }
      }

      // Save the PDF with a clean filename
      const filename =
        generatedOutline.title
          .replace(/[^a-zA-Z0-9]/g, '_')
          .replace(/_+/g, '_')
          .substring(0, 50) + '_sermon_outline.pdf'

      pdf.save(filename)
    } catch {
      // Handle PDF generation error
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Debounce function to prevent multiple calls
  const debounce = (func: () => void, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(), delay)
    }
  }

  // Reference to track if we've already loaded outlines
  const hasLoadedOutlines = useRef(false)

  // Memoize loadSavedOutlines function to avoid dependency issues
  const memoizedLoadSavedOutlines = useCallback(() => {
    // Prevent loading if already loading
    if (isLoading) return

    if (userData) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        // Loading saved outlines for user
      }

      setIsLoading(true)

      // Set a timeout to ensure loading state doesn't get stuck
      const loadingTimeout = setTimeout(() => {
        setIsLoading(false)
      }, 5000) // 5 seconds timeout

      try {
        storage
          .getSermonOutlines(userData)
          .then(outlines => {
            setSavedOutlines(outlines || [])
            clearTimeout(loadingTimeout)
            setIsLoading(false)
            hasLoadedOutlines.current = true
          })
          .catch(() => {
            // Error handling for loading saved outlines
            setSavedOutlines([])
            clearTimeout(loadingTimeout)
            setIsLoading(false)
          })
      } catch {
        // Error handling in loadSavedOutlines
        setSavedOutlines([])
        clearTimeout(loadingTimeout)
        setIsLoading(false)
      }
    }
  }, [userData, storage, isLoading])

  // Create debounced version of the function
  const debouncedLoadOutlines = useCallback(() => {
    // Create a new debounced function
    const debouncedFunc = debounce(() => memoizedLoadSavedOutlines(), 300)
    debouncedFunc()
  }, [memoizedLoadSavedOutlines])

  // Store the function in the ref
  useEffect(() => {
    debouncedLoadOutlinesRef.current = debouncedLoadOutlines
  }, [debouncedLoadOutlines])

  // Load saved outlines when component mounts, but only once
  useEffect(() => {
    if (!hasLoadedOutlines.current && userData && debouncedLoadOutlinesRef.current) {
      debouncedLoadOutlinesRef.current()
    }
  }, [userData, debouncedLoadOutlines])

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-base md:text-lg font-semibold">Luma</span>
            <span className="text-gray-400 mx-1 md:mx-2">|</span>
            <span className="text-base md:text-lg font-semibold">AI Sermon Builder</span>
          </div>

          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <div className="flex justify-between items-center">
                    <SheetTitle>Saved Sermon Outlines</SheetTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        debouncedLoadOutlinesRef.current && debouncedLoadOutlinesRef.current()
                      }
                      disabled={isLoading}
                      title="Refresh outlines"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <SheetDescription>
                    Your previously saved sermon outlines. Click on an outline to load it.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"></div>
                      <p className="text-sm text-gray-500">Loading saved outlines...</p>
                    </div>
                  ) : savedOutlines.length === 0 ? (
                    <div>
                      <p className="text-center text-gray-500 py-4">No saved outlines yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() =>
                          debouncedLoadOutlinesRef.current && debouncedLoadOutlinesRef.current()
                        }
                      >
                        Refresh
                      </Button>
                    </div>
                  ) : (
                    savedOutlines.map(outline => (
                      <Card key={outline.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-8">
                              <h3 className="font-medium line-clamp-1">{outline.title}</h3>
                              <p className="text-xs text-gray-500 mt-1">{outline.scripture}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`absolute top-2 right-2 ${
                                deleteStatus?.id === outline.id
                                  ? deleteStatus?.status === 'deleting'
                                    ? 'text-amber-500'
                                    : deleteStatus?.status === 'success'
                                      ? 'text-green-500'
                                      : deleteStatus?.status === 'error'
                                        ? 'text-red-500'
                                        : 'text-gray-400'
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                              onClick={e => {
                                e.stopPropagation()
                                if (outline.id && !deleteStatus) handleDeleteOutline(outline.id)
                              }}
                              disabled={deleteStatus?.id === outline.id}
                            >
                              {deleteStatus?.id === outline.id ? (
                                deleteStatus?.status === 'deleting' ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-amber-600"></div>
                                ) : deleteStatus?.status === 'success' ? (
                                  <div className="h-4 w-4 text-green-500">✓</div>
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => handleLoadOutline(outline)}
                          >
                            Load Outline
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="outline" size="sm" asChild>
              <Link href="/home-screen">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl p-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold">AI-Powered Sermon Builder</h1>
          <p className="text-gray-600">Generate sermon outlines with AI assistance</p>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          {/* Input Form */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Generate Sermon Outline</CardTitle>
              <CardDescription>
                Fill in the details below to generate a sermon outline using AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">{error}</div>
              )}

              {userData?.tier === 'free' && (
                <div className="rounded-md bg-blue-50 p-3 text-sm">
                  <p className="font-medium text-blue-700">
                    Free Tier: {userData.usageCount || 0}/5 generations today
                  </p>
                  <p className="mt-1 text-blue-600">
                    <Link href="/subscription" className="underline">
                      Upgrade to Pro
                    </Link>{' '}
                    for unlimited generations and more features.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="topic">Sermon Topic or Title (Optional)</Label>
                <Input
                  id="topic"
                  placeholder="e.g., The Power of Faith"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scripture">Scripture Reference (Optional)</Label>
                <Input
                  id="scripture"
                  placeholder="e.g., Hebrews 11:1-6"
                  value={scripture}
                  onChange={e => setScripture(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Provide either a topic or scripture reference (or both)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <select
                  id="audience"
                  value={audience}
                  onChange={e =>
                    setAudience(e.target.value as 'general' | 'youth' | 'children' | 'seniors')
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="general">General Congregation</option>
                  <option value="youth">Youth</option>
                  <option value="children">Children</option>
                  <option value="seniors">Seniors</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Sermon Style</Label>
                <select
                  id="style"
                  value={style}
                  onChange={e => setStyle(e.target.value as 'expository' | 'topical' | 'narrative')}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="expository">Expository (Verse by Verse)</option>
                  <option value="topical">Topical (Theme Based)</option>
                  <option value="narrative">Narrative (Story Based)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="length">Sermon Length</Label>
                <select
                  id="length"
                  value={length}
                  onChange={e => setLength(e.target.value as 'short' | 'medium' | 'long')}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="short">Short (15-20 minutes)</option>
                  <option value="medium">Medium (25-35 minutes)</option>
                  <option value="long">Long (40+ minutes)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeApplicationPoints"
                  checked={includeApplicationPoints}
                  onChange={e => setIncludeApplicationPoints(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="includeApplicationPoints" className="text-sm">
                  Include Application Points
                </Label>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (!topic && !scripture)}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Outline'}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Outline */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Generated Outline</CardTitle>
              <CardDescription>Your AI-generated sermon outline will appear here</CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[300px] md:max-h-[500px] lg:max-h-[calc(100vh-250px)]">
              {isGenerating ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                    <p className="text-gray-500">Generating your outline...</p>
                  </div>
                </div>
              ) : generatedOutline ? (
                <div className="space-y-6 outline-container">
                  {/* Title and Scripture */}
                  <div className="space-y-2 border-b pb-4">
                    <h2 className="text-xl font-bold text-blue-800 outline-title">
                      {generatedOutline.title}
                    </h2>
                    <p className="text-sm text-gray-600 italic outline-scripture">
                      {generatedOutline.scripture}
                    </p>
                  </div>

                  {/* Hook (if available) */}
                  {generatedOutline.hook && (
                    <div className="space-y-2 p-3 bg-yellow-50 rounded-md border border-yellow-100 outline-section">
                      <h3 className="font-medium text-yellow-800 flex items-center section-header">
                        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Opening Hook
                      </h3>
                      <p className="text-sm italic">&ldquo;{generatedOutline.hook}&rdquo;</p>
                    </div>
                  )}

                  {/* Introduction */}
                  <div className="space-y-2 p-3 bg-blue-50 rounded-md border border-blue-100 outline-section">
                    <h3 className="font-medium text-blue-800 flex items-center section-header">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Introduction
                    </h3>
                    <p className="text-sm">{generatedOutline.introduction}</p>
                  </div>

                  {/* Main Points */}
                  <div className="space-y-4 outline-section">
                    <h3 className="font-medium text-gray-700 border-b pb-1 section-header">
                      Main Points
                    </h3>
                    {generatedOutline.mainPoints.map((point, index) => (
                      <div
                        key={index}
                        className="space-y-2 p-3 bg-green-50 rounded-md border border-green-100 main-point"
                      >
                        <h3 className="font-medium text-green-800 flex items-center main-point-title">
                          <span className="flex w-5 h-5 bg-green-600 text-white rounded-full mr-2 items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          {point.title}
                        </h3>
                        <p className="text-xs text-gray-600 italic ml-7 main-point-scripture">
                          {point.scripture}
                        </p>
                        <p className="text-sm ml-7">{point.explanation}</p>
                      </div>
                    ))}
                  </div>

                  {/* Conclusion */}
                  <div className="space-y-2 p-3 bg-purple-50 rounded-md border border-purple-100 outline-section">
                    <h3 className="font-medium text-purple-800 flex items-center section-header">
                      <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Conclusion
                    </h3>
                    <p className="text-sm">{generatedOutline.conclusion}</p>
                  </div>

                  {/* Biblical Solution (if available) */}
                  {generatedOutline.biblicalSolution && (
                    <div className="space-y-2 p-3 bg-indigo-50 rounded-md border border-indigo-100 outline-section">
                      <h3 className="font-medium text-indigo-800 flex items-center section-header">
                        <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                        Biblical Solution
                      </h3>
                      <div className="space-y-2">
                        <p className="text-sm">{generatedOutline.biblicalSolution.explanation}</p>
                        {generatedOutline.biblicalSolution.illustration && (
                          <div className="ml-4 pl-2 border-l-2 border-indigo-200 italic text-sm text-gray-700">
                            <p>&ldquo;{generatedOutline.biblicalSolution.illustration}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Application Points */}
                  {generatedOutline.applicationPoints.length > 0 && (
                    <div className="space-y-2 p-3 bg-amber-50 rounded-md border border-amber-100 outline-section">
                      <h3 className="font-medium text-amber-800 flex items-center section-header">
                        <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                        Application Points
                      </h3>
                      <ul className="list-inside space-y-2 ml-2">
                        {generatedOutline.applicationPoints.map((point, index) => (
                          <li key={index} className="text-sm flex items-start application-point">
                            <span className="flex w-5 h-5 bg-amber-600 text-white rounded-full mr-2 flex-shrink-0 items-center justify-center text-xs">
                              {index + 1}
                            </span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Personal Challenge (if available) */}
                  {generatedOutline.personalChallenge && (
                    <div className="space-y-2 p-3 bg-rose-50 rounded-md border border-rose-100 outline-section">
                      <h3 className="font-medium text-rose-800 flex items-center section-header">
                        <span className="inline-block w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
                        Personal Challenge
                      </h3>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {generatedOutline.personalChallenge.challenge}
                        </p>
                        {generatedOutline.personalChallenge.illustration && (
                          <div className="ml-4 pl-2 border-l-2 border-rose-200 italic text-sm text-gray-700">
                            <p>&ldquo;{generatedOutline.personalChallenge.illustration}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-center text-gray-500">
                    Fill in the form and click &quot;Generate Outline&quot; to create a sermon
                    outline
                  </p>
                </div>
              )}
            </CardContent>
            {generatedOutline && (
              <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 border-t bg-gray-50 px-3 sm:px-6 py-3 sm:py-4">
                <Button
                  variant="outline"
                  onClick={exportToPDF}
                  className="no-print"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Export to PDF
                    </>
                  )}
                </Button>
                <Button onClick={handleSaveOutline} className="no-print mr-2">
                  Save Outline
                </Button>
                <Button
                  variant="outline"
                  className="no-print"
                  onClick={() => {
                    if (generatedOutline) {
                      // Save outline first
                      handleSaveOutline()
                      // Navigate to sermon note editor
                      router.push('/sermon/sermon-note-editor')
                    }
                  }}
                >
                  Create Sermon Note
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
