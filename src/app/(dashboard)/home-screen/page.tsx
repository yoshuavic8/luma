'use client'

import { useRouter } from "next/navigation"
import { Search, Mic, Settings, LogOut, BookOpen } from "lucide-react"
import BottomNavigation from "@/components/BottomNavigation"

import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import TodaysVerse from "@/components/TodaysVerse"
// ProtectedRoute is now handled in the layout
import { useAuth } from "@/contexts/AuthContext"
import { signOut } from "@/lib/auth"

export default function HomeScreen() {
  const { user, userData } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      // Removed console statement
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#2c3e50] px-4 py-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Luma</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{userData?.displayName || user?.email}</span>
            <button onClick={handleSignOut} className="rounded-full p-1 hover:bg-[#3d5973]">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="search"
            placeholder="Search for Bible verses or topics..."
            className="pl-10 bg-white border-gray-200"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                router.push(`/bible-search?query=${encodeURIComponent(e.currentTarget.value.trim())}`);
              }
            }}
          />
        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Today's Verse */}
          <TodaysVerse />

          {/* Bible Reader */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="h-full w-full flex-col space-y-2 text-[#2c3e50]"
                onClick={() => router.push('/bible-reader')}
              >
                <BookOpen className="h-6 w-6" />
                <span className="text-sm font-medium">Bible Reader</span>
              </Button>
            </CardContent>
          </Card>

          {/* Bible Search */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="h-full w-full flex-col space-y-2 text-[#2c3e50]"
                onClick={() => router.push('/bible-search')}
              >
                <Search className="h-6 w-6" />
                <span className="text-sm font-medium">Bible Search</span>
              </Button>
            </CardContent>
          </Card>

          {/* Sermon Builder */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="h-full w-full flex-col space-y-2 text-[#2c3e50]"
                onClick={() => router.push('/sermon/sermon-builder')}
              >
                <Mic className="h-6 w-6" />
                <span className="text-sm font-medium">Sermon Builder</span>
              </Button>
            </CardContent>
          </Card>

          {/* My Notes */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="h-full w-full flex-col space-y-2 text-[#2c3e50]"
                onClick={() => router.push('/sermon/sermon-notes')}
              >
                <BookOpen className="h-6 w-6" />
                <span className="text-sm font-medium">My Notes</span>
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <Button
                variant="ghost"
                className="h-full w-full flex-col space-y-2 text-[#2c3e50]"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-6 w-6" />
                <span className="text-sm font-medium">Settings</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Quote */}
        <div className="mt-8 text-center">
          <p className="text-xs italic text-gray-500">&quot;Your word is a lamp to my feet&quot; – Psalm 119:105</p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
