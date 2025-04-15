"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  FileText,
  MessageSquare,
  ArrowRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import BottomNavigation from "@/components/BottomNavigation"

// Template definitions
const templates = [
  {
    id: "expository",
    title: "Expository Template",
    description: "Verse-by-verse explanation of a Bible passage",
    icon: BookOpen,
    structure: {
      introduction: { content: "Introduce the Bible passage and its context..." },
      points: [
        {
          id: "point-1",
          title: "Key Point 1 (Verse X)",
          content: {
            verseReference: { reference: "" },
            explanation: { content: "Explanation of the verse and its meaning..." },
            illustrations: []
          }
        },
        {
          id: "point-2",
          title: "Key Point 2 (Verse Y)",
          content: {
            verseReference: { reference: "" },
            explanation: { content: "Explanation of the verse and its meaning..." },
            illustrations: []
          }
        },
        {
          id: "point-3",
          title: "Key Point 3 (Verse Z)",
          content: {
            verseReference: { reference: "" },
            explanation: { content: "Explanation of the verse and its meaning..." },
            illustrations: []
          }
        }
      ],
      conclusion: { content: "Summarize the main lessons from the passage..." },
      topIllustrations: [],
      bottomIllustrations: []
    }
  },
  {
    id: "topical",
    title: "Topical Template",
    description: "Theme-based sermon with supporting Bible verses",
    icon: MessageSquare,
    structure: {
      introduction: { content: "Introduce the topic and its relevance..." },
      points: [
        {
          id: "point-1",
          title: "Biblical Principle 1",
          content: {
            verseReference: { reference: "" },
            explanation: { content: "Explanation of this principle and supporting verses..." },
            illustrations: []
          }
        },
        {
          id: "point-2",
          title: "Biblical Principle 2",
          content: {
            verseReference: { reference: "" },
            explanation: { content: "Explanation of this principle and supporting verses..." },
            illustrations: []
          }
        },
        {
          id: "point-3",
          title: "Application",
          content: {
            verseReference: { reference: "" },
            explanation: { content: "How to apply these principles in daily life..." },
            illustrations: []
          }
        }
      ],
      conclusion: { content: "Summarize the main points and call to action..." },
      topIllustrations: [],
      bottomIllustrations: []
    }
  },
  {
    id: "narrative",
    title: "Narrative Template",
    description: "Story-based sermon focusing on Biblical narratives",
    icon: FileText,
    structure: {
      introduction: { content: "Set the scene and introduce the Biblical story..." },
      points: [
        {
          id: "point-1",
          title: "Background & Context",
          content: {
            verseReference: { reference: "" },
            explanation: { content: "Historical and cultural context of the story..." },
            illustrations: []
          }
        },
        {
          id: "point-2",
          title: "Key Characters & Actions",
          content: {
            verseReference: { reference: "" },
            explanation: { content: "Analysis of the main characters and their choices..." },
            illustrations: []
          }
        },
        {
          id: "point-3",
          title: "Lessons & Principles",
          content: {
            verseReference: { reference: "" },
            explanation: { content: "Timeless truths and lessons from this narrative..." },
            illustrations: []
          }
        }
      ],
      conclusion: { content: "Connect the Biblical story to our lives today..." },
      topIllustrations: [],
      bottomIllustrations: []
    }
  },
  {
    id: "blank",
    title: "Blank Template",
    description: "Start with a clean slate",
    icon: FileText,
    structure: {
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
    }
  }
]

export default function SermonNoteTemplates() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
  }

  const handleContinue = () => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate)
      if (template) {
        // Store template data in localStorage to be used in the editor
        localStorage.setItem('sermon_note_template', JSON.stringify({
          title: `New ${template.title.replace(' Template', '')} Sermon`,
          content: template.structure
        }))
        
        // Navigate to the editor
        router.push('/sermon/sermon-note-editor?template=true')
      }
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
            <span className="text-base md:text-lg font-semibold">Choose Template</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/sermon/sermon-notes">Back to Notes</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold">Choose a Sermon Note Template</h1>
          <p className="text-gray-600">Select a template to start your sermon note</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {templates.map((template) => {
            const Icon = template.icon
            return (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all ${
                  selectedTemplate === template.id 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${
                      selectedTemplate === template.id 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleContinue}
            disabled={!selectedTemplate}
            className="px-6"
          >
            Continue to Editor
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
