"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  FileDown,
  Printer
} from "lucide-react"
import { format } from "date-fns"
import jsPDF from "jspdf"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import BottomNavigation from "@/components/BottomNavigation"
import { useAuth } from "@/contexts/AuthContext"
import { useStorage, SermonNote } from "@/lib/storageService"

export default function SermonNotePreview() {
  const { userData } = useAuth()
  const storage = useStorage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [note, setNote] = useState<SermonNote | null>(null)

  // Load note if ID is provided in URL
  useEffect(() => {
    // Only run this effect once on mount
    const id = searchParams.get('id')
    if (id) {
      // Function to load a note
      const loadNote = async (noteId: string) => {
        try {
          setIsLoading(true)
          const fetchedNote = await storage.getSermonNote(noteId, userData)
          if (fetchedNote && typeof fetchedNote === 'object' && 'title' in fetchedNote && 'content' in fetchedNote) {
            setNote(fetchedNote as SermonNote)
            // Removed success toast to prevent multiple notifications
          } else {
            toast({
              title: "Error",
              description: "Note not found",
              variant: "destructive",
            })
            router.push('/sermon/sermon-notes')
          }
        } catch (error) {
          console.error("Error loading note:", error)
          toast({
            title: "Error",
            description: "Failed to load sermon note",
            variant: "destructive",
          })
          router.push('/sermon/sermon-notes')
        } finally {
          setIsLoading(false)
        }
      }

      loadNote(id)
    } else {
      router.push('/sermon/sermon-notes')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Format date for display
  const formatDate = (date: any) => {
    if (!date) return "Unknown date"

    try {
      // Handle Firebase Timestamp
      if (typeof date === 'object' && date.seconds) {
        return format(new Date(date.seconds * 1000), "MMMM d, yyyy")
      }

      // Handle ISO string
      return format(new Date(date), "MMMM d, yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Function to print the note
  const printNote = () => {
    window.print()
  }

  // Function to export to PDF
  const exportToPdf = async () => {
    if (!note) return;

    try {
      // Show loading toast
      toast({
        title: "Exporting PDF",
        description: "Please wait while we generate your PDF...",
      });

      // Create PDF document (A4 format)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const margin = 20; // Margin in mm
      const contentWidth = pageWidth - (margin * 2);
      const lineHeight = 5; // Line height in mm

      // Helper function for text wrapping
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 7) => {
        if (!text) return y;

        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line: string, i: number) => {
          pdf.text(line, x, y + (i * lineHeight));
        });

        return y + (lines.length * lineHeight);
      };

      // Variable to track current vertical position
      let yPos = margin;

      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(note.title, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      const dateText = `Last updated: ${formatDate(note.updatedAt || note.createdAt)}`;
      pdf.text(dateText, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Add introduction if available
      if (note.content.introduction?.content) {
        pdf.setFillColor(240, 248, 255); // Light blue
        pdf.rect(margin, yPos, contentWidth, 10 + (note.content.introduction.content.length / 50) * lineHeight, 'F');

        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('Introduction', margin + 5, yPos + 7);

        yPos += 12;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        yPos = addWrappedText(note.content.introduction.content, margin + 5, yPos, contentWidth - 10);
        yPos += 10;
      }

      // Add top illustrations if available
      if (note.content.topIllustrations.length > 0) {
        pdf.setFillColor(245, 245, 245); // Light gray

        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('Illustrations', margin + 5, yPos + 7);
        yPos += 12;

        note.content.topIllustrations.forEach((illustration, index) => {
          // Check if we need a new page
          if (yPos > pageHeight - 40) {
            pdf.addPage();
            yPos = margin;
          }

          pdf.setFillColor(245, 245, 245); // Light gray
          pdf.rect(margin, yPos, contentWidth, 10 + (illustration.content.length / 50) * lineHeight, 'F');

          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.text(`Illustration ${index + 1}`, margin + 5, yPos + 7);

          yPos += 12;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(12);
          yPos = addWrappedText(illustration.content, margin + 5, yPos, contentWidth - 10);
          yPos += 10;
        });
      }

      // Add main points
      if (note.content.points.length > 0) {
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('Main Points', margin + 5, yPos + 7);
        yPos += 12;

        note.content.points.forEach((point) => {
          // Check if we need a new page
          if (yPos > pageHeight - 60) {
            pdf.addPage();
            yPos = margin;
          }

          pdf.setFillColor(240, 255, 240); // Light green

          // Calculate height based on content length
          const verseLength = point.content.verseReference?.reference?.length || 0;
          const explanationLength = point.content.explanation?.content?.length || 0;
          const illustrationsLength = point.content.illustrations.reduce((acc, ill) => acc + ill.content.length, 0);
          const totalLength = verseLength + explanationLength + illustrationsLength;
          const pointHeight = 15 + (totalLength / 50) * lineHeight;

          pdf.rect(margin, yPos, contentWidth, pointHeight, 'F');

          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(14);
          pdf.text(point.title, margin + 5, yPos + 7);
          yPos += 12;

          // Add verse reference if available
          if (point.content.verseReference?.reference) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            pdf.text('Verse Reference:', margin + 5, yPos);
            yPos += 6;

            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(0, 0, 150); // Dark blue for verses
            yPos = addWrappedText(point.content.verseReference.reference, margin + 5, yPos, contentWidth - 10);
            yPos += 6;
          }

          // Add explanation if available
          if (point.content.explanation?.content) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            pdf.text('Explanation:', margin + 5, yPos);
            yPos += 6;

            pdf.setFont('helvetica', 'normal');
            yPos = addWrappedText(point.content.explanation.content, margin + 5, yPos, contentWidth - 10);
            yPos += 6;
          }

          // Add illustrations if available
          if (point.content.illustrations.length > 0) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            pdf.text('Illustrations:', margin + 5, yPos);
            yPos += 6;

            point.content.illustrations.forEach((illustration) => {
              pdf.setFont('helvetica', 'italic');
              pdf.setTextColor(100, 100, 100);
              yPos = addWrappedText(illustration.content, margin + 10, yPos, contentWidth - 15);
              yPos += 4;
            });
          }

          yPos += 10;
        });
      }

      // Add bottom illustrations if available
      if (note.content.bottomIllustrations.length > 0) {
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFillColor(245, 245, 245); // Light gray

        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('Additional Illustrations', margin + 5, yPos + 7);
        yPos += 12;

        note.content.bottomIllustrations.forEach((illustration, index) => {
          // Check if we need a new page
          if (yPos > pageHeight - 40) {
            pdf.addPage();
            yPos = margin;
          }

          pdf.setFillColor(245, 245, 245); // Light gray
          pdf.rect(margin, yPos, contentWidth, 10 + (illustration.content.length / 50) * lineHeight, 'F');

          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.text(`Illustration ${index + 1}`, margin + 5, yPos + 7);

          yPos += 12;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(12);
          yPos = addWrappedText(illustration.content, margin + 5, yPos, contentWidth - 10);
          yPos += 10;
        });
      }

      // Add conclusion if available
      if (note.content.conclusion?.content) {
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFillColor(248, 240, 255); // Light purple
        pdf.rect(margin, yPos, contentWidth, 10 + (note.content.conclusion.content.length / 50) * lineHeight, 'F');

        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('Conclusion', margin + 5, yPos + 7);

        yPos += 12;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        yPos = addWrappedText(note.content.conclusion.content, margin + 5, yPos, contentWidth - 10);
      }

      // Save the PDF with a clean filename
      const filename = note.title
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 50) + '_sermon_note.pdf';

      pdf.save(filename);

      // Show success toast
      toast({
        title: "PDF Exported",
        description: "Your sermon note has been exported to PDF successfully.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export sermon note to PDF. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading sermon note...</p>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-600">Note not found</p>
        <Button className="mt-4" asChild>
          <Link href="/sermon/sermon-notes">Back to Notes</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header - Hidden when printing */}
      <header className="bg-white shadow sticky top-0 z-10 print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-base md:text-lg font-semibold">Luma</span>
            <span className="text-gray-400 mx-1 md:mx-2">|</span>
            <span className="text-base md:text-lg font-semibold">Sermon Note Preview</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/sermon/sermon-notes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notes
            </Button>

            <Button variant="outline" size="sm" onClick={() => router.push(`/sermon/sermon-note-editor?id=${note.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>

            <Button variant="outline" size="sm" onClick={printNote}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>

            <Button variant="outline" size="sm" onClick={exportToPdf}>
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-center">{note.title}</h1>
          <p className="text-gray-500 text-center mt-2">{formatDate(note.updatedAt || note.createdAt)}</p>
        </div>

        {/* Preview Content */}
        <div className="space-y-6">
          {/* Title Section - Hidden when printing (already in print header) */}
          <div className="print:hidden">
            <h1 className="text-3xl font-bold">{note.title}</h1>
            <p className="text-gray-500 mt-2">Last updated: {formatDate(note.updatedAt || note.createdAt)}</p>
          </div>

          {/* Introduction Section */}
          {note.content.introduction?.content && (
            <Card className="border-gray-200 shadow-sm print:shadow-none print:border-0">
              <CardContent className="p-6">
                <h2 className="text-xl font-medium mb-4">Introduction</h2>
                <div className="whitespace-pre-wrap">{note.content.introduction.content}</div>
              </CardContent>
            </Card>
          )}

          {/* Top Illustrations Section */}
          {note.content.topIllustrations.length > 0 && (
            <Card className="border-gray-200 shadow-sm print:shadow-none print:border-0">
              <CardContent className="p-6">
                <h2 className="text-xl font-medium mb-4">Illustrations</h2>
                <div className="space-y-4">
                  {note.content.topIllustrations.map((illustration, index) => (
                    <div key={`top-ill-${index}`} className="p-4 bg-gray-50 rounded-md print:bg-white print:border print:border-gray-200">
                      <h3 className="text-md font-medium mb-2">Illustration {index + 1}</h3>
                      <div className="whitespace-pre-wrap">{illustration.content}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Points Section */}
          {note.content.points.length > 0 && (
            <Card className="border-gray-200 shadow-sm print:shadow-none print:border-0">
              <CardContent className="p-6">
                <h2 className="text-xl font-medium mb-4">Main Points</h2>
                <div className="space-y-6">
                  {note.content.points.map((point) => (
                    <div key={point.id} className="p-4 bg-gray-50 rounded-md print:bg-white print:border print:border-gray-200">
                      <h3 className="text-lg font-medium mb-3">{point.title}</h3>

                      {point.content.verseReference?.reference && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Verse Reference</h4>
                          <p className="text-gray-800">{point.content.verseReference.reference}</p>
                        </div>
                      )}

                      {point.content.explanation?.content && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Explanation</h4>
                          <div className="whitespace-pre-wrap">{point.content.explanation.content}</div>
                        </div>
                      )}

                      {point.content.illustrations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Illustrations</h4>
                          <div className="space-y-3">
                            {point.content.illustrations.map((illustration, illIndex) => (
                              <div key={`${point.id}-ill-${illIndex}`} className="p-3 bg-white rounded-md border border-gray-200 print:bg-gray-50">
                                <div className="whitespace-pre-wrap">{illustration.content}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bottom Illustrations Section */}
          {note.content.bottomIllustrations.length > 0 && (
            <Card className="border-gray-200 shadow-sm print:shadow-none print:border-0">
              <CardContent className="p-6">
                <h2 className="text-xl font-medium mb-4">Additional Illustrations</h2>
                <div className="space-y-4">
                  {note.content.bottomIllustrations.map((illustration, index) => (
                    <div key={`bottom-ill-${index}`} className="p-4 bg-gray-50 rounded-md print:bg-white print:border print:border-gray-200">
                      <h3 className="text-md font-medium mb-2">Illustration {index + 1}</h3>
                      <div className="whitespace-pre-wrap">{illustration.content}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conclusion Section */}
          {note.content.conclusion?.content && (
            <Card className="border-gray-200 shadow-sm print:shadow-none print:border-0">
              <CardContent className="p-6">
                <h2 className="text-xl font-medium mb-4">Conclusion</h2>
                <div className="whitespace-pre-wrap">{note.content.conclusion.content}</div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Bottom Navigation - Hidden when printing */}
      <div className="print:hidden">
        <BottomNavigation />
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            font-size: 12pt;
            line-height: 1.3;
          }
          .whitespace-pre-wrap {
            white-space: pre-wrap;
          }
        }
      `}</style>
    </div>
  )
}
