import { NextResponse } from 'next/server'

// Konfigurasi untuk Edge Function
export const runtime = 'edge' // Menandai ini sebagai Edge Function

// Deklarasi state untuk menyimpan data antar chunk
// Catatan: Tidak bisa menggunakan global state di Edge Function
// Kita akan menggunakan closure untuk menyimpan state

// Fungsi untuk streaming response dari Mistral AI
function streamMistralResponse(response: Response, options?: any) {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let jsonBuffer = { content: '' }
  // Gunakan closure untuk menyimpan state
  let lastSentData: Record<string, any> = { topic: options?.topic || '' }
  // Tambahkan flag untuk melacak apakah kita sudah mendapatkan respons lengkap
  let hasReceivedCompleteResponse = false
  // Tambahkan variabel untuk menyimpan respons lengkap
  let completeResponseJson: Record<string, any> | null = null

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

                  // Log untuk debugging
                  console.log(
                    'Received content chunk:',
                    content.substring(0, 50) + (content.length > 50 ? '...' : '')
                  )

                  // Selalu akumulasi konten ke jsonBuffer
                  if (!jsonBuffer.hasOwnProperty('content')) {
                    jsonBuffer = { content: '' }
                  }
                  jsonBuffer.content += content

                  // Coba parse sebagai JSON jika content berisi karakter JSON
                  if (jsonBuffer.content.includes('{') && jsonBuffer.content.includes('}')) {
                    try {
                      // Cari tanda kurung kurawal pembuka dan penutup terluar
                      const content = jsonBuffer.content.trim()
                      const firstBrace = content.indexOf('{')
                      const lastBrace = content.lastIndexOf('}')

                      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        // Ekstrak JSON potensial
                        const potentialJson = content.substring(firstBrace, lastBrace + 1)
                        console.log(
                          'Attempting to parse JSON:',
                          potentialJson.substring(0, 50) + '...'
                        )

                        try {
                          const parsedJson = JSON.parse(potentialJson)
                          // Jika berhasil di-parse, kirim ke client
                          // Verifikasi bahwa parsedJson memiliki struktur yang benar
                          if (parsedJson && typeof parsedJson === 'object') {
                            // Simpan respons lengkap
                            completeResponseJson = parsedJson
                            hasReceivedCompleteResponse = true

                            // Tambahkan timestamp dan metadata untuk debugging
                            const enhancedJson = {
                              ...parsedJson,
                              _timestamp: new Date().toISOString(),
                              _chunkId: Math.random().toString(36).substring(2, 9),
                              _isComplete: true
                            }

                            // Log untuk debugging
                            console.log(
                              `Successfully parsed complete JSON with keys:`,
                              Object.keys(parsedJson)
                            )

                            // Kirim ke client
                            controller.enqueue(
                              new TextEncoder().encode(JSON.stringify(enhancedJson) + '\n')
                            )

                            // Simpan data yang sudah dikirim untuk digunakan di akhir stream
                            lastSentData = { ...lastSentData, ...parsedJson }

                            jsonBuffer = { content: '' } // Reset buffer dengan properti content
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
              console.log('Received stream end signal')

              // Jika kita sudah memiliki respons lengkap, gunakan itu
              if (hasReceivedCompleteResponse && completeResponseJson) {
                console.log('Using complete response JSON that was already parsed')
                const finalJson = {
                  ...completeResponseJson,
                  _completed: true,
                  _timestamp: new Date().toISOString(),
                  _finalChunk: true
                }

                controller.enqueue(new TextEncoder().encode(JSON.stringify(finalJson) + '\n'))
              }
              // Jika tidak, coba parse buffer yang ada
              else if (jsonBuffer.hasOwnProperty('content') && jsonBuffer.content.trim()) {
                try {
                  // Coba ekstrak dan parse JSON dari buffer
                  const content = jsonBuffer.content.trim()
                  const firstBrace = content.indexOf('{')
                  const lastBrace = content.lastIndexOf('}')

                  let parsedJson
                  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    const potentialJson = content.substring(firstBrace, lastBrace + 1)
                    console.log(
                      'Attempting to parse final JSON:',
                      potentialJson.substring(0, 50) + '...'
                    )
                    parsedJson = JSON.parse(potentialJson)
                  } else {
                    // Fallback jika tidak dapat menemukan JSON yang valid
                    throw new Error('Could not extract valid JSON from buffer')
                  }

                  // Verifikasi bahwa parsedJson memiliki struktur yang benar
                  if (parsedJson && typeof parsedJson === 'object') {
                    // Gabungkan dengan data yang sudah dikirim sebelumnya
                    let completeData = parsedJson
                    if (Object.keys(lastSentData).length > 0) {
                      completeData = { ...lastSentData, ...parsedJson }
                    }

                    // Pastikan semua field yang diperlukan ada
                    if (!completeData.title) {
                      if (options?.topic) {
                        completeData.title = options.topic
                      } else if (lastSentData?.topic) {
                        completeData.title = lastSentData.topic
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

                    // Reset state
                    lastSentData = {}
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
      "introduction": "Paragraf pendahuluan singkat (minimal 100 karakter)",
      "mainPoints": [
        {
          "title": "Judul Poin 1",
          "scripture": "Ayat Pendukung",
          "explanation": "Penjelasan poin ini (minimal 150 karakter)"
        },
        {
          "title": "Judul Poin 2",
          "scripture": "Ayat Pendukung",
          "explanation": "Penjelasan poin ini (minimal 150 karakter)"
        },
        {
          "title": "Judul Poin 3",
          "scripture": "Ayat Pendukung",
          "explanation": "Penjelasan poin ini (minimal 150 karakter)"
        }
      ],
      "biblicalSolution": {
        "explanation": "Penjelasan solusi berdasarkan prinsip Alkitab (minimal 100 karakter)",
        "illustration": "Ilustrasi singkat yang mendukung solusi"
      },
      "conclusion": "Paragraf kesimpulan singkat (minimal 100 karakter)",
      "applicationPoints": [
        "Poin aplikasi 1 (minimal 50 karakter)",
        "Poin aplikasi 2 (minimal 50 karakter)",
        "Poin aplikasi 3 (minimal 50 karakter)"
      ],
      "personalChallenge": {
        "challenge": "Tantangan personal spesifik untuk audiens (minimal 80 karakter)",
        "illustration": "Ilustrasi singkat yang mendukung tantangan"
      }
    }

    INSTRUKSI PENTING:
    1. Kembalikan HANYA objek JSON tanpa format markdown, blok kode, atau backticks.
    2. Respons harus berupa JSON valid yang dapat langsung di-parse.
    3. Berikan respons dalam Bahasa Indonesia.
    4. Pastikan semua bagian terisi dengan konten yang bermakna dan memenuhi panjang minimal.
    5. Jangan gunakan "N/A" atau placeholder dalam respons Anda.
    6. Jika topik atau ayat Alkitab tidak disediakan, pilih yang sesuai berdasarkan pengalaman Anda.
    7. Pastikan mainPoints selalu berisi minimal 3 poin lengkap.
    8. Pastikan applicationPoints selalu berisi minimal 3 poin aplikasi.
    9. Pastikan semua teks memiliki panjang yang cukup sesuai ketentuan minimal.
    10. Jangan tambahkan komentar atau penjelasan di luar struktur JSON.

    PANDUAN KONTEN:
    - Introduction: Berikan konteks yang jelas tentang topik dan ayat, minimal 100 karakter.
    - Main Points: Setiap poin harus memiliki penjelasan yang substantif, minimal 150 karakter.
    - Conclusion: Rangkum poin-poin utama dengan jelas, minimal 100 karakter.
    - Application Points: Berikan aplikasi praktis yang spesifik, minimal 50 karakter per poin.

    Pastikan semua bagian terisi dengan konten yang bermakna dan substantif.`

    try {
      // Removed console statement

      // Menggunakan fetch API untuk memanggil Mistral API secara langsung
      // Set timeout untuk fetch request
      const controller = new AbortController()
      // Kurangi timeout untuk Edge Function agar tidak melebihi batas Vercel
      const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 detik timeout

      console.log('Sending request to Mistral API...')

      // Gunakan streaming response untuk menghindari timeout
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'mistral-small-latest', // Menggunakan model yang lebih seimbang antara kecepatan dan kualitas
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
          temperature: 0.4, // Nilai temperature yang seimbang
          max_tokens: 1500, // Cukup token untuk respons lengkap
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

      // Streaming response ke client - mulai streaming segera
      const stream = streamMistralResponse(response, options)

      // Kirim respons streaming segera untuk menghindari timeout
      return new Response(stream, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Content-Type-Options': 'nosniff',
          'Transfer-Encoding': 'chunked'
        }
      })

      // Catatan: Kode di bawah ini tidak akan dieksekusi karena kita sudah mengembalikan respons
      // Tapi kita tetap membersihkan timeout untuk keamanan
      clearTimeout(timeoutId)
    } catch (error: unknown) {
      console.error('Error in sermon-outline API route:', error)

      // Handle AbortError (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        return NextResponse.json(
          {
            error: 'Request to Mistral API timed out after 25 seconds',
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
