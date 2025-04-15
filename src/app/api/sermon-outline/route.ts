import { NextResponse } from 'next/server'

// Deklarasi global state untuk menyimpan data antar chunk
declare global {
  var lastSentData: Record<string, any> | null
}

// Inisialisasi global state jika belum ada
if (typeof global.lastSentData === 'undefined') {
  global.lastSentData = null
}

// Fungsi untuk streaming response dari Mistral AI
function streamMistralResponse(response: Response, options?: any) {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let jsonBuffer = {}

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Decode chunk dan tambahkan ke buffer
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // Proses setiap baris dalam buffer
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Simpan baris terakhir yang mungkin belum lengkap

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.substring(6))
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  const content = data.choices[0].delta.content

                  // Coba parse sebagai JSON jika content berisi karakter JSON
                  if (content.includes('{') || content.includes('}')) {
                    try {
                      // Update jsonBuffer dengan content baru
                      if (!jsonBuffer.hasOwnProperty('content')) {
                        jsonBuffer = { content: '' }
                      }
                      jsonBuffer.content += content

                      // Coba parse jsonBuffer.content sebagai JSON
                      if (
                        jsonBuffer.content.trim().startsWith('{') &&
                        jsonBuffer.content.trim().endsWith('}')
                      ) {
                        try {
                          const parsedJson = JSON.parse(jsonBuffer.content)
                          // Jika berhasil di-parse, kirim ke client
                          // Verifikasi bahwa parsedJson memiliki struktur yang benar
                          if (parsedJson && typeof parsedJson === 'object') {
                            // Tambahkan timestamp dan metadata untuk debugging
                            const enhancedJson = {
                              ...parsedJson,
                              _timestamp: new Date().toISOString(),
                              _chunkId: Math.random().toString(36).substring(2, 9)
                            }

                            // Log untuk debugging
                            console.log(
                              `Sending chunk ${enhancedJson._chunkId} with keys:`,
                              Object.keys(parsedJson)
                            )

                            // Kirim ke client
                            controller.enqueue(
                              new TextEncoder().encode(JSON.stringify(enhancedJson) + '\n')
                            )

                            // Simpan data yang sudah dikirim untuk digunakan di akhir stream
                            if (!global.lastSentData) {
                              global.lastSentData = {}
                            }
                            global.lastSentData = { ...global.lastSentData, ...parsedJson }

                            jsonBuffer = {} // Reset buffer
                          } else {
                            console.warn('Parsed JSON tidak valid:', parsedJson)
                          }
                        } catch (e) {
                          // JSON belum lengkap, lanjutkan buffering
                        }
                      }
                    } catch (e) {
                      // Bukan JSON valid, kirim sebagai teks biasa
                      controller.enqueue(
                        new TextEncoder().encode(JSON.stringify({ text: content }) + '\n')
                      )
                    }
                  } else {
                    // Bukan JSON, kirim sebagai teks biasa
                    controller.enqueue(
                      new TextEncoder().encode(JSON.stringify({ text: content }) + '\n')
                    )
                  }
                }
              } catch (e) {
                console.error('Error parsing stream data:', e)
              }
            } else if (line === 'data: [DONE]' || line.includes('"finish_reason"')) {
              // Stream selesai, kirim data terakhir jika ada
              if (jsonBuffer.hasOwnProperty('content') && jsonBuffer.content.trim()) {
                try {
                  // Coba parse sebagai JSON
                  const parsedJson = JSON.parse(jsonBuffer.content)

                  // Verifikasi bahwa parsedJson memiliki struktur yang benar
                  if (parsedJson && typeof parsedJson === 'object') {
                    // Gabungkan dengan data yang sudah dikirim sebelumnya
                    let completeData = parsedJson
                    if (global.lastSentData) {
                      completeData = { ...global.lastSentData, ...parsedJson }
                    }

                    // Pastikan semua field yang diperlukan ada
                    if (!completeData.title) {
                      if (options?.topic) {
                        completeData.title = options.topic
                      } else if (global.lastSentData?.topic) {
                        completeData.title = global.lastSentData.topic
                      } else {
                        completeData.title = 'Outline Khotbah'
                      }
                    }

                    if (!completeData.introduction) {
                      completeData.introduction = 'Pendahuluan khotbah.'
                    }

                    if (
                      !completeData.mainPoints ||
                      !Array.isArray(completeData.mainPoints) ||
                      completeData.mainPoints.length === 0
                    ) {
                      completeData.mainPoints = [
                        {
                          title: 'Poin 1',
                          scripture: '',
                          explanation: 'Penjelasan poin.'
                        }
                      ]
                    }

                    if (!completeData.conclusion) {
                      completeData.conclusion = 'Kesimpulan khotbah.'
                    }

                    // Tambahkan flag completed untuk menandai akhir stream
                    const finalJson = {
                      ...completeData,
                      _completed: true,
                      _timestamp: new Date().toISOString(),
                      _finalChunk: true
                    }

                    // Log untuk debugging
                    console.log('Sending final chunk with keys:', Object.keys(finalJson))

                    controller.enqueue(new TextEncoder().encode(JSON.stringify(finalJson) + '\n'))

                    // Kirim juga sinyal selesai terpisah untuk memastikan client tahu stream sudah selesai
                    controller.enqueue(
                      new TextEncoder().encode(
                        JSON.stringify({
                          _streamComplete: true,
                          _timestamp: new Date().toISOString(),
                          _dataKeys: Object.keys(completeData)
                        }) + '\n'
                      )
                    )

                    // Reset global state
                    global.lastSentData = null
                  } else {
                    // Bukan JSON valid, kirim sebagai teks biasa dengan flag completed
                    controller.enqueue(
                      new TextEncoder().encode(
                        JSON.stringify({
                          text: jsonBuffer.content,
                          _completed: true,
                          _timestamp: new Date().toISOString()
                        }) + '\n'
                      )
                    )
                  }
                } catch (e) {
                  // Bukan JSON valid, kirim sebagai teks biasa dengan flag completed
                  controller.enqueue(
                    new TextEncoder().encode(
                      JSON.stringify({
                        text: jsonBuffer.content,
                        _completed: true,
                        _timestamp: new Date().toISOString()
                      }) + '\n'
                    )
                  )

                  // Kirim juga sinyal selesai terpisah
                  controller.enqueue(
                    new TextEncoder().encode(
                      JSON.stringify({
                        _streamComplete: true,
                        _timestamp: new Date().toISOString()
                      }) + '\n'
                    )
                  )
                }
              } else {
                // Tidak ada data di buffer, tapi tetap kirim sinyal selesai
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({
                      _streamComplete: true,
                      _timestamp: new Date().toISOString()
                    }) + '\n'
                  )
                )
              }
            }
          }
        }

        // Proses buffer yang tersisa
        if (buffer.trim()) {
          if (buffer.startsWith('data: ') && buffer !== 'data: [DONE]') {
            try {
              const data = JSON.parse(buffer.substring(6))
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({ text: data.choices[0].delta.content }) + '\n'
                  )
                )
              }
            } catch (e) {
              console.error('Error parsing final buffer:', e)
            }
          }
        }

        controller.close()
      } catch (e) {
        console.error('Stream processing error:', e)
        controller.error(e)
      }
    }
  })
}

