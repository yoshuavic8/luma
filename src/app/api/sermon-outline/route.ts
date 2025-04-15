import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { monitoring } from '@/lib/monitoring'

export async function POST(request: Request) {
  const startTime = performance.now()
  monitoring.log('info', 'Sermon outline generation started')

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

      monitoring.log('info', 'Sending request to Mistral API', { model: 'mistral-small-latest' })

      // Gunakan model yang lebih kecil dan lebih cepat
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
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      })

      // Clear timeout jika request berhasil
      clearTimeout(timeoutId)

      // Log respons status untuk monitoring
      monitoring.trackApiResponse(
        'https://api.mistral.ai/v1/chat/completions',
        'POST',
        response.status,
        startTime
      )

      // Jika respons tidak OK, tangani error
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details')
        console.error(`Mistral API error (${response.status}):`, errorText)
        throw new Error(
          `Mistral API responded with status: ${response.status}. Details: ${errorText.substring(0, 200)}`
        )
      }

      const completion = await response.json()
      monitoring.log('info', 'Received response from Mistral API')

      // Validasi respons dengan lebih ketat
      if (
        !completion ||
        typeof completion !== 'object' ||
        !completion.choices ||
        !Array.isArray(completion.choices) ||
        completion.choices.length === 0 ||
        !completion.choices[0] ||
        !completion.choices[0].message ||
        !completion.choices[0].message.content ||
        typeof completion.choices[0].message.content !== 'string'
      ) {
        const errorMsg = 'Invalid API response format'
        monitoring.trackError(new Error(errorMsg), { completion })
        return NextResponse.json(
          {
            error: 'Invalid API response format',
            details: JSON.stringify(completion)
          },
          { status: 500 }
        )
      }

      let outlineText = completion.choices[0].message.content
      monitoring.log('info', 'Content received', {
        length: outlineText.length,
        preview: outlineText.substring(0, 100) + '...'
      })

      // Bersihkan respons dari backticks dan penanda json jika ada
      if (outlineText.startsWith('```')) {
        // Hapus penanda awal (```json atau ```)
        outlineText = outlineText.replace(/^```(json)?\n/, '')
        // Hapus penanda akhir (```)
        outlineText = outlineText.replace(/\n```$/, '')
      }

      try {
        // Validasi bahwa teks adalah JSON yang valid
        if (!outlineText.trim().startsWith('{') || !outlineText.trim().endsWith('}')) {
          const errorMsg = 'Response is not valid JSON'
          monitoring.trackError(new Error(errorMsg), {
            preview: outlineText.substring(0, 100) + '...'
          })
          throw new Error('Response is not valid JSON')
        }

        const outline = JSON.parse(outlineText)
        monitoring.log('info', 'Successfully parsed JSON response')

        // Validasi struktur outline
        if (
          !outline.title ||
          !outline.scripture ||
          !outline.introduction ||
          !Array.isArray(outline.mainPoints)
        ) {
          const errorMsg = 'Missing required fields in outline'
          monitoring.trackError(new Error(errorMsg), { fields: Object.keys(outline) })
          throw new Error('Missing required fields in outline')
        }

        return NextResponse.json(outline)
      } catch (parseError) {
        monitoring.trackError(
          parseError instanceof Error ? parseError : new Error('Error parsing JSON')
        )

        // Coba lagi dengan pendekatan lain jika masih gagal
        try {
          // Coba hapus semua karakter non-JSON yang mungkin ada
          const cleanedText = outlineText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          // Tambahkan validasi tambahan
          if (!cleanedText.trim().startsWith('{') || !cleanedText.trim().endsWith('}')) {
            throw new Error('Cleaned text is still not valid JSON')
          }

          const outline = JSON.parse(cleanedText)
          monitoring.log('info', 'Successfully parsed JSON after cleaning')
          return NextResponse.json(outline)
        } catch (cleanError) {
          monitoring.trackError(
            cleanError instanceof Error
              ? cleanError
              : new Error('Failed to parse even after cleaning')
          )

          // Jika masih gagal, coba buat outline minimal
          try {
            // Buat outline minimal sebagai fallback
            const fallbackOutline = {
              title: 'Outline Khotbah',
              scripture: options.scripture || 'Ayat tidak tersedia',
              introduction:
                'Maaf, terjadi kesalahan dalam pembuatan outline. Ini adalah outline minimal.',
              mainPoints: [
                {
                  title: 'Poin 1',
                  scripture: '',
                  explanation: 'Silakan isi dengan konten Anda sendiri.'
                }
              ],
              conclusion: 'Kesimpulan akan ditambahkan di sini.',
              applicationPoints: ['Aplikasi akan ditambahkan di sini.']
            }

            return NextResponse.json(fallbackOutline, { status: 200 })
          } catch {
            // Jika semua upaya gagal, kembalikan error
            return NextResponse.json(
              {
                error: 'Failed to parse AI response',
                rawResponse: outlineText.substring(0, 500)
              },
              { status: 500 }
            )
          }
        }
      }
    } catch (error: unknown) {
      monitoring.trackError(
        error instanceof Error ? error : new Error('Unknown error in sermon-outline API route')
      )
      Sentry.captureException(error)

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
  } finally {
    // Log performa total jika berhasil
    monitoring.log('info', 'Sermon outline generation completed', {
      duration: `${(performance.now() - startTime).toFixed(2)}ms`
    })
  }
}
