// Guitar chord diagram data: fret positions for common open chords
// Format: [E, A, D, G, B, e] where -1 = muted, 0 = open, 1+ = fret number
// baseFret: starting fret (1 for open chords)

export interface ChordDiagram {
  name: string;
  frets: number[];
  baseFret: number;
  barres?: number[];
}

const DIAGRAMS: Record<string, ChordDiagram> = {
  'C':    { name: 'C',    frets: [-1, 3, 2, 0, 1, 0], baseFret: 1 },
  'D':    { name: 'D',    frets: [-1, -1, 0, 2, 3, 2], baseFret: 1 },
  'E':    { name: 'E',    frets: [0, 2, 2, 1, 0, 0], baseFret: 1 },
  'F':    { name: 'F',    frets: [1, 3, 3, 2, 1, 1], baseFret: 1, barres: [1] },
  'G':    { name: 'G',    frets: [3, 2, 0, 0, 0, 3], baseFret: 1 },
  'A':    { name: 'A',    frets: [-1, 0, 2, 2, 2, 0], baseFret: 1 },
  'B':    { name: 'B',    frets: [-1, 2, 4, 4, 4, 2], baseFret: 1, barres: [2] },

  'Am':   { name: 'Am',   frets: [-1, 0, 2, 2, 1, 0], baseFret: 1 },
  'Bm':   { name: 'Bm',   frets: [-1, 2, 4, 4, 3, 2], baseFret: 1, barres: [2] },
  'Cm':   { name: 'Cm',   frets: [-1, 3, 5, 5, 4, 3], baseFret: 1, barres: [3] },
  'Dm':   { name: 'Dm',   frets: [-1, -1, 0, 2, 3, 1], baseFret: 1 },
  'Em':   { name: 'Em',   frets: [0, 2, 2, 0, 0, 0], baseFret: 1 },
  'Fm':   { name: 'Fm',   frets: [1, 3, 3, 1, 1, 1], baseFret: 1, barres: [1] },
  'Gm':   { name: 'Gm',   frets: [3, 5, 5, 3, 3, 3], baseFret: 1, barres: [3] },

  'C7':   { name: 'C7',   frets: [-1, 3, 2, 3, 1, 0], baseFret: 1 },
  'D7':   { name: 'D7',   frets: [-1, -1, 0, 2, 1, 2], baseFret: 1 },
  'E7':   { name: 'E7',   frets: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  'G7':   { name: 'G7',   frets: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  'A7':   { name: 'A7',   frets: [-1, 0, 2, 0, 2, 0], baseFret: 1 },
  'B7':   { name: 'B7',   frets: [-1, 2, 1, 2, 0, 2], baseFret: 1 },
  'F7':   { name: 'F7',   frets: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [1] },

  'Am7':  { name: 'Am7',  frets: [-1, 0, 2, 0, 1, 0], baseFret: 1 },
  'Dm7':  { name: 'Dm7',  frets: [-1, -1, 0, 2, 1, 1], baseFret: 1 },
  'Em7':  { name: 'Em7',  frets: [0, 2, 0, 0, 0, 0], baseFret: 1 },

  'C7M':  { name: 'C7M',  frets: [-1, 3, 2, 0, 0, 0], baseFret: 1 },
  'F7M':  { name: 'F7M',  frets: [1, 3, 3, 2, 1, 0], baseFret: 1, barres: [1] },
  'G7M':  { name: 'G7M',  frets: [3, 2, 0, 0, 0, 2], baseFret: 1 },
  'D7M':  { name: 'D7M',  frets: [-1, -1, 0, 2, 2, 2], baseFret: 1 },
  'A7M':  { name: 'A7M',  frets: [-1, 0, 2, 1, 2, 0], baseFret: 1 },

  'Cmaj7': { name: 'Cmaj7', frets: [-1, 3, 2, 0, 0, 0], baseFret: 1 },
  'Fmaj7': { name: 'Fmaj7', frets: [1, 3, 3, 2, 1, 0], baseFret: 1, barres: [1] },
  'Gmaj7': { name: 'Gmaj7', frets: [3, 2, 0, 0, 0, 2], baseFret: 1 },

  'Dsus4': { name: 'Dsus4', frets: [-1, -1, 0, 2, 3, 3], baseFret: 1 },
  'Asus4': { name: 'Asus4', frets: [-1, 0, 2, 2, 3, 0], baseFret: 1 },
  'Esus4': { name: 'Esus4', frets: [0, 2, 2, 2, 0, 0], baseFret: 1 },
  'Dsus2': { name: 'Dsus2', frets: [-1, -1, 0, 2, 3, 0], baseFret: 1 },
  'Asus2': { name: 'Asus2', frets: [-1, 0, 2, 2, 0, 0], baseFret: 1 },

  'C#':   { name: 'C#',   frets: [-1, 4, 3, 1, 2, 1], baseFret: 1, barres: [1] },
  'D#':   { name: 'D#',   frets: [-1, -1, 1, 3, 4, 3], baseFret: 1 },
  'F#':   { name: 'F#',   frets: [2, 4, 4, 3, 2, 2], baseFret: 1, barres: [2] },
  'G#':   { name: 'G#',   frets: [4, 3, 1, 1, 1, 4], baseFret: 1, barres: [1] },
  'A#':   { name: 'A#',   frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barres: [1] },
  'Bb':   { name: 'Bb',   frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barres: [1] },
  'Eb':   { name: 'Eb',   frets: [-1, -1, 1, 3, 4, 3], baseFret: 1 },
  'Ab':   { name: 'Ab',   frets: [4, 3, 1, 1, 1, 4], baseFret: 1, barres: [1] },
  'Db':   { name: 'Db',   frets: [-1, 4, 3, 1, 2, 1], baseFret: 1, barres: [1] },
  'Gb':   { name: 'Gb',   frets: [2, 4, 4, 3, 2, 2], baseFret: 1, barres: [2] },

  'C#m':  { name: 'C#m',  frets: [-1, 4, 2, 1, 2, 0], baseFret: 1 },
  'F#m':  { name: 'F#m',  frets: [2, 4, 4, 2, 2, 2], baseFret: 1, barres: [2] },
  'G#m':  { name: 'G#m',  frets: [4, 6, 6, 4, 4, 4], baseFret: 1, barres: [4] },
  'Bbm':  { name: 'Bbm',  frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, barres: [1] },
  'Ebm':  { name: 'Ebm',  frets: [-1, -1, 1, 3, 4, 2], baseFret: 1 },

  'Ddim': { name: 'Ddim', frets: [-1, -1, 0, 1, 3, 1], baseFret: 1 },
  'Bdim': { name: 'Bdim', frets: [-1, 2, 3, 4, 3, -1], baseFret: 1 },
  'F#dim':{ name: 'F#dim',frets: [2, 3, 4, 2, -1, -1], baseFret: 1 },

  'G9':   { name: 'G9',   frets: [3, 2, 0, 2, 0, 1], baseFret: 1 },
  'A9':   { name: 'A9',   frets: [-1, 0, 2, 4, 2, 3], baseFret: 1 },
  'D9':   { name: 'D9',   frets: [-1, -1, 0, 2, 1, 0], baseFret: 1 },
};

// Alias common enharmonic names
const ALIASES: Record<string, string> = {
  'Cmaj7': 'C7M', 'Fmaj7': 'F7M', 'Gmaj7': 'G7M',
};

export function getChordDiagram(chordName: string): ChordDiagram | null {
  // Strip slash (bass note) for lookup
  const baseChord = chordName.split('/')[0];
  if (DIAGRAMS[baseChord]) return DIAGRAMS[baseChord];
  if (ALIASES[baseChord] && DIAGRAMS[ALIASES[baseChord]]) return DIAGRAMS[ALIASES[baseChord]];
  return null;
}
