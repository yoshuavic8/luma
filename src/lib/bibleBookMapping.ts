// Mapping between Indonesian and English Bible book names
// This helps with cross-translation verse lookup

// Indonesian to English mapping
export const indonesianToEnglish: Record<string, string> = {
  // Old Testament
  kejadian: "genesis",
  keluaran: "exodus",
  imamat: "leviticus",
  bilangan: "numbers",
  ulangan: "deuteronomy",
  yosua: "joshua",
  "hakim-hakim": "judges",
  hakim: "judges",
  rut: "ruth",
  "1 samuel": "1 samuel",
  "2 samuel": "2 samuel",
  "1 raja-raja": "1 kings",
  "2 raja-raja": "2 kings",
  "1 tawarikh": "1 chronicles",
  "2 tawarikh": "2 chronicles",
  ezra: "ezra",
  nehemia: "nehemiah",
  ester: "esther",
  ayub: "job",
  mazmur: "psalms",
  amsal: "proverbs",
  pengkhotbah: "ecclesiastes",
  "kidung agung": "song of solomon",
  yesaya: "isaiah",
  yeremia: "jeremiah",
  ratapan: "lamentations",
  yehezkiel: "ezekiel",
  daniel: "daniel",
  hosea: "hosea",
  yoel: "joel",
  amos: "amos",
  obaja: "obadiah",
  yunus: "jonah",
  mikha: "micah",
  nahum: "nahum",
  habakuk: "habakkuk",
  zefanya: "zephaniah",
  hagai: "haggai",
  zakharia: "zechariah",
  maleakhi: "malachi",

  // New Testament
  matius: "matthew",
  markus: "mark",
  lukas: "luke",
  yohanes: "john",
  "kisah para rasul": "acts",
  "kisah rasul": "acts",
  roma: "romans",
  "1 korintus": "1 corinthians",
  "2 korintus": "2 corinthians",
  galatia: "galatians",
  efesus: "ephesians",
  filipi: "philippians",
  kolose: "colossians",
  "1 tesalonika": "1 thessalonians",
  "2 tesalonika": "2 thessalonians",
  "1 timotius": "1 timothy",
  "2 timotius": "2 timothy",
  titus: "titus",
  filemon: "philemon",
  ibrani: "hebrews",
  yakobus: "james",
  "1 petrus": "1 peter",
  "2 petrus": "2 peter",
  "1 yohanes": "1 john",
  "2 yohanes": "2 john",
  "3 yohanes": "3 john",
  yudas: "jude",
  wahyu: "revelation",
};

// English to Indonesian mapping (reverse of the above)
export const englishToIndonesian: Record<string, string> = Object.entries(
  indonesianToEnglish
).reduce((acc, [indo, eng]) => {
  acc[eng] = indo;
  return acc;
}, {} as Record<string, string>);

// Direct mapping for specific problematic books
const specialCases: Record<string, Record<string, string>> = {
  amsal: { en: "proverbs" },
  yeremia: { en: "jeremiah" },
  wahyu: { en: "revelation" },
  proverbs: { id: "amsal" },
  jeremiah: { id: "yeremia" },
  revelation: { id: "wahyu" },
  "kisah rasul-rasul": { en: "acts" },
  "kisah rasul": { en: "acts" },
  acts: { id: "kisah rasul-rasul" },
};

// Function to get equivalent book name in another language
export function getEquivalentBookName(
  bookName: string,
  targetLanguage: "en" | "id"
): string {
  // Normalize the book name: lowercase and remove extra spaces
  const normalizedName = bookName.toLowerCase().trim();

  // Check special cases first
  if (
    specialCases[normalizedName] &&
    specialCases[normalizedName][targetLanguage]
  ) {
    console.log(
      `Special case match: ${normalizedName} -> ${specialCases[normalizedName][targetLanguage]}`
    );
    return specialCases[normalizedName][targetLanguage];
  }

  if (targetLanguage === "en") {
    // Try direct mapping first
    if (indonesianToEnglish[normalizedName]) {
      return indonesianToEnglish[normalizedName];
    }

    // Try to find a partial match
    for (const [indo, eng] of Object.entries(indonesianToEnglish)) {
      if (normalizedName.includes(indo) || indo.includes(normalizedName)) {
        console.log(
          `Partial match: ${normalizedName} includes or is included in ${indo} -> ${eng}`
        );
        return eng;
      }
    }

    // Try special case for book names with numbers
    const numberMatch = normalizedName.match(/^(\d+)\s+(.+)$/);
    if (numberMatch) {
      const [, num, name] = numberMatch;
      const nameOnly = name.trim();

      // Try to find a match for the name part
      for (const [indo, eng] of Object.entries(indonesianToEnglish)) {
        if (
          nameOnly === indo ||
          nameOnly.includes(indo) ||
          indo.includes(nameOnly)
        ) {
          const result = `${num} ${eng}`;
          // Removed console statement
          return result;
        }
      }
    }

    // If no match found, return the original name (might already be in English)
    // Removed console statement
    return bookName;
  } else {
    // Try direct mapping first
    if (englishToIndonesian[normalizedName]) {
      return englishToIndonesian[normalizedName];
    }

    // Try to find a partial match
    for (const [eng, indo] of Object.entries(englishToIndonesian)) {
      if (normalizedName.includes(eng) || eng.includes(normalizedName)) {
        console.log(
          `Partial match: ${normalizedName} includes or is included in ${eng} -> ${indo}`
        );
        return indo;
      }
    }

    // Try special case for book names with numbers
    const numberMatch = normalizedName.match(/^(\d+)\s+(.+)$/);
    if (numberMatch) {
      const [, num, name] = numberMatch;
      const nameOnly = name.trim();

      // Try to find a match for the name part
      for (const [eng, indo] of Object.entries(englishToIndonesian)) {
        if (
          nameOnly === eng ||
          nameOnly.includes(eng) ||
          eng.includes(nameOnly)
        ) {
          const result = `${num} ${indo}`;
          // Removed console statement
          return result;
        }
      }
    }

    // If no match found, return the original name (might already be in Indonesian)
    // Removed console statement
    return bookName;
  }
}
