import type { ChordDiagram } from '@/lib/chordDiagrams';

interface Props {
  diagram: ChordDiagram;
}

export function ChordDiagramSVG({ diagram }: Props) {
  const { frets, baseFret, barres = [] } = diagram;
  const numFrets = 4;
  const numStrings = 6;
  const stringSpacing = 16;
  const fretSpacing = 18;
  const padLeft = 22;
  const padTop = 20;
  const w = padLeft + (numStrings - 1) * stringSpacing + 14;
  const h = padTop + numFrets * fretSpacing + 10;
  const dotR = 5;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      {/* Nut or fret indicator */}
      {baseFret === 1 ? (
        <rect x={padLeft - 1} y={padTop - 3} width={(numStrings - 1) * stringSpacing + 2} height={4} rx={1} fill="hsl(var(--foreground))" />
      ) : (
        <text x={padLeft - 14} y={padTop + fretSpacing / 2 + 4} fontSize={10} fill="hsl(var(--muted-foreground))" fontFamily="monospace">
          {baseFret}
        </text>
      )}

      {/* Frets (horizontal lines) */}
      {Array.from({ length: numFrets + 1 }).map((_, i) => (
        <line
          key={`f${i}`}
          x1={padLeft}
          y1={padTop + i * fretSpacing}
          x2={padLeft + (numStrings - 1) * stringSpacing}
          y2={padTop + i * fretSpacing}
          stroke="hsl(var(--border))"
          strokeWidth={1}
        />
      ))}

      {/* Strings (vertical lines) */}
      {Array.from({ length: numStrings }).map((_, i) => (
        <line
          key={`s${i}`}
          x1={padLeft + i * stringSpacing}
          y1={padTop}
          x2={padLeft + i * stringSpacing}
          y2={padTop + numFrets * fretSpacing}
          stroke="hsl(var(--border))"
          strokeWidth={1}
        />
      ))}

      {/* Barres */}
      {barres.map((barre) => {
        const stringsInBarre = frets.reduce<number[]>((acc, f, i) => {
          if (f >= barre) acc.push(i);
          return acc;
        }, []);
        if (stringsInBarre.length < 2) return null;
        const first = stringsInBarre[0];
        const last = stringsInBarre[stringsInBarre.length - 1];
        const fretY = padTop + (barre - baseFret + 0.5) * fretSpacing;
        return (
          <rect
            key={`barre-${barre}`}
            x={padLeft + first * stringSpacing - dotR}
            y={fretY - dotR}
            width={(last - first) * stringSpacing + dotR * 2}
            height={dotR * 2}
            rx={dotR}
            fill="#FACC15"
            opacity={0.7}
          />
        );
      })}

      {/* Dots & open/mute markers */}
      {frets.map((fret, i) => {
        const x = padLeft + i * stringSpacing;
        if (fret === -1) {
          return (
            <text key={i} x={x} y={padTop - 7} fontSize={10} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontFamily="monospace">
              ×
            </text>
          );
        }
        if (fret === 0) {
          return (
            <circle key={i} cx={x} cy={padTop - 8} r={3.5} fill="none" stroke="hsl(var(--foreground))" strokeWidth={1.5} />
          );
        }
        // If part of a barre, skip individual dot
        if (barres.includes(fret)) return null;
        const y = padTop + (fret - baseFret + 0.5) * fretSpacing;
        return (
          <circle key={i} cx={x} cy={y} r={dotR} fill="#FACC15" />
        );
      })}
    </svg>
  );
}
