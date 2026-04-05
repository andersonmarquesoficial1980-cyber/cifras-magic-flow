import { ReactNode, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getChordDiagrams } from '@/lib/chordDiagrams';
import { ChordDiagramSVG } from '@/components/ChordDiagramSVG';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  chordName: string;
  children: ReactNode;
}

export function ChordPopover({ chordName, children }: Props) {
  const diagrams = getChordDiagrams(chordName);
  const [idx, setIdx] = useState(0);

  if (diagrams.length === 0) {
    return <>{children}</>;
  }

  const current = diagrams[idx % diagrams.length];
  const hasMultiple = diagrams.length > 1;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3 border-border"
        side="top"
        sideOffset={8}
        style={{ background: '#1E1E2E', borderColor: '#334155' }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-mono font-bold" style={{ color: '#FACC15' }}>
            {chordName}
          </span>
          <ChordDiagramSVG diagram={current} />
          {current.label && (
            <span className="text-[10px] font-mono" style={{ color: '#94A3B8' }}>
              {current.label}
            </span>
          )}
          {hasMultiple && (
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setIdx((p) => (p - 1 + diagrams.length) % diagrams.length); }}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Variação anterior"
              >
                <ChevronLeft size={16} color="#FACC15" />
              </button>
              <span className="text-[10px] font-mono" style={{ color: '#94A3B8' }}>
                {(idx % diagrams.length) + 1}/{diagrams.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setIdx((p) => (p + 1) % diagrams.length); }}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Próxima variação"
              >
                <ChevronRight size={16} color="#FACC15" />
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
