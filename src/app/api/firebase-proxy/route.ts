import { NextRequest, NextResponse } from 'next/server';

// Fungsi untuk menangani permintaan ke Firestore
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, method, headers, data } = body;
    
    // Validasi URL
    if (!url || !url.includes('firestore.googleapis.com')) {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }
    
    // Buat opsi fetch
    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      cache: 'no-store',
    };
    
    // Tambahkan body jika ada
    if (data) {
      fetchOptions.body = JSON.stringify(data);
    }
    
    // Kirim permintaan ke Firestore
    const response = await fetch(url, fetchOptions);
    
    // Dapatkan data respons
    const responseData = await response.json();
    
    // Kembalikan respons
    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    // Removed console statement
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Fungsi untuk menangani permintaan OPTIONS (preflight)
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
