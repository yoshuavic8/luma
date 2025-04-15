import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { options, userData } = await request.json();

    // Validasi pengguna - tanpa batas penggunaan
    if (!userData) {
      return NextResponse.json(
        { error: "User data is required" },
        { status: 400 }
      );
    }

    // Batas penggunaan dinonaktifkan untuk sementara

    const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY;
    if (!apiKey) {
      // Removed console statement
      return NextResponse.json(
        { error: "Mistral API key not configured" },
        { status: 500 }
      );
    }

    // Removed console statement
    // Removed console statement
    // Removed console statement
    // Removed console statement

    const prompt = `Buatkan outline khotbah dengan parameter berikut:
    Topik: ${options.topic || "(Silakan pilih topik yang sesuai)"}
    Ayat Alkitab: ${
      options.scripture || "(Silakan pilih ayat Alkitab yang sesuai)"
    }
    Target Audiens: ${
      options.audience === "general"
        ? "Umum"
        : options.audience === "youth"
        ? "Pemuda"
        : options.audience === "children"
        ? "Anak-anak"
        : options.audience === "seniors"
        ? "Lansia"
        : options.audience
    }
    Gaya: ${
      options.style === "expository"
        ? "Ekspositori"
        : options.style === "topical"
        ? "Topikal"
        : options.style === "narrative"
        ? "Naratif"
        : options.style
    }
    Panjang: ${
      options.length === "short"
        ? "Pendek"
        : options.length === "medium"
        ? "Sedang"
        : options.length === "long"
        ? "Panjang"
        : options.length
    }
    Sertakan Poin Aplikasi: ${options.includeApplicationPoints ? "Ya" : "Tidak"}

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

    Buatlah ilustrasi yang singkat namun bermakna, dan pastikan ilustrasi tersebut memperkuat poin yang ingin disampaikan.`;

    try {
      // Removed console statement

      // Menggunakan fetch API untuk memanggil Mistral API secara langsung
      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: "mistral-large-latest",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful assistant that generates sermon outlines for pastors and church leaders. Please provide your response in Indonesian language (Bahasa Indonesia).",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Mistral API responded with status: ${response.status}`
        );
      }

      const completion = await response.json();

      // Removed console statement

      if (
        !completion.choices ||
        !completion.choices[0] ||
        !completion.choices[0].message ||
        !completion.choices[0].message.content
      ) {
        // Error: Unexpected API response format
        return NextResponse.json(
          { error: "Invalid API response format" },
          { status: 500 }
        );
      }

      let outlineText = completion.choices[0].message.content;
      // Removed console statement

      // Bersihkan respons dari backticks dan penanda json jika ada
      if (outlineText.startsWith("```")) {
        // Hapus penanda awal (```json atau ```)
        outlineText = outlineText.replace(/^```(json)?\n/, "");
        // Hapus penanda akhir (```)
        outlineText = outlineText.replace(/\n```$/, "");
      }

      try {
        const outline = JSON.parse(outlineText);
        // Removed console statement
        return NextResponse.json(outline);
      } catch {
        // Removed console statement
        // Removed console statement

        // Coba lagi dengan pendekatan lain jika masih gagal
        try {
          // Coba hapus semua karakter non-JSON yang mungkin ada
          const cleanedText = outlineText.replace(
            /[\u0000-\u001F\u007F-\u009F]/g,
            ""
          );
          const outline = JSON.parse(cleanedText);
          // Removed console statement
          return NextResponse.json(outline);
        } catch {
          // Removed console statement

          return NextResponse.json(
            {
              error: "Failed to parse AI response",
              rawResponse: outlineText,
            },
            { status: 500 }
          );
        }
      }
    } catch (error: unknown) {
      // Removed console statement

      // Cek apakah ada pesan error yang lebih spesifik
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const statusCode = 500;

      return NextResponse.json(
        {
          error: `Error connecting to Mistral API: ${errorMessage}`,
          details: String(error),
        },
        { status: statusCode }
      );
    }
  } catch (error: unknown) {
    // Removed console statement
    return NextResponse.json(
      {
        error: `Failed to generate sermon outline: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
