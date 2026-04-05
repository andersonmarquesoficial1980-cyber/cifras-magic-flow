// Professional guitar chord diagram data with finger numbers and multiple variations
// Format: frets [E,A,D,G,B,e] -1=muted, 0=open, 1+=fret (absolute)
// fingers [E,A,D,G,B,e] 0=none, 1=index, 2=middle, 3=ring, 4=pinky
// baseFret = first fret shown in the 4-fret window

export interface ChordDiagram {
  name: string;
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres?: number[];
  label?: string;
}

const DB: Record<string, ChordDiagram[]> = {
  // ─── MAIORES ───────────────────────────────────────────
  'C': [
    { name:'C', frets:[-1,3,2,0,1,0], fingers:[0,3,2,0,1,0], baseFret:1, label:'Aberto' },
    { name:'C', frets:[3,3,5,5,5,3], fingers:[1,1,2,3,4,1], baseFret:3, barres:[3], label:'Pestana 3ª' },
  ],
  'D': [
    { name:'D', frets:[-1,-1,0,2,3,2], fingers:[0,0,0,1,3,2], baseFret:1, label:'Aberto' },
    { name:'D', frets:[-1,5,7,7,7,5], fingers:[0,1,3,4,2,1], baseFret:5, barres:[5], label:'Pestana 5ª' },
  ],
  'E': [
    { name:'E', frets:[0,2,2,1,0,0], fingers:[0,2,3,1,0,0], baseFret:1, label:'Aberto' },
  ],
  'F': [
    { name:'F', frets:[1,3,3,2,1,1], fingers:[1,3,4,2,1,1], baseFret:1, barres:[1], label:'Pestana 1ª' },
    { name:'F', frets:[-1,-1,3,2,1,1], fingers:[0,0,3,2,1,1], baseFret:1, label:'Simplificado' },
    { name:'F', frets:[-1,3,3,2,1,1], fingers:[0,3,4,2,1,1], baseFret:1, barres:[1], label:'Sem 6ª corda' },
  ],
  'G': [
    { name:'G', frets:[3,2,0,0,0,3], fingers:[2,1,0,0,0,3], baseFret:1, label:'Aberto' },
    { name:'G', frets:[3,2,0,0,3,3], fingers:[2,1,0,0,3,4], baseFret:1, label:'Aberto v2' },
    { name:'G', frets:[3,5,5,4,3,3], fingers:[1,3,4,2,1,1], baseFret:3, barres:[3], label:'Pestana 3ª' },
  ],
  'A': [
    { name:'A', frets:[-1,0,2,2,2,0], fingers:[0,0,1,2,3,0], baseFret:1, label:'Aberto' },
    { name:'A', frets:[5,7,7,6,5,5], fingers:[1,3,4,2,1,1], baseFret:5, barres:[5], label:'Pestana 5ª' },
  ],
  'B': [
    { name:'B', frets:[-1,2,4,4,4,2], fingers:[0,1,3,4,2,1], baseFret:2, barres:[2], label:'Pestana 2ª' },
    { name:'B', frets:[7,9,9,8,7,7], fingers:[1,3,4,2,1,1], baseFret:7, barres:[7], label:'Pestana 7ª' },
  ],

  // ─── MENORES ───────────────────────────────────────────
  'Am': [
    { name:'Am', frets:[-1,0,2,2,1,0], fingers:[0,0,2,3,1,0], baseFret:1, label:'Aberto' },
    { name:'Am', frets:[5,7,7,5,5,5], fingers:[1,3,4,1,1,1], baseFret:5, barres:[5], label:'Pestana 5ª' },
  ],
  'Bm': [
    { name:'Bm', frets:[-1,2,4,4,3,2], fingers:[0,1,3,4,2,1], baseFret:2, barres:[2], label:'Pestana 2ª' },
    { name:'Bm', frets:[7,9,9,7,7,7], fingers:[1,3,4,1,1,1], baseFret:7, barres:[7], label:'Pestana 7ª' },
  ],
  'Cm': [
    { name:'Cm', frets:[-1,3,5,5,4,3], fingers:[0,1,3,4,2,1], baseFret:3, barres:[3], label:'Pestana 3ª' },
    { name:'Cm', frets:[8,10,10,8,8,8], fingers:[1,3,4,1,1,1], baseFret:8, barres:[8], label:'Pestana 8ª' },
  ],
  'Dm': [
    { name:'Dm', frets:[-1,-1,0,2,3,1], fingers:[0,0,0,2,3,1], baseFret:1, label:'Aberto' },
    { name:'Dm', frets:[-1,5,7,7,6,5], fingers:[0,1,3,4,2,1], baseFret:5, barres:[5], label:'Pestana 5ª' },
  ],
  'Em': [
    { name:'Em', frets:[0,2,2,0,0,0], fingers:[0,2,3,0,0,0], baseFret:1, label:'Aberto' },
    { name:'Em', frets:[0,2,2,0,0,0], fingers:[0,1,2,0,0,0], baseFret:1, label:'Aberto v2' },
  ],
  'Fm': [
    { name:'Fm', frets:[1,3,3,1,1,1], fingers:[1,3,4,1,1,1], baseFret:1, barres:[1], label:'Pestana 1ª' },
  ],
  'Gm': [
    { name:'Gm', frets:[3,5,5,3,3,3], fingers:[1,3,4,1,1,1], baseFret:3, barres:[3], label:'Pestana 3ª' },
  ],

  // ─── SÉTIMA (7) ────────────────────────────────────────
  'C7': [
    { name:'C7', frets:[-1,3,2,3,1,0], fingers:[0,3,2,4,1,0], baseFret:1, label:'Aberto' },
  ],
  'D7': [
    { name:'D7', frets:[-1,-1,0,2,1,2], fingers:[0,0,0,2,1,3], baseFret:1, label:'Aberto' },
  ],
  'E7': [
    { name:'E7', frets:[0,2,0,1,0,0], fingers:[0,2,0,1,0,0], baseFret:1, label:'Aberto' },
    { name:'E7', frets:[0,2,2,1,3,0], fingers:[0,1,2,3,4,0], baseFret:1, label:'Variação' },
  ],
  'F7': [
    { name:'F7', frets:[1,3,1,2,1,1], fingers:[1,3,1,2,1,1], baseFret:1, barres:[1], label:'Pestana' },
  ],
  'G7': [
    { name:'G7', frets:[3,2,0,0,0,1], fingers:[3,2,0,0,0,1], baseFret:1, label:'Aberto' },
    { name:'G7', frets:[3,5,3,4,3,3], fingers:[1,3,1,2,1,1], baseFret:3, barres:[3], label:'Pestana' },
  ],
  'A7': [
    { name:'A7', frets:[-1,0,2,0,2,0], fingers:[0,0,1,0,3,0], baseFret:1, label:'Aberto' },
  ],
  'B7': [
    { name:'B7', frets:[-1,2,1,2,0,2], fingers:[0,2,1,3,0,4], baseFret:1, label:'Aberto' },
  ],

  // ─── MENOR COM 7 (m7) ─────────────────────────────────
  'Am7': [
    { name:'Am7', frets:[-1,0,2,0,1,0], fingers:[0,0,2,0,1,0], baseFret:1, label:'Aberto' },
  ],
  'Dm7': [
    { name:'Dm7', frets:[-1,-1,0,2,1,1], fingers:[0,0,0,2,1,1], baseFret:1, label:'Aberto' },
  ],
  'Em7': [
    { name:'Em7', frets:[0,2,0,0,0,0], fingers:[0,1,0,0,0,0], baseFret:1, label:'Aberto' },
    { name:'Em7', frets:[0,2,2,0,3,0], fingers:[0,1,2,0,3,0], baseFret:1, label:'Variação' },
  ],
  'Bm7': [
    { name:'Bm7', frets:[-1,2,4,2,3,2], fingers:[0,1,3,1,2,1], baseFret:2, barres:[2], label:'Pestana' },
  ],
  'F#m7': [
    { name:'F#m7', frets:[2,4,2,2,2,2], fingers:[1,3,1,1,1,1], baseFret:2, barres:[2], label:'Pestana' },
  ],
  'C#m7': [
    { name:'C#m7', frets:[-1,4,6,4,5,4], fingers:[0,1,3,1,2,1], baseFret:4, barres:[4], label:'Pestana' },
  ],
  'Gm7': [
    { name:'Gm7', frets:[3,5,3,3,3,3], fingers:[1,3,1,1,1,1], baseFret:3, barres:[3], label:'Pestana' },
  ],

  // ─── SÉTIMA MAIOR (7M / maj7) ─────────────────────────
  'C7M': [
    { name:'C7M', frets:[-1,3,2,0,0,0], fingers:[0,3,2,0,0,0], baseFret:1, label:'Aberto' },
  ],
  'D7M': [
    { name:'D7M', frets:[-1,-1,0,2,2,2], fingers:[0,0,0,1,2,3], baseFret:1, label:'Aberto' },
  ],
  'F7M': [
    { name:'F7M', frets:[-1,-1,3,2,1,0], fingers:[0,0,3,2,1,0], baseFret:1, label:'Simplificado' },
    { name:'F7M', frets:[1,3,3,2,1,0], fingers:[1,3,4,2,1,0], baseFret:1, barres:[1], label:'Pestana' },
  ],
  'G7M': [
    { name:'G7M', frets:[3,2,0,0,0,2], fingers:[2,1,0,0,0,3], baseFret:1, label:'Aberto' },
  ],
  'A7M': [
    { name:'A7M', frets:[-1,0,2,1,2,0], fingers:[0,0,2,1,3,0], baseFret:1, label:'Aberto' },
  ],
  'E7M': [
    { name:'E7M', frets:[0,2,1,1,0,0], fingers:[0,3,1,2,0,0], baseFret:1, label:'Aberto' },
  ],
  'B7M': [
    { name:'B7M', frets:[-1,2,4,3,4,2], fingers:[0,1,3,2,4,1], baseFret:2, barres:[2], label:'Pestana' },
  ],
  'Bb7M': [
    { name:'Bb7M', frets:[-1,1,3,2,3,1], fingers:[0,1,3,2,4,1], baseFret:1, barres:[1], label:'Pestana' },
  ],

  // Aliases
  'Cmaj7': [
    { name:'Cmaj7', frets:[-1,3,2,0,0,0], fingers:[0,3,2,0,0,0], baseFret:1, label:'Aberto' },
  ],
  'Fmaj7': [
    { name:'Fmaj7', frets:[-1,-1,3,2,1,0], fingers:[0,0,3,2,1,0], baseFret:1, label:'Simplificado' },
  ],
  'Gmaj7': [
    { name:'Gmaj7', frets:[3,2,0,0,0,2], fingers:[2,1,0,0,0,3], baseFret:1, label:'Aberto' },
  ],

  // ─── SUS ───────────────────────────────────────────────
  'Dsus4': [
    { name:'Dsus4', frets:[-1,-1,0,2,3,3], fingers:[0,0,0,1,2,3], baseFret:1, label:'Aberto' },
  ],
  'Asus4': [
    { name:'Asus4', frets:[-1,0,2,2,3,0], fingers:[0,0,1,2,3,0], baseFret:1, label:'Aberto' },
  ],
  'Esus4': [
    { name:'Esus4', frets:[0,2,2,2,0,0], fingers:[0,2,3,4,0,0], baseFret:1, label:'Aberto' },
  ],
  'Dsus2': [
    { name:'Dsus2', frets:[-1,-1,0,2,3,0], fingers:[0,0,0,1,3,0], baseFret:1, label:'Aberto' },
  ],
  'Asus2': [
    { name:'Asus2', frets:[-1,0,2,2,0,0], fingers:[0,0,1,2,0,0], baseFret:1, label:'Aberto' },
  ],

  // ─── SUSTENIDOS / BEMÓIS ──────────────────────────────
  'C#': [
    { name:'C#', frets:[-1,4,6,6,6,4], fingers:[0,1,3,3,3,1], baseFret:4, barres:[4], label:'Pestana 4ª' },
  ],
  'Db': [
    { name:'Db', frets:[-1,4,6,6,6,4], fingers:[0,1,3,3,3,1], baseFret:4, barres:[4], label:'Pestana 4ª' },
  ],
  'D#': [
    { name:'D#', frets:[-1,-1,1,3,4,3], fingers:[0,0,1,2,4,3], baseFret:1, label:'Parcial' },
  ],
  'Eb': [
    { name:'Eb', frets:[-1,-1,1,3,4,3], fingers:[0,0,1,2,4,3], baseFret:1, label:'Parcial' },
    { name:'Eb', frets:[-1,6,8,8,8,6], fingers:[0,1,3,3,3,1], baseFret:6, barres:[6], label:'Pestana 6ª' },
  ],
  'F#': [
    { name:'F#', frets:[2,4,4,3,2,2], fingers:[1,3,4,2,1,1], baseFret:2, barres:[2], label:'Pestana 2ª' },
  ],
  'Gb': [
    { name:'Gb', frets:[2,4,4,3,2,2], fingers:[1,3,4,2,1,1], baseFret:2, barres:[2], label:'Pestana 2ª' },
  ],
  'G#': [
    { name:'G#', frets:[4,6,6,5,4,4], fingers:[1,3,4,2,1,1], baseFret:4, barres:[4], label:'Pestana 4ª' },
  ],
  'Ab': [
    { name:'Ab', frets:[4,6,6,5,4,4], fingers:[1,3,4,2,1,1], baseFret:4, barres:[4], label:'Pestana 4ª' },
  ],
  'A#': [
    { name:'A#', frets:[-1,1,3,3,3,1], fingers:[0,1,2,3,4,1], baseFret:1, barres:[1], label:'Pestana 1ª' },
  ],
  'Bb': [
    { name:'Bb', frets:[-1,1,3,3,3,1], fingers:[0,1,2,3,4,1], baseFret:1, barres:[1], label:'Pestana 1ª' },
    { name:'Bb', frets:[6,8,8,7,6,6], fingers:[1,3,4,2,1,1], baseFret:6, barres:[6], label:'Pestana 6ª' },
  ],

  // ─── MENORES COM # / b ────────────────────────────────
  'C#m': [
    { name:'C#m', frets:[-1,4,6,6,5,4], fingers:[0,1,3,4,2,1], baseFret:4, barres:[4], label:'Pestana 4ª' },
  ],
  'F#m': [
    { name:'F#m', frets:[2,4,4,2,2,2], fingers:[1,3,4,1,1,1], baseFret:2, barres:[2], label:'Pestana 2ª' },
  ],
  'G#m': [
    { name:'G#m', frets:[4,6,6,4,4,4], fingers:[1,3,4,1,1,1], baseFret:4, barres:[4], label:'Pestana 4ª' },
  ],
  'Bbm': [
    { name:'Bbm', frets:[-1,1,3,3,2,1], fingers:[0,1,3,4,2,1], baseFret:1, barres:[1], label:'Pestana 1ª' },
  ],
  'Ebm': [
    { name:'Ebm', frets:[-1,6,8,8,7,6], fingers:[0,1,3,4,2,1], baseFret:6, barres:[6], label:'Pestana 6ª' },
  ],

  // ─── DIMINUTOS ─────────────────────────────────────────
  'Ddim': [
    { name:'Ddim', frets:[-1,-1,0,1,3,1], fingers:[0,0,0,1,3,2], baseFret:1, label:'Aberto' },
  ],
  'Bdim': [
    { name:'Bdim', frets:[-1,2,3,4,3,-1], fingers:[0,1,2,4,3,0], baseFret:1, label:'Parcial' },
  ],
  'F#dim': [
    { name:'F#dim', frets:[2,3,4,2,-1,-1], fingers:[1,2,3,1,0,0], baseFret:1, label:'Parcial' },
  ],

  // ─── NONA (9) ──────────────────────────────────────────
  'G9': [
    { name:'G9', frets:[3,2,0,2,0,1], fingers:[3,2,0,4,0,1], baseFret:1, label:'Aberto' },
  ],
  'A9': [
    { name:'A9', frets:[-1,0,2,4,2,3], fingers:[0,0,1,3,1,2], baseFret:1, label:'Aberto' },
  ],
  'D9': [
    { name:'D9', frets:[-1,-1,0,2,1,0], fingers:[0,0,0,2,1,0], baseFret:1, label:'Aberto' },
  ],

  // ─── INVERSÕES POPULARES ──────────────────────────────
  'D/F#': [
    { name:'D/F#', frets:[2,0,0,2,3,2], fingers:[1,0,0,2,4,3], baseFret:1, label:'Dedo 1 na 6ª' },
    { name:'D/F#', frets:[-1,-1,4,2,3,2], fingers:[0,0,4,1,3,2], baseFret:1, label:'Sem baixas' },
  ],
  'G/B': [
    { name:'G/B', frets:[-1,2,0,0,0,3], fingers:[0,1,0,0,0,3], baseFret:1, label:'Aberto' },
    { name:'G/B', frets:[-1,2,0,0,3,3], fingers:[0,1,0,0,3,4], baseFret:1, label:'Variação' },
  ],
  'C/E': [
    { name:'C/E', frets:[0,3,2,0,1,0], fingers:[0,3,2,0,1,0], baseFret:1, label:'Aberto' },
  ],
  'C/G': [
    { name:'C/G', frets:[3,3,2,0,1,0], fingers:[3,4,2,0,1,0], baseFret:1, label:'Aberto' },
  ],
  'Am/G': [
    { name:'Am/G', frets:[3,0,2,2,1,0], fingers:[4,0,3,2,1,0], baseFret:1, label:'Aberto' },
  ],
  'Am/E': [
    { name:'Am/E', frets:[0,0,2,2,1,0], fingers:[0,0,2,3,1,0], baseFret:1, label:'Aberto' },
  ],
  'Em/D': [
    { name:'Em/D', frets:[-1,-1,0,0,0,0], fingers:[0,0,0,0,0,0], baseFret:1, label:'Super simples' },
  ],
  'F/C': [
    { name:'F/C', frets:[-1,3,3,2,1,1], fingers:[0,3,4,2,1,1], baseFret:1, barres:[1], label:'Pestana' },
  ],
  'A/C#': [
    { name:'A/C#', frets:[-1,4,2,2,2,0], fingers:[0,4,1,2,3,0], baseFret:1, label:'Aberto' },
  ],
  'D/A': [
    { name:'D/A', frets:[-1,0,0,2,3,2], fingers:[0,0,0,1,3,2], baseFret:1, label:'Aberto' },
  ],

  // ─── POWER CHORDS (5) ─────────────────────────────────
  'E5': [
    { name:'E5', frets:[0,2,2,-1,-1,-1], fingers:[0,1,2,0,0,0], baseFret:1, label:'Aberto' },
  ],
  'F5': [
    { name:'F5', frets:[1,3,3,-1,-1,-1], fingers:[1,3,4,0,0,0], baseFret:1, label:'1ª casa' },
  ],
  'F#5': [
    { name:'F#5', frets:[2,4,4,-1,-1,-1], fingers:[1,3,4,0,0,0], baseFret:2, label:'2ª casa' },
  ],
  'G5': [
    { name:'G5', frets:[3,5,5,-1,-1,-1], fingers:[1,3,4,0,0,0], baseFret:3, label:'3ª casa' },
  ],
  'G#5': [
    { name:'G#5', frets:[4,6,6,-1,-1,-1], fingers:[1,3,4,0,0,0], baseFret:4, label:'4ª casa' },
  ],
  'Ab5': [
    { name:'Ab5', frets:[4,6,6,-1,-1,-1], fingers:[1,3,4,0,0,0], baseFret:4, label:'4ª casa' },
  ],
  'A5': [
    { name:'A5', frets:[-1,0,2,2,-1,-1], fingers:[0,0,1,2,0,0], baseFret:1, label:'Aberto' },
    { name:'A5', frets:[5,7,7,-1,-1,-1], fingers:[1,3,4,0,0,0], baseFret:5, label:'5ª casa' },
  ],
  'Bb5': [
    { name:'Bb5', frets:[-1,1,3,3,-1,-1], fingers:[0,1,3,4,0,0], baseFret:1, label:'1ª casa' },
  ],
  'B5': [
    { name:'B5', frets:[-1,2,4,4,-1,-1], fingers:[0,1,3,4,0,0], baseFret:2, label:'2ª casa' },
  ],
  'C5': [
    { name:'C5', frets:[-1,3,5,5,-1,-1], fingers:[0,1,3,4,0,0], baseFret:3, label:'3ª casa' },
  ],
  'D5': [
    { name:'D5', frets:[-1,-1,0,2,3,-1], fingers:[0,0,0,1,2,0], baseFret:1, label:'Aberto' },
    { name:'D5', frets:[-1,5,7,7,-1,-1], fingers:[0,1,3,4,0,0], baseFret:5, label:'5ª casa' },
  ],
  'D#5': [
    { name:'D#5', frets:[-1,6,8,8,-1,-1], fingers:[0,1,3,4,0,0], baseFret:6, label:'6ª casa' },
  ],
  'Eb5': [
    { name:'Eb5', frets:[-1,6,8,8,-1,-1], fingers:[0,1,3,4,0,0], baseFret:6, label:'6ª casa' },
  ],

  // ─── OUTROS ────────────────────────────────────────────
  'Cadd9': [
    { name:'Cadd9', frets:[-1,3,2,0,3,0], fingers:[0,2,1,0,3,0], baseFret:1, label:'Aberto' },
  ],
  'Gadd9': [
    { name:'Gadd9', frets:[3,2,0,2,0,3], fingers:[2,1,0,3,0,4], baseFret:1, label:'Aberto' },
  ],
  'Dadd9': [
    { name:'Dadd9', frets:[-1,-1,0,2,3,0], fingers:[0,0,0,1,3,0], baseFret:1, label:'Aberto' },
  ],
  'A6': [
    { name:'A6', frets:[-1,0,2,2,2,2], fingers:[0,0,1,1,1,1], baseFret:1, barres:[2], label:'Aberto' },
  ],
};

