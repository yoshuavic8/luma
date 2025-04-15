"use client"

import { useState, useEffect } from "react"
import { Sparkles, BookOpen, ListPlus, CheckSquare, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { enhanceSermonContent } from "@/lib/aiService"
import { useToast } from "@/components/ui/use-toast"

interface AIEnhanceModalProps {
  sermonContent: any;
  onClose: () => void;
  onApplyEnhancement: (section: string, enhancedContent: any) => void;
}

export default function AIEnhanceModal({
  sermonContent,
  onClose,
  onApplyEnhancement
}: AIEnhanceModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("introduction")
  const [enhancementPreview, setEnhancementPreview] = useState<any>(null)
  const [selectedPoints, setSelectedPoints] = useState<string[]>([])
  const [selectAllPoints, setSelectAllPoints] = useState(false)
  const { toast } = useToast()

  // Effect untuk menangani pemilihan semua poin
  useEffect(() => {
    if (selectAllPoints) {
      // Pilih semua poin
      setSelectedPoints(sermonContent.points.map(point => point.id))
    } else if (selectedPoints.length === sermonContent.points.length) {
      // Jika semua poin sudah dipilih dan checkbox "Pilih Semua" dimatikan
      setSelectedPoints([])
    }
  }, [selectAllPoints, sermonContent.points])

  const generateEnhancement = async (section: string) => {
    setIsLoading(true)
    try {
      let content
      let pointId = null

      switch(section) {
        case "introduction":
          content = sermonContent.introduction?.content || ""
          break
        case "point":
          // Jika tidak ada poin yang dipilih, tampilkan pesan error
          if (selectedPoints.length === 0) {
            toast({
              title: "Tidak ada poin yang dipilih",
              description: "Pilih setidaknya satu poin untuk ditingkatkan",
              variant: "destructive"
            })
            setIsLoading(false)
            return
          }

          // Jika hanya satu poin yang dipilih, tingkatkan poin tersebut
          if (selectedPoints.length === 1) {
            const selectedPoint = sermonContent.points.find(p => p.id === selectedPoints[0])
            if (selectedPoint) {
              content = selectedPoint.content
              pointId = selectedPoint.id
            }
          } else {
            // Jika beberapa poin dipilih, tingkatkan poin pertama dulu
            // Kita akan menangani peningkatan beberapa poin di fungsi applyEnhancement
            const selectedPoint = sermonContent.points.find(p => p.id === selectedPoints[0])
            if (selectedPoint) {
              content = selectedPoint.content
              pointId = selectedPoint.id

              // Tampilkan pesan jika ada beberapa poin yang dipilih
              if (selectedPoints.length > 1) {
                toast({
                  title: "Beberapa Poin Dipilih",
                  description: `${selectedPoints.length} poin akan ditingkatkan. Pratinjau menunjukkan poin pertama.`,
                })
              }
            }
          }
          break
        case "conclusion":
          content = sermonContent.conclusion?.content || ""
          break
        case "structure":
          content = {
            title: sermonContent.title,
            introduction: sermonContent.introduction,
            points: sermonContent.points,
            conclusion: sermonContent.conclusion
          }
          break
        default:
          content = ""
      }

      const result = await enhanceSermonContent({
        section: section as any,
        content
      })

      setEnhancementPreview({
        section,
        content: result,
        pointId: pointId, // Tambahkan pointId ke preview
        selectedPoints: section === "point" ? [...selectedPoints] : [] // Simpan daftar poin yang dipilih
      })

      toast({
        title: "Peningkatan Dihasilkan",
        description: "Lihat pratinjau peningkatan yang dihasilkan oleh AI",
      })
    } catch (error) {
      console.error("Error generating enhancement:", error)
      toast({
        title: "Gagal Menghasilkan Peningkatan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menghasilkan peningkatan",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyEnhancement = () => {
    if (enhancementPreview) {
      if (enhancementPreview.section === "point" && enhancementPreview.selectedPoints?.length > 0) {
        // Jika ini adalah peningkatan poin dan ada beberapa poin yang dipilih
        onApplyEnhancement(enhancementPreview.section, {
          ...enhancementPreview.content,
          pointId: enhancementPreview.pointId,
          selectedPoints: enhancementPreview.selectedPoints
        })
      } else {
        // Untuk peningkatan lainnya
        onApplyEnhancement(enhancementPreview.section, enhancementPreview.content)
      }

      setEnhancementPreview(null)
      setSelectedPoints([])
      setSelectAllPoints(false)

      toast({
        title: "Peningkatan Diterapkan",
        description: "Konten khotbah Anda telah ditingkatkan",
      })
    }
  }

  // Fungsi untuk menangani pemilihan poin
  const handlePointSelection = (pointId: string) => {
    if (selectedPoints.includes(pointId)) {
      // Jika poin sudah dipilih, hapus dari daftar
      setSelectedPoints(selectedPoints.filter(id => id !== pointId))
      // Jika "Pilih Semua" dicentang, matikan
      if (selectAllPoints) {
        setSelectAllPoints(false)
      }
    } else {
      // Jika poin belum dipilih, tambahkan ke daftar
      setSelectedPoints([...selectedPoints, pointId])
      // Jika semua poin sudah dipilih, centang "Pilih Semua"
      if (selectedPoints.length + 1 === sermonContent.points.length) {
        setSelectAllPoints(true)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
            Tingkatkan Catatan Khotbah dengan AI
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="introduction" className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Pendahuluan
              </TabsTrigger>
              <TabsTrigger value="point" className="flex items-center">
                <ListPlus className="h-4 w-4 mr-2" />
                Poin Utama
              </TabsTrigger>
              <TabsTrigger value="conclusion" className="flex items-center">
                <CheckSquare className="h-4 w-4 mr-2" />
                Kesimpulan
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex items-center">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Struktur
              </TabsTrigger>
            </TabsList>

            {/* Tab Pendahuluan */}
            <TabsContent value="introduction">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Tingkatkan pendahuluan Anda agar lebih menarik dan efektif memperkenalkan topik khotbah.
                </p>

                {/* Konten saat ini */}
                <div className="border p-4 rounded-md bg-gray-50">
                  <h3 className="text-sm font-medium mb-2">Pendahuluan Saat Ini</h3>
                  <p className="text-gray-700">{sermonContent.introduction?.content || "Belum ada konten pendahuluan"}</p>
                </div>

                {/* Pratinjau peningkatan */}
                {enhancementPreview?.section === "introduction" && (
                  <div className="border p-4 rounded-md bg-blue-50">
                    <h3 className="text-sm font-medium mb-2">Pendahuluan yang Ditingkatkan</h3>
                    <p className="text-gray-700">{enhancementPreview.content.content}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  {enhancementPreview?.section !== "introduction" ? (
                    <Button
                      onClick={() => generateEnhancement("introduction")}
                      disabled={isLoading || !sermonContent.introduction?.content}
                    >
                      {isLoading ? "Menghasilkan..." : "Hasilkan Peningkatan"}
                    </Button>
                  ) : (
                    <Button onClick={applyEnhancement}>
                      Terapkan Peningkatan
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab Poin Utama */}
            <TabsContent value="point">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Tingkatkan poin utama dengan menambahkan kedalaman pada penjelasan dan ayat Alkitab yang relevan.
                </p>

                {/* Pilih poin untuk ditingkatkan */}
                <div className="border p-4 rounded-md bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Pilih Poin untuk Ditingkatkan</h3>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="select-all-points"
                        className="mr-2 h-4 w-4"
                        checked={selectAllPoints}
                        onChange={(e) => setSelectAllPoints(e.target.checked)}
                      />
                      <label htmlFor="select-all-points" className="text-sm">Pilih Semua</label>
                    </div>
                  </div>

                  {sermonContent.points.length > 0 ? (
                    <div className="space-y-2">
                      {sermonContent.points.map((point: any, index: number) => (
                        <div
                          key={point.id}
                          className={`p-2 border rounded hover:bg-gray-100 cursor-pointer flex items-start ${selectedPoints.includes(point.id) ? 'border-blue-500 bg-blue-50' : ''}`}
                          onClick={() => handlePointSelection(point.id)}
                        >
                          <input
                            type="checkbox"
                            className="mr-3 mt-1 h-4 w-4"
                            checked={selectedPoints.includes(point.id)}
                            onChange={() => handlePointSelection(point.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 overflow-hidden">
                            <p className="font-medium truncate">{point.title}</p>
                            <p className="text-sm text-gray-600 line-clamp-2 overflow-ellipsis">
                              {point.content.explanation?.content || "Belum ada penjelasan"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Belum ada poin yang dibuat</p>
                  )}
                </div>

                {/* Pratinjau peningkatan */}
                {enhancementPreview?.section === "point" && (
                  <div className="border p-4 rounded-md bg-blue-50">
                    <h3 className="text-sm font-medium mb-2">Poin yang Ditingkatkan</h3>
                    <p className="font-medium">{enhancementPreview.content.title}</p>
                    <p className="text-sm text-blue-600 mt-1">
                      {enhancementPreview.content.verseReference?.reference || ""}
                    </p>
                    <p className="mt-2">{enhancementPreview.content.explanation?.content || ""}</p>

                    {enhancementPreview.selectedPoints?.length > 1 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-sm text-yellow-700">
                          <strong>Catatan:</strong> Anda telah memilih {enhancementPreview.selectedPoints.length} poin.
                          Pratinjau ini menunjukkan peningkatan untuk poin pertama.
                          Saat Anda menerapkan peningkatan:
                        </div>
                        <ul className="list-disc ml-5 mt-2 text-sm text-yellow-700">
                          <li>Poin pertama akan ditingkatkan seperti yang ditunjukkan di atas</li>
                          <li>Poin lainnya akan ditandai sebagai "Ditingkatkan dengan AI"</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  {enhancementPreview?.section !== "point" ? (
                    <Button
                      onClick={() => generateEnhancement("point")}
                      disabled={isLoading || sermonContent.points.length === 0 || selectedPoints.length === 0}
                    >
                      {isLoading ? "Menghasilkan..." : "Hasilkan Peningkatan"}
                    </Button>
                  ) : (
                    <Button onClick={applyEnhancement}>
                      Terapkan Peningkatan
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab Kesimpulan */}
            <TabsContent value="conclusion">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Tingkatkan kesimpulan Anda agar lebih kuat dan memberikan penutup yang berkesan.
                </p>

                {/* Konten saat ini */}
                <div className="border p-4 rounded-md bg-gray-50">
                  <h3 className="text-sm font-medium mb-2">Kesimpulan Saat Ini</h3>
                  <p className="text-gray-700">{sermonContent.conclusion?.content || "Belum ada konten kesimpulan"}</p>
                </div>

                {/* Pratinjau peningkatan */}
                {enhancementPreview?.section === "conclusion" && (
                  <div className="border p-4 rounded-md bg-blue-50">
                    <h3 className="text-sm font-medium mb-2">Kesimpulan yang Ditingkatkan</h3>
                    <p className="text-gray-700">{enhancementPreview.content.content}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  {enhancementPreview?.section !== "conclusion" ? (
                    <Button
                      onClick={() => generateEnhancement("conclusion")}
                      disabled={isLoading || !sermonContent.conclusion?.content}
                    >
                      {isLoading ? "Menghasilkan..." : "Hasilkan Peningkatan"}
                    </Button>
                  ) : (
                    <Button onClick={applyEnhancement}>
                      Terapkan Peningkatan
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab Struktur */}
            <TabsContent value="structure">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Dapatkan saran untuk meningkatkan struktur keseluruhan khotbah Anda.
                </p>

                {/* Konten saat ini */}
                <div className="border p-4 rounded-md bg-gray-50">
                  <h3 className="text-sm font-medium mb-2">Struktur Saat Ini</h3>
                  <p className="text-gray-700 mb-2">Judul: {sermonContent.title}</p>
                  <p className="text-gray-700 mb-2">Pendahuluan: {sermonContent.introduction?.content ? "Ada" : "Tidak ada"}</p>
                  <p className="text-gray-700 mb-2">Poin Utama: {sermonContent.points.length} poin</p>
                  <p className="text-gray-700">Kesimpulan: {sermonContent.conclusion?.content ? "Ada" : "Tidak ada"}</p>
                </div>

                {/* Pratinjau peningkatan */}
                {enhancementPreview?.section === "structure" && (
                  <div className="border p-4 rounded-md bg-blue-50">
                    <h3 className="text-sm font-medium mb-2">Saran Peningkatan Struktur</h3>
                    <p className="text-gray-700 whitespace-pre-line">{enhancementPreview.content.content}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  {enhancementPreview?.section !== "structure" ? (
                    <Button
                      onClick={() => generateEnhancement("structure")}
                      disabled={isLoading}
                    >
                      {isLoading ? "Menghasilkan..." : "Hasilkan Saran"}
                    </Button>
                  ) : (
                    <Button onClick={applyEnhancement}>
                      Terapkan Saran
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <div className="p-4 border-t flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
        </div>
      </Card>
    </div>
  );
}
