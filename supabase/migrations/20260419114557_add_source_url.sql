ALTER TABLE musicas ADD COLUMN IF NOT EXISTS source_url TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS musicas_source_url_unique ON musicas(source_url) WHERE source_url IS NOT NULL;
