const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

function normalizeNote(note: string): number {
  const flatToSharp: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#',
    'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
  };
  const n = flatToSharp[note] || note;
  const idx = NOTES.indexOf(n);
  return idx >= 0 ? idx : -1;
}

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  
  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return chord;
  
  const [, root, suffix] = match;
  const idx = normalizeNote(root);
  if (idx < 0) return chord;
  
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  const useFlats = root.includes('b');
  const newRoot = useFlats ? FLAT_NOTES[newIdx] : NOTES[newIdx];
  
  return newRoot + suffix;
}

export function transposeLine(line: string, semitones: number): string {
  if (semitones === 0) return line;
  return line.replace(/\b([A-G][#b]?(?:m|7|maj7|m7|dim|aug|sus[24]|add9|6|9|11|13|\/[A-G][#b]?)?)\b/g, 
    (match) => {
      const slashIdx = match.indexOf('/');
      if (slashIdx > 0) {
        const main = match.slice(0, slashIdx);
        const bass = match.slice(slashIdx + 1);
        return transposeChord(main, semitones) + '/' + transposeChord(bass, semitones);
      }
      return transposeChord(match, semitones);
    }
  );
}

export function getSemitonesDiff(from: string, to: string): number {
  const fromIdx = normalizeNote(from);
  const toIdx = normalizeNote(to);
  if (fromIdx < 0 || toIdx < 0) return 0;
  return ((toIdx - fromIdx) % 12 + 12) % 12;
}

export const ALL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
