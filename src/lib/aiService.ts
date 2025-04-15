export interface SermonPoint {
  title: string
  scripture: string
  explanation: string
}

export interface SermonOutline {
  id?: string
  title: string
  scripture: string
  hook?: string
  introduction: string
  mainPoints: SermonPoint[]
  conclusion: string
  applicationPoints: string[]
  biblicalSolution?: {
    explanation: string
    illustration?: string
  }
  personalChallenge?: {
    challenge: string
    illustration?: string
  }
  createdAt?: string
  updatedAt?: string
  // Metadata untuk streaming
  _mistralDone?: boolean
  _completed?: boolean
  _timestamp?: string
  _forceUpdate?: string
  _updateTime?: string
  // Metadata untuk error handling
  _potentiallyIncomplete?: boolean
  _streamingComplete?: boolean
  _streamingError?: boolean
  _errorMessage?: string
}

export interface SermonGenerationOptions {
  topic?: string
  scripture?: string
  audience: 'general' | 'youth' | 'children' | 'seniors'
  style: 'expository' | 'topical' | 'narrative'
  length: 'short' | 'medium' | 'long'
  includeApplicationPoints: boolean
}

export interface EnhanceOptions {
  section: 'introduction' | 'point' | 'illustration' | 'conclusion' | 'structure'
  content: Record<string, unknown>
}

