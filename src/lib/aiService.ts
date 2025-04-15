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
  content: any
}

export async function generateSermonOutline(
  options: SermonGenerationOptions
): Promise<SermonOutline> {
  try {
    // Menggunakan API route yang sudah ada untuk Mistral API
    // Removed console statement

    // Kirim permintaan ke API route dengan streaming
    const response = await fetch('/api/sermon-outline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options,
        userData: { uid: 'client-side' } // Minimal userData untuk API route
      })
    })

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

      // Baca stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedData = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Decode chunk
          const chunk = decoder.decode(value, { stream: true })
          accumulatedData += chunk

          // Proses setiap baris
          const lines = accumulatedData.split('\n')
          accumulatedData = lines.pop() || ''

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line)

                // Cek apakah ini adalah sinyal akhir stream
                if (data._streamComplete) {
                  console.log('Stream complete signal received at:', data._timestamp)
                  continue // Skip ke chunk berikutnya
                }

                // Log timestamp jika ada untuk debugging
                if (data._timestamp) {
                  console.log('Chunk received at:', data._timestamp)
                }

                // Update outline dengan data yang diterima
                if (data.title) outline.title = data.title
                if (data.scripture) outline.scripture = data.scripture
                if (data.introduction) outline.introduction = data.introduction
                if (data.conclusion) outline.conclusion = data.conclusion
                if (data.hook) outline.hook = data.hook

                // Update main points
                if (data.mainPoints && Array.isArray(data.mainPoints)) {
                  outline.mainPoints = data.mainPoints
                }

                // Update application points
                if (data.applicationPoints && Array.isArray(data.applicationPoints)) {
                  outline.applicationPoints = data.applicationPoints
                }

                // Update biblical solution
                if (data.biblicalSolution) {
                  outline.biblicalSolution = data.biblicalSolution
                }

                // Update personal challenge
                if (data.personalChallenge) {
                  outline.personalChallenge = data.personalChallenge
                }

                // Cek apakah ini adalah chunk terakhir
                if (data._completed) {
                  console.log('Final chunk received, outline should be complete')
                }
              } catch (e) {
                console.error('Error parsing JSON chunk:', e, 'Line:', line)
              }
            }
          }
        }

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

        // Tambahkan delay kecil untuk memastikan UI sudah siap
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('Streaming selesai, outline lengkap:', outline.title)
        return outline
      } catch (streamError) {
        console.error('Error reading stream:', streamError)
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
          ? data.mainPoints.map((point: any) => ({
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
                data.applicationPoints.map((p: any) =>
                  p && typeof p === 'object' ? p.point || p.toString() : 'Application point'
                )
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

export async function enhanceSermonContent(options: EnhanceOptions): Promise<any> {
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
