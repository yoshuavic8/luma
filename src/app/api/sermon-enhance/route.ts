import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { content, section, userData } = await request.json();

    // Validasi pengguna
    if (!userData) {
      return NextResponse.json(
        { error: "Data pengguna diperlukan" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Kunci API Mistral tidak dikonfigurasi" },
        { status: 500 }
      );
    }

    // Buat prompt berdasarkan bagian yang akan ditingkatkan
    let prompt = "";
    
    switch(section) {
      case "introduction":
        prompt = `Tingkatkan pendahuluan khotbah berikut agar lebih menarik, menambahkan konteks yang relevan, dan memastikan pendahuluan ini secara efektif memperkenalkan topik khotbah:
        
        "${content}"
        
        Berikan pendahuluan yang ditingkatkan dalam format teks biasa. Pastikan untuk mempertahankan pesan dan gaya aslinya, tetapi tingkatkan kualitas penulisan, kejelasan, dan daya tariknya.`;
        break;
        
      case "point":
        prompt = `Tingkatkan poin khotbah berikut dengan menambahkan kedalaman pada penjelasan, menyarankan ayat Alkitab yang relevan, dan meningkatkan kejelasan:
        
        Judul Poin: "${content.title}"
        Ayat Referensi: "${content.verseReference?.reference || ""}"
        Penjelasan: "${content.explanation?.content || ""}"
        
        Berikan poin yang ditingkatkan dalam format berikut:
        {
          "title": "Judul Poin (yang mungkin ditingkatkan)",
          "verseReference": "Ayat Alkitab yang ditingkatkan atau tambahan",
          "explanation": "Penjelasan yang ditingkatkan"
        }
        
        Pastikan untuk mempertahankan pesan dan gaya aslinya, tetapi tingkatkan kualitas penulisan, kejelasan, dan dampak teologisnya.`;
        break;
        
      case "illustration":
        prompt = `Buatkan ilustrasi yang kuat dan relevan untuk poin khotbah berikut:
        
        Judul Poin: "${content.title || ""}"
        Ayat Referensi: "${content.verseReference || ""}"
        Penjelasan: "${content.explanation || ""}"
        
        Berikan ilustrasi yang menarik dan relevan yang dapat membantu jemaat memahami poin ini dengan lebih baik. Ilustrasi dapat berupa kisah Alkitab, analogi, perumpamaan, atau contoh kehidupan nyata yang relevan dengan konteks Indonesia.`;
        break;
        
      case "conclusion":
        prompt = `Tingkatkan kesimpulan khotbah berikut agar lebih kuat, mengikat semua poin utama, dan memberikan penutup yang berkesan:
        
        "${content}"
        
        Berikan kesimpulan yang ditingkatkan dalam format teks biasa. Pastikan untuk mempertahankan pesan dan gaya aslinya, tetapi tingkatkan kualitas penulisan, kejelasan, dan dampak akhirnya.`;
        break;
        
      case "structure":
        prompt = `Analisis dan tingkatkan struktur keseluruhan khotbah berikut:
        
        Judul: "${content.title || ""}"
        Pendahuluan: "${content.introduction?.content || ""}"
        Poin-poin Utama: ${JSON.stringify(content.points.map(p => ({
          title: p.title,
          verseReference: p.content.verseReference?.reference || "",
          explanation: p.content.explanation?.content || ""
        })))}
        Kesimpulan: "${content.conclusion?.content || ""}"
        
        Berikan saran untuk meningkatkan struktur khotbah ini, termasuk urutan poin, transisi antar bagian, dan keseimbangan konten. Berikan saran dalam format teks biasa yang mudah dipahami.`;
        break;
        
      default:
        return NextResponse.json(
          { error: "Bagian yang tidak valid" },
          { status: 400 }
        );
    }

    // Panggil Mistral API
    try {
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
                  "Anda adalah asisten yang membantu meningkatkan kualitas khotbah untuk pendeta dan pemimpin gereja. Berikan respons Anda dalam Bahasa Indonesia.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: section === "point" ? { type: "json_object" } : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Mistral API merespons dengan status: ${response.status}`
        );
      }

      const completion = await response.json();

      if (
        !completion.choices ||
        !completion.choices[0] ||
        !completion.choices[0].message ||
        !completion.choices[0].message.content
      ) {
        return NextResponse.json(
          { error: "Format respons API tidak valid" },
          { status: 500 }
        );
      }

      let enhancedContent = completion.choices[0].message.content;

      // Jika bagiannya adalah poin, parse sebagai JSON
      if (section === "point") {
        try {
          // Bersihkan respons dari backticks dan penanda json jika ada
          if (enhancedContent.startsWith("```")) {
            enhancedContent = enhancedContent.replace(/^```(json)?\n/, "");
            enhancedContent = enhancedContent.replace(/\n```$/, "");
          }
          
          const pointData = JSON.parse(enhancedContent);
          return NextResponse.json({
            title: pointData.title,
            verseReference: { reference: pointData.verseReference },
            explanation: { content: pointData.explanation }
          });
        } catch (error) {
          return NextResponse.json(
            {
              error: "Gagal mengurai respons AI untuk poin",
              rawResponse: enhancedContent,
            },
            { status: 500 }
          );
        }
      }

      // Untuk bagian lain, kembalikan teks biasa
      return NextResponse.json({ content: enhancedContent });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error tidak diketahui";
      
      return NextResponse.json(
        {
          error: `Error saat menghubungi Mistral API: ${errorMessage}`,
          details: String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: `Gagal meningkatkan konten khotbah: ${
          error instanceof Error ? error.message : "Error tidak diketahui"
        }`,
      },
      { status: 500 }
    );
  }
}
