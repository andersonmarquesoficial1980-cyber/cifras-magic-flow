import { ReactNode } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getChordDiagram } from '@/lib/chordDiagrams';
import { ChordDiagramSVG } from '@/components/ChordDiagramSVG';

interface Props {
  chordName: string;
  children: ReactNode;
}

export function ChordPopover({ chordName, children }: Props) {
  const diagram = getChordDiagram(chordName);

  if (!diagram) {
    return <>{children}</>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 bg-card border-border" side="top" sideOffset={8}>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-mono font-bold text-chord">{chordName}</span>
          <ChordDiagramSVG diagram={diagram} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