export async function POST(request: Request) {
  try {
    const { options, userData } = await request.json()

    // Validasi pengguna - tanpa batas penggunaan
    if (!userData) {
      return NextResponse.json({ error: 'User data is required' }, { status: 400 })
    }

    // Batas penggunaan dinonaktifkan untuk sementara

    const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY
    if (!apiKey) {
      // Removed console statement
      return NextResponse.json({ error: 'Mistral API key not configured' }, { status: 500 })
    }

    // Removed console statement
    // Removed console statement
    // Removed console statement
    // Removed console statement

    const prompt = `Buatkan outline khotbah dengan parameter berikut:
    Topik: ${options.topic || '(Silakan pilih topik yang sesuai)'}
    Ayat Alkitab: ${options.scripture || '(Silakan pilih ayat Alkitab yang sesuai)'}
    Target Audiens: ${
      options.audience === 'general'
        ? 'Umum'
        : options.audience === 'youth'
          ? 'Pemuda'
          : options.audience === 'children'
            ? 'Anak-anak'
            : options.audience === 'seniors'
              ? 'Lansia'
              : options.audience
    }
    Gaya: ${
      options.style === 'expository'
        ? 'Ekspositori'
        : options.style === 'topical'
          ? 'Topikal'
          : options.style === 'narrative'
            ? 'Naratif'
            : options.style
    }
    Panjang: ${
      options.length === 'short'
        ? 'Pendek'
        : options.length === 'medium'
          ? 'Sedang'
          : options.length === 'long'
            ? 'Panjang'
            : options.length
    }
    Sertakan Poin Aplikasi: ${options.includeApplicationPoints ? 'Ya' : 'Tidak'}

    Format respons sebagai objek JSON dengan struktur berikut:
    {
      "title": "Judul Khotbah",
      "scripture": "Referensi Ayat Utama",
      "hook": "Hook/kait emosional untuk menarik perhatian di awal khotbah",
      "introduction": "Paragraf pendahuluan singkat",
      "mainPoints": [
        {
          "title": "Judul Poin 1",
          "scripture": "Ayat Pendukung",
          "explanation": "Penjelasan poin ini",
          "illustration": "Ilustrasi, quote tokoh, atau kisah nyata yang memperkuat poin ini"
        },
        // Poin-poin lainnya...
      ],
      "biblicalSolution": {
        "explanation": "Penjelasan solusi berdasarkan prinsip Alkitab",
        "illustration": "Ilustrasi, quote tokoh, atau kisah nyata yang memperkuat solusi"
      },
      "conclusion": "Paragraf kesimpulan singkat",
      "applicationPoints": [
        {
          "point": "Poin aplikasi 1",
          "illustration": "Ilustrasi singkat atau contoh praktis untuk poin aplikasi ini"
        },
        // Poin aplikasi lainnya...
      ],
      "personalChallenge": {
        "challenge": "Tantangan personal spesifik untuk audiens",
        "illustration": "Ilustrasi atau contoh inspiratif yang mendukung tantangan"
      }
    }

    PENTING: Kembalikan HANYA objek JSON tanpa format markdown, blok kode, atau backticks. Respons harus berupa JSON valid yang dapat langsung di-parse. Berikan respons dalam Bahasa Indonesia.

    CATATAN: Jangan gunakan "N/A" dalam respons Anda. Jika topik atau ayat Alkitab tidak disediakan, silakan pilih yang sesuai berdasarkan pengalaman Anda.

    PANDUAN ILUSTRASI: Pastikan setiap ilustrasi relevan dengan poin yang dijelaskan dan dapat berupa:
    1. Kisah nyata dari tokoh Alkitab atau sejarah
    2. Kutipan inspiratif dari tokoh terkenal
    3. Analogi atau perumpamaan yang mudah dipahami
    4. Contoh kehidupan sehari-hari yang relatable

    Buatlah ilustrasi yang singkat namun bermakna, dan pastikan ilustrasi tersebut memperkuat poin yang ingin disampaikan.`

    try {
      // Removed console statement

      // Menggunakan fetch API untuk memanggil Mistral API secara langsung
      // Set timeout untuk fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 50000) // 50 detik timeout

      console.log('Sending request to Mistral API...')

      // Gunakan streaming response untuk menghindari timeout
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'mistral-small-latest', // Menggunakan model yang lebih kecil untuk respons lebih cepat
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant that generates sermon outlines for pastors and church leaders. Please provide your response in Indonesian language (Bahasa Indonesia). Keep your response concise and focused.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5, // Mengurangi temperature untuk respons yang lebih deterministik
          max_tokens: 1500, // Mengurangi max_tokens untuk mengurangi waktu respons
          response_format: { type: 'json_object' },
          stream: true // Aktifkan streaming untuk menghindari timeout
        }),
        signal: controller.signal
      })

      // Jika respons tidak OK, tangani error
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details')
        console.error(`Mistral API error (${response.status}):`, errorText)
        throw new Error(
          `Mistral API responded with status: ${response.status}. Details: ${errorText.substring(0, 200)}`
        )
      }

      // Simpan options untuk digunakan di akhir stream
      global.lastSentData = { topic: options.topic || '' }

      // Streaming response ke client
      const stream = streamMistralResponse(response, options)
      return new Response(stream, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      })

      // Clear timeout jika request berhasil
      clearTimeout(timeoutId)
    } catch (error: unknown) {
      console.error('Error in sermon-outline API route:', error)

      // Handle AbortError (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        return NextResponse.json(
          {
            error: 'Request to Mistral API timed out after 50 seconds',
            details:
              'The AI service took too long to respond. Please try again with a simpler request.'
          },
          { status: 504 }
        )
      }

      // Cek apakah ada pesan error yang lebih spesifik
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const statusCode = error instanceof Error && error.message.includes('status: 429') ? 429 : 500

      return NextResponse.json(
        {
          error: `Error connecting to Mistral API: ${errorMessage}`,
          details: String(error)
        },
        { status: statusCode }
      )
    }
  } catch (error: unknown) {
    // Removed console statement
    return NextResponse.json(
      {
        error: `Failed to generate sermon outline: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      },
      { status: 500 }
    )
  }
}
