"use client"

import { useState } from "react"
import { Bold, Italic, List, Save, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function SermonNoteEditor() {
  const [sermonTitle, setSermonTitle] = useState("The Power of Faith")

  return (
    <div className="flex min-h-screen bg-white text-[#607d8b]">
      {/* Formatting Sidebar */}
      <div className="sticky top-0 h-screen w-16 border-r border-gray-200 bg-white p-4">
        <div className="flex flex-col items-center space-y-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bold className="h-5 w-5" />
                  <span className="sr-only">Bold</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Bold</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Italic className="h-5 w-5" />
                  <span className="sr-only">Italic</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Italic</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <List className="h-5 w-5" />
                  <span className="sr-only">Bullet List</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Bullet List</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Sermon Title:</span>
            <Input
              value={sermonTitle}
              onChange={(e) => setSermonTitle(e.target.value)}
              className="h-9 w-[300px] border-gray-200 focus:border-gray-300 focus:ring-0"
            />
          </div>
          <Button className="bg-[#607d8b] hover:bg-[#546e7a]">
            <Save className="mr-2 h-4 w-4" />
            Save as Template
          </Button>
        </header>

        {/* Editor Content */}
        <div className="mx-auto max-w-4xl p-6">
          {/* Introduction Section */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-medium">Introduction</h2>
            <Textarea
              placeholder="Write your sermon introduction here..."
              className="min-h-[120px] resize-y border-gray-200 focus:border-gray-300 focus:ring-0"
            />
          </section>

          {/* Main Points Section */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-medium">Main Points</h2>
            <div className="space-y-6">
              {/* Point 1 */}
              <Card className="border-gray-200">
                <CardHeader className="bg-gray-50 pb-3">
                  <CardTitle className="text-base font-medium">Point 1</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="verse1" className="mb-2 block text-sm font-medium">
                        Verse Reference
                      </label>
                      <Input
                        id="verse1"
                        placeholder="e.g., John 3:16"
                        className="border-gray-200 focus:border-gray-300 focus:ring-0"
                      />
                    </div>
                    <div>
                      <label htmlFor="explanation1" className="mb-2 block text-sm font-medium">
                        Explanation
                      </label>
                      <Textarea
                        id="explanation1"
                        placeholder="Explain your first point..."
                        className="min-h-[100px] resize-y border-gray-200 focus:border-gray-300 focus:ring-0"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Illustration
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Point 2 */}
              <Card className="border-gray-200">
                <CardHeader className="bg-gray-50 pb-3">
                  <CardTitle className="text-base font-medium">Point 2</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="verse2" className="mb-2 block text-sm font-medium">
                        Verse Reference
                      </label>
                      <Input
                        id="verse2"
                        placeholder="e.g., Romans 8:28"
                        className="border-gray-200 focus:border-gray-300 focus:ring-0"
                      />
                    </div>
                    <div>
                      <label htmlFor="explanation2" className="mb-2 block text-sm font-medium">
                        Explanation
                      </label>
                      <Textarea
                        id="explanation2"
                        placeholder="Explain your second point..."
                        className="min-h-[100px] resize-y border-gray-200 focus:border-gray-300 focus:ring-0"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Illustration
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Point 3 */}
              <Card className="border-gray-200">
                <CardHeader className="bg-gray-50 pb-3">
                  <CardTitle className="text-base font-medium">Point 3</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="verse3" className="mb-2 block text-sm font-medium">
                        Verse Reference
                      </label>
                      <Input
                        id="verse3"
                        placeholder="e.g., Philippians 4:13"
                        className="border-gray-200 focus:border-gray-300 focus:ring-0"
                      />
                    </div>
                    <div>
                      <label htmlFor="explanation3" className="mb-2 block text-sm font-medium">
                        Explanation
                      </label>
                      <Textarea
                        id="explanation3"
                        placeholder="Explain your third point..."
                        className="min-h-[100px] resize-y border-gray-200 focus:border-gray-300 focus:ring-0"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Illustration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Conclusion Section */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-medium">Conclusion</h2>
            <Textarea
              placeholder="Write your sermon conclusion here..."
              className="min-h-[120px] resize-y border-gray-200 focus:border-gray-300 focus:ring-0"
            />
          </section>
        </div>
      </div>
    </div>
  )
}

