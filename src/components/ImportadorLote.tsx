import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImport } from '@/contexts/ImportContext';

export function ImportadorLote() {
  const { setOpen } = useImport();
  return (
    <Button
      variant="outline"
      className="gap-2 border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
      onClick={() => setOpen(true)}
    >
      <Package className="h-4 w-4" />
      Importador em Lote
    </Button>
  );
}
