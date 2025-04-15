"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BibleVerse } from "@/lib/bibleApi"
import { Sparkles, BookOpen, History, Lightbulb, MessageSquare, Link2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/AuthContext"

interface AIBibleInsightsProps {
  verse: BibleVerse
  onClose: () => void
}

interface InsightContent {
  historicalContext: string
  theologicalInsights: string
  applicationPoints: string[]
  sermonIdeas: {
    title: string
    points: string[]
  }
  crossReferences: {
    reference: string
    text: string
  }[]
}

export default function AIBibleInsights({ verse, onClose }: AIBibleInsightsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [insights, setInsights] = useState<InsightContent | null>(null)
  const [activeTab, setActiveTab] = useState("historical")
  const [error, setError] = useState("")
  const { toast } = useToast()
  const { userData, incrementUsage } = useAuth()

  const generateInsights = async () => {
    try {
      setIsLoading(true)
      setError("")

      // Check if user has reached usage limit
      const canProceed = await incrementUsage()
      if (!canProceed) {
        toast({
          title: "Usage limit reached",
          description: "You've reached your daily limit. Upgrade to Pro for unlimited access.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Call the API to generate insights
      const response = await fetch("/api/bible-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verse: {
            reference: verse.reference,
            text: verse.text,
            translation: verse.translation
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error("Error generating insights:", error)
      setError(error instanceof Error ? error.message : "Failed to generate insights")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate insights",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          AI Bible Insights
        </CardTitle>
        <CardDescription>
          Get AI-powered insights for {verse.reference}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!insights && !isLoading && (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-medium mb-2">Discover Deeper Meaning</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Use AI to explore historical context, theological insights, application points, 
              sermon ideas, and cross references for this verse.
            </p>
            <Button 
              onClick={generateInsights} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Generating Insights..." : "Generate AI Insights"}
            </Button>
            
            {error && (
              <div className="mt-4 text-sm text-red-500 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
            <p className="text-gray-600">Generating insights for {verse.reference}...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
          </div>
        )}

        {insights && (
          <Tabs defaultValue="historical" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="historical" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Historical</span>
              </TabsTrigger>
              <TabsTrigger value="theological" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Theological</span>
              </TabsTrigger>
              <TabsTrigger value="application" className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Application</span>
              </TabsTrigger>
              <TabsTrigger value="sermon" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Sermon</span>
              </TabsTrigger>
              <TabsTrigger value="references" className="flex items-center gap-1">
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">References</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="historical" className="mt-0">
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium mb-2">Historical Context</h3>
                <p>{insights.historicalContext}</p>
              </div>
            </TabsContent>

            <TabsContent value="theological" className="mt-0">
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium mb-2">Theological Insights</h3>
                <p>{insights.theologicalInsights}</p>
              </div>
            </TabsContent>

            <TabsContent value="application" className="mt-0">
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium mb-2">Application Points</h3>
                <ul>
                  {insights.applicationPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="sermon" className="mt-0">
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium mb-2">Sermon Ideas</h3>
                <h4 className="font-medium text-base">{insights.sermonIdeas.title}</h4>
                <ul>
                  {insights.sermonIdeas.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="references" className="mt-0">
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium mb-2">Cross References</h3>
                <ul>
                  {insights.crossReferences.map((ref, index) => (
                    <li key={index} className="mb-2">
                      <strong>{ref.reference}</strong>: {ref.text}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {insights && (
          <Button 
            variant="default" 
            onClick={() => {
              // Copy insights to clipboard
              const text = `
# AI Bible Insights for ${verse.reference}

## Historical Context
${insights.historicalContext}

## Theological Insights
${insights.theologicalInsights}

## Application Points
${insights.applicationPoints.map(point => `- ${point}`).join('\n')}

## Sermon Ideas: ${insights.sermonIdeas.title}
${insights.sermonIdeas.points.map(point => `- ${point}`).join('\n')}

## Cross References
${insights.crossReferences.map(ref => `- ${ref.reference}: ${ref.text}`).join('\n')}
              `.trim();
              
              navigator.clipboard.writeText(text);
              toast({
                title: "Copied to clipboard",
                description: "Insights have been copied to your clipboard",
              });
            }}
          >
            Copy All Insights
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
