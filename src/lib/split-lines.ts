/** A laid-out word: its text (with trailing space) and the top of its box in px. */
export interface WordBox {
  text: string;
  top: number;
  /** True for a forced break (`\n` in the source) that must end the current line. */
  hardBreakAfter?: boolean;
}

/**
 * Groups words into the visual lines they wrapped to. Words whose tops differ by more
 * than `tolerance` px start a new line; a hard break always ends the line.
 */
export function groupWordsIntoLines(words: WordBox[], tolerance = 2): string[] {
  const lines: string[] = [];
  let lineTop: number | null = null;
  let forceNew = false;
  for (const w of words) {
    if (lineTop === null || forceNew || Math.abs(w.top - lineTop) > tolerance) {
      lines.push(w.text);
      lineTop = w.top;
    } else {
      lines[lines.length - 1] += w.text;
    }
    forceNew = w.hardBreakAfter === true;
  }
  return lines.map((l) => l.trim()).filter((l) => l.length > 0);
}

/** Splits source text into words, keeping the separating space on each word and flagging `\n`. */
export function tokenizeWords(text: string): { text: string; hardBreakAfter: boolean }[] {
  const out: { text: string; hardBreakAfter: boolean }[] = [];
  const hardLines = text.split("\n");
  hardLines.forEach((hardLine, li) => {
    const words = hardLine.split(" ").filter((w) => w.length > 0);
    words.forEach((w, wi) => {
      const last = wi === words.length - 1;
      out.push({ text: last ? w : `${w} `, hardBreakAfter: last && li < hardLines.length - 1 });
    });
  });
  return out;
}
