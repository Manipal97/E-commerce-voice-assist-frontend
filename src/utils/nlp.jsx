export function parseCommand(text) {
  const lower = text.toLowerCase();

  let intent = null;
  let quantity = 1;

  if (lower.includes("add") || lower.includes("buy") || lower.includes("need")) {
    intent = "add";
  }

  if (lower.includes("remove") || lower.includes("delete")) {
    intent = "remove";
  }

  const numberMatch = lower.match(/\d+/);
  if (numberMatch) {
    quantity = parseInt(numberMatch[0]);
  }

  // Remove common words
  const cleanText = lower
    .replace(/add|remove|delete|buy|need|\d+/g, "")
    .trim();

  return {
    intent,
    item: cleanText,
    quantity,
  };
}
