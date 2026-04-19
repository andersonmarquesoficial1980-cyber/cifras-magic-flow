import { chordToDegree, chordToOrdinal } from './transpose';

// Regex to match common chord patterns including complex extensions
// e.g. G, Am, D/F#, Cmaj7, Bb7, G9, Em7(b5), E7(4/9), D9(11), C(add9), F7M
const CHORD_RE = /\b([A-G][#b]?)(m|maj|min|dim|aug|sus[24]?|add)?(M)?(\d+)?(M)?(\([^)]*\))*(\/[A-G][#b]?)?/g;

/**
 * Determine if a line is a "chord line" — mostly chords and whitespace, little lyrics.
 * Heuristic: after removing all chord tokens and whitespace, very few chars remain.
 */
export function isChordLine(line: string): boolean {
  if (line.trim().length === 0) return false;
  const stripped = line.replace(CHORD_RE, '').replace(/\s/g, '');
  const chordMatches = line.match(CHORD_RE);
  if (!chordMatches || chordMatches.length === 0) return false;
  // A chord line has mostly chords — remaining non-space chars should be minimal
  return stripped.length <= 2;
}

export interface ChordToken {
  type: 'chord' | 'text';
  value: string;
}

/**
 * Tokenize a chord line into chord and spacing tokens.
 */
export function tokenizeChordLine(line: string): ChordToken[] {
  const tokens: ChordToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(CHORD_RE.source, 'g');

  while ((match = re.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: line.slice(lastIndex, match.index) });
    }
    tokens.push({ type: 'chord', value: match[0] });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < line.length) {
    tokens.push({ type: 'text', value: line.slice(lastIndex) });
  }
  return tokens;
}

/**
 * Convert a chord name to its degree representation.
 */
export function chordToGrau(chord: string, key: string): string {
  return chordToDegree(chord, key);
}

export function chordToOrdinalDegree(chord: string, key: string): string {
  return chordToOrdinal(chord, key);
}