/**
 * Find chord diagrams with progressive fallback:
 * 1. Exact match (e.g. "D9(11)")
 * 2. Without bass note (e.g. "D9(11)" from "D9(11)/F#")
 * 3. Strip parenthesized extensions (e.g. "D9" from "D9(11)")
 * 4. Strip numeric extension (e.g. "D" from "D9")
 * 5. Root + quality only (e.g. "Dm" from "Dm7(b5)")
 * Returns { diagrams, simplified } where simplified=true means fallback was used.
 */
export function getChordDiagramsWithFallback(chordName: string): { diagrams: ChordDiagram[]; simplified: boolean } {
  const full = chordName.trim();
  const baseChord = full.split('/')[0];

  // 1. Exact match
  if (DB[full]) return { diagrams: DB[full], simplified: false };
  // 2. Without bass
  if (DB[baseChord]) return { diagrams: DB[baseChord], simplified: full !== baseChord };

  // 3. Strip parenthesized parts  e.g. "D9(11)" → "D9"
  const noParens = baseChord.replace(/\([^)]*\)/g, '');
  if (noParens !== baseChord && DB[noParens]) return { diagrams: DB[noParens], simplified: true };

  // 4. Strip trailing numbers  e.g. "D9" → "D", "Em7" → "Em"
  const noNum = noParens.replace(/\d+$/, '');
  if (noNum !== noParens && DB[noNum]) return { diagrams: DB[noNum], simplified: true };

  // 5. Root + m only  e.g. "Dm" from "Dmadd9"
  const rootMatch = baseChord.match(/^([A-G][#b]?)(m)?/);
  if (rootMatch) {
    const rootKey = rootMatch[1] + (rootMatch[2] || '');
    if (rootKey !== noNum && DB[rootKey]) return { diagrams: DB[rootKey], simplified: true };
  }

  return { diagrams: [], simplified: false };
}

export function getChordDiagrams(chordName: string): ChordDiagram[] {
  return getChordDiagramsWithFallback(chordName).diagrams;
}

export function getChordDiagram(chordName: string): ChordDiagram | null {
  const list = getChordDiagrams(chordName);
  return list.length > 0 ? list[0] : null;
}
