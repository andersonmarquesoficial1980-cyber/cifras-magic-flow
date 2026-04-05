import type { ChordDiagram } from '@/lib/chordDiagrams';

interface Props {
  diagram: ChordDiagram;
}

export function ChordDiagramSVG({ diagram }: Props) {
  const { frets, fingers, baseFret, barres = [] } = diagram;
  const numFrets = 4;
  const numStrings = 6;
  const stringSpacing = 18;
  const fretSpacing = 22;
  const padLeft = 28;
  const padTop = 24;
  const w = padLeft + (numStrings - 1) * stringSpacing + 16;
  const h = padTop + numFrets * fretSpacing + 12;
  const dotR = 7;

  const fingerLabel = (f: number) => (f > 0 && f <= 4 ? String(f) : '');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      {/* Background */}
      <rect x={0} y={0} width={w} height={h} rx={6} fill="#1E1E2E" />

      {/* Nut or fret indicator */}
      {baseFret === 1 ? (
        <rect
          x={padLeft - 1}
          y={padTop - 3}
          width={(numStrings - 1) * stringSpacing + 2}
          height={5}
          rx={2}
          fill="#E2E8F0"
        />
      ) : (
        <text
          x={padLeft - 18}
          y={padTop + fretSpacing / 2 + 4}
          fontSize={11}
          fill="#94A3B8"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {baseFret}
        </text>
      )}

      {/* Frets (horizontal) */}
      {Array.from({ length: numFrets + 1 }).map((_, i) => (
        <line
          key={`f${i}`}
          x1={padLeft}
          y1={padTop + i * fretSpacing}
          x2={padLeft + (numStrings - 1) * stringSpacing}
          y2={padTop + i * fretSpacing}
          stroke="#475569"
          strokeWidth={1}
        />
      ))}

      {/* Strings (vertical) */}
      {Array.from({ length: numStrings }).map((_, i) => (
        <line
          key={`s${i}`}
          x1={padLeft + i * stringSpacing}
          y1={padTop}
          x2={padLeft + i * stringSpacing}
          y2={padTop + numFrets * fretSpacing}
          stroke="#64748B"
          strokeWidth={i < 3 ? 1.5 : 1}
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
            opacity={0.85}
          />
        );
      })}

      {/* Dots with finger numbers & markers */}
      {frets.map((fret, i) => {
        const x = padLeft + i * stringSpacing;
        if (fret === -1) {
          return (
            <text
              key={i}
              x={x}
              y={padTop - 8}
              fontSize={13}
              textAnchor="middle"
              fill="#EF4444"
              fontFamily="sans-serif"
              fontWeight="bold"
            >
              ✕
            </text>
          );
        }
        if (fret === 0) {
          return (
            <g key={i}>
              <circle cx={x} cy={padTop - 9} r={5} fill="none" stroke="#E2E8F0" strokeWidth={2} />
              <text x={x} y={padTop - 6} fontSize={7} textAnchor="middle" fill="#E2E8F0" fontWeight="bold">
                O
              </text>
            </g>
          );
        }
        // Skip if part of barre (barre already drawn)
        const isBarre = barres.includes(fret) && fingers[i] === fingers[barres.indexOf(fret) !== -1 ? frets.indexOf(fret) : i];
        const y = padTop + (fret - baseFret + 0.5) * fretSpacing;
        const finger = fingers[i];
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={dotR} fill="#FACC15" />
            {finger > 0 && (
              <text
                x={x}
                y={y + 4}
                fontSize={10}
                textAnchor="middle"
                fill="#1E1E2E"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {fingerLabel(finger)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
