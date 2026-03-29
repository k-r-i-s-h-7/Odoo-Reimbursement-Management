const findAmounts = (text) => {
  if (!text) return [];

  const matches = text.match(/\d{1,3}(?:[ ,]\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?/g) || [];
  return matches
    .map((item) => Number(item.replace(/[ ,]/g, '')))
    .filter((value) => Number.isFinite(value) && value > 0);
};

const extractTotalAmount = (text) => {
  if (!text) return null;

  const totalRegex = /(total|grand\s*total|amount\s*due|invoice\s*total)[^\n\r]*/gi;
  const highlightedLines = text.match(totalRegex) || [];

  for (const line of highlightedLines) {
    const values = findAmounts(line);
    if (values.length > 0) {
      return values[values.length - 1];
    }
  }

  const values = findAmounts(text);
  if (values.length === 0) return null;
  return Math.max(...values);
};

module.exports = { extractTotalAmount };
