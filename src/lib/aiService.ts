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

    // Kirim permintaan ke API route
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

    if (!response.ok) {
      const errorData = await response.json()
      // Removed console statement
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

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
