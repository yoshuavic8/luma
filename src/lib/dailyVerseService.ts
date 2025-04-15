import fs from "fs";
import path from "path";

export interface DailyVerse {
  id: number;
  ayat: string;
  content: string;
  pic?: number;
}

// Function to get all daily verses
export async function getAllDailyVerses(): Promise<DailyVerse[]> {
  try {
    // Path to the daily verses JSON file
    const filePath = path.join(
      process.cwd(),
      "public",
      "assets",
      "bible",
      "daily",
      "daily.json"
    );

    // Removed console statement

    // Read the file
    const fileContents = await fs.promises.readFile(filePath, "utf8");
    // Removed console statement

    // Parse the JSON
    const data = JSON.parse(fileContents);
    // Parsed data information

    // Return the verses
    return data || [];
  } catch (error) {
    // Removed console statement
    return [];
  }
}

// Function to get a random daily verse
export async function getRandomDailyVerse(): Promise<DailyVerse | null> {
  try {
    const verses = await getAllDailyVerses();

    if (verses.length === 0) {
      return null;
    }

    // Get a random verse
    const randomIndex = Math.floor(Math.random() * verses.length);
    return verses[randomIndex];
  } catch (error) {
    // Removed console statement
    return null;
  }
}
