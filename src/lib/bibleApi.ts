import { searchLocalVerses, getLocalVerse } from "./localBibleService";

export interface BibleVerse {
  id: string;
  reference: string;
  text: string;
  translation: string;
}

// Export available translations for use in components
export { availableTranslations } from "./localBibleService";

export async function searchVerses(
  query: string,
  translationId: string = "en_asv"
): Promise<{ verses: BibleVerse[] }> {
  try {
    const localVerses = await searchLocalVerses(query, translationId);
    return { verses: localVerses };
  } catch (error) {
    // Removed console statement
    throw new Error("Failed to search verses");
  }
}

export async function getVerse(
  verseId: string,
  translationId: string = "en_asv"
): Promise<BibleVerse> {
  try {
    // Check if verseId is a reference (e.g., "John 3:16" or "Kejadian 1:1")
    if (verseId.includes(":") || verseId.includes(" ")) {
      const localVerse = await getLocalVerse(verseId, translationId);
      if (localVerse) {
        return localVerse;
      }
    } else {
      // If it's an ID format like "JHN.3.16", try to parse it
      const parts = verseId.split(".");
      if (parts.length === 3) {
        const bookCode = parts[0];
        const chapter = parts[1];
        const verse = parts[2];

        // Try to find the verse in local data
        const localVerse = await getLocalVerse(
          `${bookCode} ${chapter}:${verse}`,
          translationId
        );
        if (localVerse) {
          return localVerse;
        }
      }
    }

    // If we get here, the verse wasn't found
    throw new Error(`Verse not found: ${verseId}`);
  } catch (error) {
    // Removed console statement
    throw new Error("Failed to get verse");
  }
}
