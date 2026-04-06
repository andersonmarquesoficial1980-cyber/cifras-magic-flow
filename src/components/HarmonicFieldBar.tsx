import { transposeChord, ALL_KEYS } from '@/lib/transpose';

const MAJOR_QUALITIES = ['', 'm', 'm', '', '', 'm', 'dim'];
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const DEGREE_LABELS = ['1º', '2º', '3º', '4º', '5º', '6º', '7º'];

interface Props {
  keyName: string;
  transposeSemitones: number;
}

export function HarmonicFieldBar({ keyName, transposeSemitones }: Props) {
  // Extract root note from key (e.g., "Am" → "A")
  const keyMatch = keyName.match(/^([A-G][#b]?)/);
  if (!keyMatch) return null;

  const rootNote = transposeChord(keyMatch[1], transposeSemitones);

  // Build harmonic field of the major key based on rootNote
  const field = MAJOR_INTERVALS.map((interval, i) => {
    const note = transposeChord(rootNote, interval);
    const quality = MAJOR_QUALITIES[i];
    return {
      chord: note + quality,
      degree: DEGREE_LABELS[i],
      quality,
    };
  });

  return (
    <div className="sticky top-[57px] z-10 border-b border-border bg-background" style={{ backgroundColor: '#050505' }}>
      <div className="container mx-auto max-w-3xl px-4 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {field.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center rounded-lg bg-background/50 border border-border px-2.5 py-1.5 min-w-[52px] shrink-0"
            >
              <span className="text-xs font-mono font-bold text-chord">{item.chord}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{item.degree}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