export async function generateSermonOutline(
  options: SermonGenerationOptions
): Promise<SermonOutline> {
  try {
    // Menggunakan API route yang sudah ada untuk Mistral API
    console.log('Requesting sermon outline with streaming...')

    // Kirim permintaan ke API route dengan streaming dan timeout yang lebih panjang
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 menit timeout

    const response = await fetch('/api/sermon-outline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options,
        userData: { uid: 'client-side' } // Minimal userData untuk API route
      }),
      signal: controller.signal
    })

    // Clear timeout jika request berhasil
    clearTimeout(timeoutId)

    // Handle streaming response
    if (response.body) {
      console.log('Receiving streaming response...')

      // Buat outline kosong untuk diisi secara bertahap
      const outline: SermonOutline = {
        title: 'Loading...',
        scripture: options.scripture || '',
        introduction: '',
        mainPoints: [],
        conclusion: '',
        applicationPoints: []
      }

      // Baca stream dengan timeout dan retry logic
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedData = ''
      let lastProgressUpdate = Date.now()
      let chunkCount = 0

      try {
        // Buat fungsi untuk memantau progress
        const progressMonitor = setInterval(() => {
          const now = Date.now()
          const timeSinceLastUpdate = now - lastProgressUpdate

          // Jika tidak ada update selama 10 detik, tambahkan flag ke outline
          if (timeSinceLastUpdate > 10000) {
            console.log('No updates for 10 seconds, marking outline as potentially incomplete')
            outline._potentiallyIncomplete = true
          }
        }, 5000) // Check setiap 5 detik

        while (true) {
          try {
            const { done, value } = await reader.read()
            if (done) {
              console.log('Stream done signal received')
              break
            }

            // Update timestamp terakhir menerima data
            lastProgressUpdate = Date.now()
            chunkCount++

            // Decode chunk
            const chunk = decoder.decode(value, { stream: true })
            accumulatedData += chunk

            // Proses setiap baris
            const lines = accumulatedData.split('\n')
            accumulatedData = lines.pop() || ''

            // Log progress setiap 5 chunks
            if (chunkCount % 5 === 0) {
              console.log(`Processed ${chunkCount} chunks so far`)
            }

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const data = JSON.parse(line)

                  // Log data yang diterima untuk debugging
                  console.log('Received data chunk with keys:', Object.keys(data))

                  // Cek apakah ini adalah chunk lengkap dengan flag _isComplete
                  if (data._isComplete) {
                    console.log('Received complete JSON data chunk')
                  }

                  // Cek apakah ini adalah sinyal akhir stream
                  if (data._streamComplete) {
                    console.log('Stream complete signal received at:', data._timestamp)
                    continue // Skip ke chunk berikutnya
                  }

                  // Cek apakah ini adalah pesan [DONE] dari Mistral
                  if (data.finish_reason === 'stop' || data.finish_reason === 'length') {
                    console.log('Mistral finish signal received:', data.finish_reason)
                    // Tambahkan flag untuk menandai bahwa ini adalah chunk terakhir dari Mistral
                    data._mistralDone = true
                  }

                  // Log timestamp jika ada untuk debugging
                  if (data._timestamp) {
                    console.log('Chunk received at:', data._timestamp)
                  }

                  // Update outline dengan data yang diterima - dengan logging lebih detail
                  if (data.title) {
                    console.log('Updating title:', data.title)
                    outline.title = data.title
                  }
                  if (data.scripture) {
                    console.log('Updating scripture:', data.scripture)
                    outline.scripture = data.scripture
                  }
                  if (data.introduction) {
                    console.log('Updating introduction, length:', data.introduction.length)
                    outline.introduction = data.introduction
                  }
                  if (data.conclusion) {
                    console.log('Updating conclusion, length:', data.conclusion.length)
                    outline.conclusion = data.conclusion
                  }
                  if (data.hook) {
                    console.log('Updating hook')
                    outline.hook = data.hook
                  }

                  // Update main points
                  if (data.mainPoints && Array.isArray(data.mainPoints)) {
                    console.log('Updating mainPoints, count:', data.mainPoints.length)
                    outline.mainPoints = data.mainPoints
                  }

                  // Update application points
                  if (data.applicationPoints && Array.isArray(data.applicationPoints)) {
                    console.log('Updating applicationPoints, count:', data.applicationPoints.length)
                    outline.applicationPoints = data.applicationPoints
                  }

                  // Update biblical solution
                  if (data.biblicalSolution) {
                    console.log('Updating biblicalSolution')
                    outline.biblicalSolution = data.biblicalSolution
                  }

                  // Update personal challenge
                  if (data.personalChallenge) {
                    console.log('Updating personalChallenge')
                    outline.personalChallenge = data.personalChallenge
                  }

                  // Jika ini adalah chunk lengkap, tandai outline sebagai lengkap
                  if (data._isComplete || data._finalChunk) {
                    console.log('Marking outline as complete from complete chunk')
                    outline._completed = true
                  }

                  // Cek apakah ini adalah chunk terakhir
                  if (data._completed) {
                    console.log('Final chunk received, outline should be complete')
                  }

                  // Cek apakah ini adalah pesan terakhir dari Mistral
                  if (data._mistralDone) {
                    console.log('Mistral has finished generating content')
                    // Tandai bahwa Mistral telah selesai
                    outline._mistralDone = true
                  }
                } catch (e) {
                  console.error('Error parsing JSON chunk:', e, 'Line:', line)
                }
              }
            }
          } catch (readError) {
            console.error('Error reading chunk:', readError)
            // Jika terjadi error saat membaca chunk, coba lanjutkan
            // Ini bisa terjadi jika koneksi terputus sebentar
            continue
          }
        }

        // Hentikan monitor progress
        clearInterval(progressMonitor)

        // Proses data yang tersisa
        if (accumulatedData.trim()) {
          try {
            const data = JSON.parse(accumulatedData)
            // Update final data
            if (data.title) outline.title = data.title
            if (data.scripture) outline.scripture = data.scripture
            if (data.introduction) outline.introduction = data.introduction
            if (data.conclusion) outline.conclusion = data.conclusion
            if (data.hook) outline.hook = data.hook

            if (data.mainPoints && Array.isArray(data.mainPoints)) {
              outline.mainPoints = data.mainPoints
            }

            if (data.applicationPoints && Array.isArray(data.applicationPoints)) {
              outline.applicationPoints = data.applicationPoints
            }

            if (data.biblicalSolution) {
              outline.biblicalSolution = data.biblicalSolution
            }

            if (data.personalChallenge) {
              outline.personalChallenge = data.personalChallenge
            }
          } catch (e) {
            console.error('Error parsing final JSON chunk:', e)
          }
        }

        // Verifikasi kelengkapan outline sebelum mengembalikan
        console.log('Verifikasi kelengkapan outline:', {
          title: outline.title,
          introLength: outline.introduction?.length || 0,
          pointsCount: outline.mainPoints?.length || 0,
          conclusionLength: outline.conclusion?.length || 0
        })

        // Cek apakah outline memiliki konten yang cukup
        const isOutlineEmpty =
          outline.title === 'Loading...' ||
          !outline.introduction ||
          outline.introduction.length < 10 ||
          !outline.mainPoints ||
          outline.mainPoints.length === 0 ||
          !outline.conclusion ||
          outline.conclusion.length < 10

        if (isOutlineEmpty) {
          console.warn('Outline tidak lengkap setelah streaming selesai, mencoba fallback...')

          // Jika outline tidak lengkap, buat fallback minimal
          if (outline.title === 'Loading...') {
            outline.title = options.topic || 'Outline Khotbah'
          }

          if (!outline.introduction || outline.introduction.length < 10) {
            outline.introduction =
              'Pendahuluan akan ditambahkan di sini. Silakan tambahkan pendahuluan Anda sendiri yang sesuai dengan topik khotbah.'
          }

          if (!outline.mainPoints || outline.mainPoints.length === 0) {
            outline.mainPoints = [
              {
                title: 'Poin 1: ' + (options.topic || 'Tema Utama'),
                scripture: '',
                explanation:
                  'Silakan isi dengan konten Anda sendiri yang sesuai dengan topik khotbah.'
              }
            ]
          } else {
            // Pastikan setiap poin memiliki konten yang cukup
            outline.mainPoints = outline.mainPoints.map(point => ({
              title: point.title || 'Poin Khotbah',
              scripture: point.scripture || '',
              explanation:
                point.explanation && point.explanation.length > 10
                  ? point.explanation
                  : 'Silakan isi dengan penjelasan yang sesuai dengan poin ini.'
            }))
          }

          if (!outline.conclusion || outline.conclusion.length < 10) {
            outline.conclusion =
              'Kesimpulan akan ditambahkan di sini. Silakan tambahkan kesimpulan Anda sendiri yang merangkum poin-poin utama khotbah.'
          }

          if (!outline.applicationPoints || outline.applicationPoints.length === 0) {
            outline.applicationPoints = ['Aplikasi praktis akan ditambahkan di sini.']
          }
        }

        // Tambahkan delay yang lebih pendek karena kita sudah memiliki mekanisme monitoring
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Pastikan outline memiliki judul yang valid
        if (outline.title === 'Loading...') {
          outline.title = options.topic || 'Outline Khotbah'
        }

        // Pastikan outline memiliki properti yang diperlukan
        outline._completed = true

        // Pastikan mainPoints tidak kosong
        if (!outline.mainPoints || outline.mainPoints.length === 0) {
          outline.mainPoints = [
            {
              title: 'Poin 1: ' + (options.topic || 'Tema Utama'),
              scripture: '',
              explanation:
                'Silakan isi dengan konten Anda sendiri yang sesuai dengan topik khotbah.'
            }
          ]
        }

        // Pastikan introduction tidak kosong
        if (!outline.introduction || outline.introduction.length < 10) {
          outline.introduction =
            'Pendahuluan akan ditambahkan di sini. Silakan tambahkan pendahuluan Anda sendiri yang sesuai dengan topik khotbah.'
        }

        // Pastikan conclusion tidak kosong
        if (!outline.conclusion || outline.conclusion.length < 10) {
          outline.conclusion =
            'Kesimpulan akan ditambahkan di sini. Silakan tambahkan kesimpulan Anda sendiri yang merangkum poin-poin utama khotbah.'
        }

        // Log detail outline untuk debugging
        console.log('Streaming selesai, outline lengkap:', {
          title: outline.title,
          introLength: outline.introduction?.length || 0,
          pointsCount: outline.mainPoints?.length || 0,
          conclusionLength: outline.conclusion?.length || 0,
          mistralDone: outline._mistralDone || false,
          completed: outline._completed || false
        })

        // Buat objek baru untuk memastikan React mendeteksi perubahan
        const finalOutline: SermonOutline = {
          ...outline,
          _timestamp: new Date().toISOString(), // Tambahkan timestamp untuk memastikan objek baru
          _forceUpdate: Math.random().toString(36).substring(2, 9), // Tambahkan random string untuk memastikan objek baru
          _streamingComplete: true // Tandai bahwa streaming telah selesai
        }

        // Jika outline ditandai sebagai potentially incomplete, tambahkan warning
        if (outline._potentiallyIncomplete) {
          console.warn('Returning potentially incomplete outline due to streaming interruption')
          finalOutline._potentiallyIncomplete = true
        }

        return finalOutline
      } catch (streamError) {
        console.error('Error reading stream:', streamError)

        // Jika outline sudah memiliki beberapa data, kembalikan apa yang sudah kita dapatkan
        // daripada gagal sepenuhnya
        if (outline.title !== 'Loading...' && outline.mainPoints && outline.mainPoints.length > 0) {
          console.warn('Stream error occurred but we have partial data, returning it')

          // Pastikan semua field yang diperlukan ada
          if (!outline.introduction || outline.introduction.length < 10) {
            outline.introduction =
              'Pendahuluan tidak lengkap karena masalah koneksi. Silakan coba lagi.'
          }

          if (!outline.conclusion || outline.conclusion.length < 10) {
            outline.conclusion =
              'Kesimpulan tidak lengkap karena masalah koneksi. Silakan coba lagi.'
          }

          return {
            ...outline,
            _timestamp: new Date().toISOString(),
            _forceUpdate: Math.random().toString(36).substring(2, 9),
            _streamingError: true,
            _errorMessage: streamError instanceof Error ? streamError.message : String(streamError)
          }
        }

        // Jika tidak ada data yang cukup, lempar error
        throw new Error(
          'Error reading stream: ' +
            (streamError instanceof Error ? streamError.message : String(streamError))
        )
      }
    }

    // Jika tidak ada response.body (tidak streaming), handle respons normal
    if (!response.ok) {
      const errorData = await response.json()
      // Removed console statement
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    // Jika tidak ada streaming response, coba parse respons normal
    try {
      const data = await response.json()
      // Removed console statement

      // Validasi data terlebih dahulu
      if (!data || typeof data !== 'object') {
        console.error('Invalid API response format:', data)
        throw new Error('Invalid API response format')
      }

      // Log untuk debugging
      console.log('API response received:', JSON.stringify(data).substring(0, 200) + '...')

      // Konversi format respons API ke format SermonOutline dengan validasi yang lebih ketat
      const outline: SermonOutline = {
        title: data.title || 'Untitled Sermon',
        scripture: data.scripture || 'No scripture provided',
        hook: data.hook || '',
        introduction: data.introduction || '',
        mainPoints: Array.isArray(data.mainPoints)
          ? data.mainPoints.map((point: Record<string, unknown>) => ({
              title: point?.title || 'Untitled Point',
              scripture: point?.scripture || '',
              explanation: point?.explanation || ''
            }))
          : [{ title: 'Main Point', scripture: '', explanation: '' }],
        conclusion: data.conclusion || '',
        applicationPoints: data.applicationPoints
          ? Array.isArray(data.applicationPoints)
            ? // Handle array of strings
              typeof data.applicationPoints[0] === 'string'
              ? data.applicationPoints
              : // Handle array of objects with 'point' property
                data.applicationPoints.map((p: unknown) => {
                  if (p && typeof p === 'object') {
                    // Use type assertion to access 'point' property
                    const obj = p as Record<string, unknown>
                    return obj.point ? String(obj.point) : 'Application point'
                  }
                  return 'Application point'
                })
            : []
          : [],
        // Tambahkan biblicalSolution jika ada
        ...(data.biblicalSolution &&
          typeof data.biblicalSolution === 'object' && {
            biblicalSolution: {
              explanation: data.biblicalSolution.explanation || '',
              illustration: data.biblicalSolution.illustration || ''
            }
          }),
        // Tambahkan personalChallenge jika ada
        ...(data.personalChallenge &&
          typeof data.personalChallenge === 'object' && {
            personalChallenge: {
              challenge: data.personalChallenge.challenge || '',
              illustration: data.personalChallenge.illustration || ''
            }
          })
      }
      return outline
    } catch (parseError) {
      console.error('Error parsing non-streaming response:', parseError)
      throw new Error(
        'Failed to parse response: ' +
          (parseError instanceof Error ? parseError.message : String(parseError))
      )
    }
  } catch (error) {
    // Removed console statement
    throw new Error(error instanceof Error ? error.message : 'Failed to generate sermon outline')
  }
}

export async function enhanceSermonContent(
  options: EnhanceOptions
): Promise<Record<string, unknown>> {
  try {
    // Kirim permintaan ke API route
    const response = await fetch('/api/sermon-enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        section: options.section,
        content: options.content,
        userData: { uid: 'client-side' } // Minimal userData untuk API route
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Gagal meningkatkan konten khotbah')
  }
}
