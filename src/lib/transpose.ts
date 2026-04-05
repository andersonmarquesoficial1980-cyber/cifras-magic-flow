const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const NOTE_ALIASES: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#',
  'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
};

function noteIndex(note: string): number {
  const normalized = NOTE_ALIASES[note] ?? note;
  return NOTES.indexOf(normalized);
}

// --- Transpose ---

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;

  // Handle slash chords
  const slashIdx = chord.indexOf('/');
  if (slashIdx > 0) {
    const main = chord.slice(0, slashIdx);
    const bass = chord.slice(slashIdx + 1);
    return transposeChord(main, semitones) + '/' + transposeChord(bass, semitones);
  }

  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return chord;
  const [, root, suffix] = match;

  const idx = noteIndex(root);
  if (idx < 0) return chord;

  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return NOTES[newIdx] + suffix;
}

// --- Harmonic field (major scale) ---

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11]; // W W H W W W H
const DEGREE_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Common chord quality → degree quality mapping
function degreeQuality(suffix: string): string {
  // Strip leading 'm' distinction — we handle it via degree case
  const s = suffix.trim();
  if (s.startsWith('m7') || s === 'm' || s.startsWith('m(') || s.startsWith('m9') || s.startsWith('m6') || s.startsWith('m11')) {
    return s; // keep it, we'll lowercase the degree
  }
  return s;
}

export function chordToDegree(chord: string, key: string): string {
  // Handle slash chords
  const slashIdx = chord.indexOf('/');
  if (slashIdx > 0) {
    const main = chord.slice(0, slashIdx);
    const bass = chord.slice(slashIdx + 1);
    return chordToDegree(main, key) + '/' + chordToDegree(bass, key);
  }

  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return chord;
  const [, root, suffix] = match;

  // Extract just the root note from the key (e.g., "Am" → "A", "C#m" → "C#")
  const keyMatch = key.match(/^([A-G][#b]?)/);
  if (!keyMatch) return chord;
  const keyRoot = keyMatch[1];

  const keyIdx = noteIndex(keyRoot);
  const chordIdx = noteIndex(root);
  if (keyIdx < 0 || chordIdx < 0) return chord;

  const interval = ((chordIdx - keyIdx) % 12 + 12) % 12;

  // Find closest degree
  let degreeIdx = MAJOR_INTERVALS.indexOf(interval);
  let accidental = '';

  if (degreeIdx < 0) {
    // Check if it's a flat version of a degree
    const sharpIdx = MAJOR_INTERVALS.indexOf((interval + 1) % 12);
    const flatIdx = MAJOR_INTERVALS.indexOf((interval - 1 + 12) % 12);
    if (sharpIdx >= 0) {
      degreeIdx = sharpIdx;
      accidental = 'b';
    } else if (flatIdx >= 0) {
      degreeIdx = flatIdx;
      accidental = '#';
    } else {
      return chord; // can't map
    }
  }

  let degree = DEGREE_LABELS[degreeIdx];

  const isMinor = suffix.startsWith('m') && !suffix.startsWith('maj');
  const isDim = suffix.startsWith('dim') || suffix.startsWith('°');
  const isAug = suffix.startsWith('aug') || suffix.startsWith('+');

  // Build quality suffix (everything after the root note)
  let qualitySuffix = '';
  if (isMinor) {
    qualitySuffix = 'm' + suffix.slice(1); // keep 'm' + rest (e.g. m7, m9)
  } else if (isDim) {
    qualitySuffix = 'dim' + suffix.slice(suffix.startsWith('dim') ? 3 : 1);
  } else if (isAug) {
    qualitySuffix = 'aug' + (suffix.startsWith('aug') ? suffix.slice(3) : suffix.slice(1));
  } else {
    qualitySuffix = suffix; // e.g. "7", "9", "maj7", "sus4"
  }

  return degree + qualitySuffix;
}

export const ALL_KEYS = NOTES;

const ORDINAL_LABELS = ['1º', '2º', '3º', '4º', '5º', '6º', '7º'];

export function chordToOrdinal(chord: string, key: string): string {
  // Handle slash chords
  const slashIdx = chord.indexOf('/');
  if (slashIdx > 0) {
    const main = chord.slice(0, slashIdx);
    const bass = chord.slice(slashIdx + 1);
    return chordToOrdinal(main, key) + '/' + chordToOrdinal(bass, key);
  }

  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return chord;
  const [, root, suffix] = match;

  const keyMatch = key.match(/^([A-G][#b]?)/);
  if (!keyMatch) return chord;
  const keyRoot = keyMatch[1];

  const keyIdx = noteIndex(keyRoot);
  const chordIdx = noteIndex(root);
  if (keyIdx < 0 || chordIdx < 0) return chord;

  const interval = ((chordIdx - keyIdx) % 12 + 12) % 12;

  let degreeIdx = MAJOR_INTERVALS.indexOf(interval);
  if (degreeIdx < 0) {
    const sharpIdx = MAJOR_INTERVALS.indexOf((interval + 1) % 12);
    const flatIdx = MAJOR_INTERVALS.indexOf((interval - 1 + 12) % 12);
    if (sharpIdx >= 0) degreeIdx = sharpIdx;
    else if (flatIdx >= 0) degreeIdx = flatIdx;
    else return chord;
  }

  return ORDINAL_LABELS[degreeIdx] + suffix;
}

export type DisplayMode = 'cifra' | 'grau' | 'ordinal';

/**
 * Parse a line like "[Am]Hello [G]world" into segments
 */
export interface CifraSegment {
  chord: string | null;
  text: string;
}

export function parseCifraLine(line: string): CifraSegment[] {
  const segments: CifraSegment[] = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    // Text before this chord (if any, and no chord)
    if (match.index > lastIndex) {
      const textBefore = line.slice(lastIndex, match.index);
      if (segments.length > 0) {
        // Append to previous segment's text
        segments[segments.length - 1].text += textBefore;
      } else {
        segments.push({ chord: null, text: textBefore });
      }
    }
    segments.push({ chord: match[1], text: '' });
    lastIndex = regex.lastIndex;
  }

  // Remaining text
  const remaining = line.slice(lastIndex);
  if (remaining) {
    if (segments.length > 0) {
      segments[segments.length - 1].text += remaining;
    } else {
      segments.push({ chord: null, text: remaining });
    }
  }

  return segments;
}

export function hasChords(line: string): boolean {
  return /\[[^\]]+\]/.test(line);
}
