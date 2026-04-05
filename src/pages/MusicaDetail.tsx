import { useParams } from 'react-router-dom';
import { useMusica } from '@/hooks/useMusicas';
import { CifraViewer } from '@/components/CifraViewer';

const MusicaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: musica, isLoading } = useMusica(id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!musica) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Música não encontrada.</p>
      </div>
    );
  }

  return <CifraViewer musica={musica} />;
};

export default MusicaDetail;
