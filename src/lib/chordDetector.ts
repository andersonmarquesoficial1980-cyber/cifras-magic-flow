import { chordToDegree, chordToOrdinal } from './transpose';

// Regex to match common chord patterns including complex extensions
// e.g. G, Am, D/F#, Cmaj7, Bb7, G9, Em7(b5), E7(4/9), D9(11), C(add9), F7M
const CHORD_RE = /\b([A-G][#b]?)(m|maj|min|dim|aug|sus[24]?|add|no)?(M)?(\d+)?(M)?(b\d+)?(#\d+)?(\([^)]*\))*(\/[A-G][#b]?)?(?=[\s,|$]|$)/g;

/**
 * Determine if a line is a "chord line" — mostly chords and whitespace, little lyrics.
 * Heuristic: after removing all chord tokens, section markers [..] and whitespace, very few chars remain.
 * Also handles mixed lines like "[Intro] E E7/G# A D7"
 */
export function isChordLine(line: string): boolean {
  if (line.trim().length === 0) return false;
  // Remove section markers like [Intro], [Refrão] etc before analysis
  const withoutSection = line.replace(/\[[^\]]*\]/g, '').trim();
  // If after removing section marker nothing is left, it's a pure section marker (not a chord line)
  if (withoutSection.length === 0) return false;
  const stripped = withoutSection.replace(CHORD_RE, '').replace(/[\s()]/g, '');
  const chordMatches = withoutSection.match(CHORD_RE);
  if (!chordMatches || chordMatches.length === 0) return false;
  // A chord line has mostly chords — remaining non-space/paren chars should be minimal
  // Mais tolerante: até 5 chars restantes (ex: traços, pipes, letras isoladas)
  return stripped.length <= 5;
}

/**
 * Returns true if a line starts with a section marker AND has chords after it.
 * e.g. "[Intro] E E7/G# A D7"
 */
export function isMixedSectionChordLine(line: string): boolean {
  return /^\[[^\]]+\]\s+\S/.test(line) && isChordLine(line);
}

/**
 * Extracts section label and chord portion from a mixed line.
 * "[Intro] E E7/G#" -> { section: 'Intro', chords: 'E E7/G#' }
 */
export function splitSectionAndChords(line: string): { section: string; chords: string } {
  const m = line.match(/^\[([^\]]+)\]\s*(.*)$/);
  return m ? { section: m[1], chords: m[2] } : { section: '', chords: line };
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
