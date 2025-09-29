/**
 * Converts a string to Title Case and adds "Trail" if not present
 * @param text - The text to convert
 * @returns The text in Title Case format with "Trail" suffix if needed
 */
export function toTitleCase(text: string): string {
  if (!text) return text;

  const titleCaseText = text
    .toLowerCase()
    .split(" ")
    .map((word) => {
      // Handle special cases for common trail name words
      const specialWords = [
        "and",
        "or",
        "the",
        "of",
        "in",
        "on",
        "at",
        "to",
        "for",
        "with",
        "by",
      ];
      if (specialWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

  // Check if "trail" is already in the name (case insensitive)
  const hasTrail = /\btrail\b/i.test(titleCaseText);

  // Add "Trail" if not present
  return hasTrail ? titleCaseText : `${titleCaseText} Trail`;
}
