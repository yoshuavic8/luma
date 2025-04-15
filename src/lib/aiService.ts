export interface SermonPoint {
  title: string;
  scripture: string;
  explanation: string;
}

export interface SermonOutline {
  id?: string;
  title: string;
  scripture: string;
  hook?: string;
  introduction: string;
  mainPoints: SermonPoint[];
  conclusion: string;
  applicationPoints: string[];
  biblicalSolution?: {
    explanation: string;
    illustration?: string;
  };
  personalChallenge?: {
    challenge: string;
    illustration?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface SermonGenerationOptions {
  topic?: string;
  scripture?: string;
  audience: "general" | "youth" | "children" | "seniors";
  style: "expository" | "topical" | "narrative";
  length: "short" | "medium" | "long";
  includeApplicationPoints: boolean;
}

export interface EnhanceOptions {
  section:
    | "introduction"
    | "point"
    | "illustration"
    | "conclusion"
    | "structure";
  content: any;
}

export async function generateSermonOutline(
  options: SermonGenerationOptions
): Promise<SermonOutline> {
  try {
    // Menggunakan API route yang sudah ada untuk Mistral API
    // Removed console statement

    // Kirim permintaan ke API route
    const response = await fetch("/api/sermon-outline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        options,
        userData: { uid: "client-side" }, // Minimal userData untuk API route
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Removed console statement
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    // Removed console statement

    // Konversi format respons API ke format SermonOutline
    const outline: SermonOutline = {
      title: data.title,
      scripture: data.scripture,
      hook: data.hook || "",
      introduction: data.introduction || "",
      mainPoints: data.mainPoints.map((point: any) => ({
        title: point.title,
        scripture: point.scripture || "",
        explanation: point.explanation || "",
      })),
      conclusion: data.conclusion || "",
      applicationPoints: data.applicationPoints
        ? Array.isArray(data.applicationPoints)
          ? // Handle array of strings
            typeof data.applicationPoints[0] === "string"
            ? data.applicationPoints
            : // Handle array of objects with 'point' property
              data.applicationPoints.map((p: any) => p.point || p.toString())
          : []
        : [],
      // Tambahkan biblicalSolution jika ada
      ...(data.biblicalSolution && {
        biblicalSolution: {
          explanation: data.biblicalSolution.explanation || "",
          illustration: data.biblicalSolution.illustration || "",
        },
      }),
      // Tambahkan personalChallenge jika ada
      ...(data.personalChallenge && {
        personalChallenge: {
          challenge: data.personalChallenge.challenge || "",
          illustration: data.personalChallenge.illustration || "",
        },
      }),
    };

    return outline;
  } catch (error) {
    // Removed console statement
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to generate sermon outline"
    );
  }
}

export async function enhanceSermonContent(
  options: EnhanceOptions
): Promise<any> {
  try {
    // Kirim permintaan ke API route
    const response = await fetch("/api/sermon-enhance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        section: options.section,
        content: options.content,
        userData: { uid: "client-side" }, // Minimal userData untuk API route
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Gagal meningkatkan konten khotbah"
    );
  }
}
