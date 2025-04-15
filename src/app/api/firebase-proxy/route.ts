import { NextRequest, NextResponse } from 'next/server'

// Fungsi untuk menangani permintaan ke Firestore
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, method, headers, data } = body

    // Validasi URL
    if (!url || !url.includes('firestore.googleapis.com')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    console.log(`Firebase Proxy: ${method} ${url}`)

    // Buat opsi fetch
    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://luma-ai.vercel.app',
        ...headers
      },
      cache: 'no-store'
    }

    // Tambahkan body jika ada
    if (data) {
      fetchOptions.body = JSON.stringify(data)
    }

    try {
      // Kirim permintaan ke Firestore
      const response = await fetch(url, fetchOptions)

      // Periksa apakah respons berhasil
      if (!response.ok) {
        console.error(`Firebase Proxy Error: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.error('Error details:', errorText)

        return NextResponse.json(
          {
            error: `Firebase Error: ${response.status} ${response.statusText}`,
            details: errorText
          },
          {
            status: response.status,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        )
      }

      // Dapatkan data respons
      const responseData = await response.json()

      console.log(`Firebase Proxy: Success ${method} ${url}`)

      // Kembalikan respons
      return NextResponse.json(responseData, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    } catch (fetchError) {
      console.error('Firebase Proxy Fetch Error:', fetchError)
      return NextResponse.json(
        { error: 'Error fetching from Firebase', details: String(fetchError) },
        { status: 502 }
      )
    }
  } catch (error) {
    console.error('Firebase Proxy Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    )
  }
}

// Fungsi untuk menangani permintaan OPTIONS (preflight)
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  )
}
