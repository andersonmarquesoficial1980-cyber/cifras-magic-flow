import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface DuplicateConfirmDialogProps {
  open: boolean;
  songTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DuplicateConfirmDialog({ open, songTitle, onConfirm, onCancel }: DuplicateConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <AlertDialogContent className="bg-[hsl(var(--card))] border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Música Duplicada
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            A música <strong className="text-foreground">"{songTitle}"</strong> já existe no seu catálogo.
            Deseja importar novamente e criar uma cópia?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} className="border-border text-muted-foreground">
            Não, cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-orange-500 hover:bg-orange-600 text-white">
            Sim, criar cópia
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
