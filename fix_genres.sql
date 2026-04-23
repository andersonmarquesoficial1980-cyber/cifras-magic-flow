UPDATE public.musicas SET genero = 'Rock' WHERE artista ILIKE '%skank%' OR artista ILIKE '%legião urbana%';
UPDATE public.musicas SET genero = 'Gospel' WHERE artista ILIKE '%renascer praise%' OR artista ILIKE '%aline barros%' OR artista ILIKE '%diante do trono%';
UPDATE public.musicas SET genero = 'Sertanejo' WHERE genero IS NULL OR genero = 'null' OR genero = 'Sem Gênero';
