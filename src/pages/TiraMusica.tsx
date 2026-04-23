import { useEffect, useMemo, useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from '@react-oauth/google';
import { ArrowLeft, Music, RefreshCw, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isChordLine, isMixedSectionChordLine, splitSectionAndChords, tokenizeChordLine } from '@/lib/chordDetector';

const GOOGLE_CLIENT_ID = '28617268686-e37mn9bm1583j0rcmmf3gl1peg4ue7c0.apps.googleusercontent.com';
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSy...';
const YOUTUBE_EMBED_START_SECONDS = 30;

const FALLBACK_WRONG_CHORDS = [
  'C', 'Cm', 'D', 'Dm', 'E', 'Em', 'F', 'Fm', 'G', 'G7', 'A', 'Am', 'B', 'Bm', 'D7', 'A7', 'F#m', 'Bb',
];

type MusicaRow = {
  id: string;
  titulo: string;
  artista: string | null;
  genero: string | null;
  letra_cifrada: string;
  source_url: string | null;
};

type ParsedLine = {
  raw: string;
  section: string | null;
  tokens: ReturnType<typeof tokenizeChordLine> | null;
};

type MaskedChallenge = {
  cifraComOculto: string;
  ocultos: Array<{
    id: string;
    acordeCorreto: string;
    opcoes: string[];
  }>;
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function parseLines(cifra: string): ParsedLine[] {
  return cifra.split('\n').map((line) => {
    if (isMixedSectionChordLine(line)) {
      const { section, chords } = splitSectionAndChords(line);
      return { raw: line, section, tokens: tokenizeChordLine(chords) };
    }

    if (isChordLine(line)) {
      return { raw: line, section: null, tokens: tokenizeChordLine(line) };
    }

    return { raw: line, section: null, tokens: null };
  });
}

function buildMaskedChallenge(cifra: string, count: number): MaskedChallenge | null {
  const parsedLines = parseLines(cifra);
  const candidates: Array<{ lineIndex: number; tokenIndex: number; chord: string }> = [];

  parsedLines.forEach((line, lineIndex) => {
    if (!line.tokens) return;
    line.tokens.forEach((token, tokenIndex) => {
      if (token.type === 'chord') {
        candidates.push({ lineIndex, tokenIndex, chord: token.value });
      }
    });
  });

  if (!candidates.length) {
    return null;
  }

  const effectiveCount = Math.max(1, Math.min(count, candidates.length));
  const selectedCandidates = shuffle(candidates).slice(0, effectiveCount);
  const selectedPositions = new Set(selectedCandidates.map((item) => `${item.lineIndex}-${item.tokenIndex}`));
  const uniqueChords = Array.from(new Set(candidates.map((c) => c.chord)));
  const ocultos = selectedCandidates.map((selected, index) => {
    const wrongChoices = uniqueChords.filter((chord) => chord !== selected.chord);
    const fallbackPool = FALLBACK_WRONG_CHORDS.filter((chord) => chord !== selected.chord && !wrongChoices.includes(chord));
    const allWrongs = shuffle([...wrongChoices, ...fallbackPool]);

    while (allWrongs.length < 3) {
      allWrongs.push(pickRandom(FALLBACK_WRONG_CHORDS));
    }

    return {
      id: `${selected.lineIndex}-${selected.tokenIndex}-${index}`,
      acordeCorreto: selected.chord,
      opcoes: shuffle([selected.chord, ...allWrongs.slice(0, 3)]),
    };
  });

  const cifraComOculto = parsedLines
    .map((line, lineIndex) => {
      if (!line.tokens) return line.raw;

      const rendered = line.tokens
        .map((token, tokenIndex) => {
          const isHidden = selectedPositions.has(`${lineIndex}-${tokenIndex}`);
          if (isHidden && token.type === 'chord') return '?';
          return token.value;
        })
        .join('');

      if (line.section) {
        return `[${line.section}] ${rendered}`;
      }

      return rendered;
    })
    .join('\n');

  return {
    cifraComOculto,
    ocultos,
  };
}

function slugToReadable(input: string): string {
  return decodeURIComponent(input)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getYoutubeSearchQuery(musica: MusicaRow): string {
  const fromFields = `${musica.artista ?? ''} ${musica.titulo}`.trim();
  if (fromFields.length > 2) return fromFields;

  if (!musica.source_url) return musica.titulo;

  try {
    const url = new URL(musica.source_url);
    const chunks = url.pathname.split('/').filter(Boolean);
    if (chunks.length >= 2) {
      const artist = slugToReadable(chunks[0]);
      const title = slugToReadable(chunks[1]);
      return `${artist} ${title}`.trim();
    }
    return slugToReadable(chunks.join(' '));
  } catch {
    return musica.titulo;
  }
}

async function getYoutubeVideoId(query: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY.includes('...')) {
    return null;
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', '1');
  url.searchParams.set('key', YOUTUBE_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const payload = await response.json() as {
    items?: Array<{ id?: { videoId?: string } }>;
  };

  return payload.items?.[0]?.id?.videoId ?? null;
}

function decodeGoogleJwtPayload(token: string): { email?: string; name?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function TiraMusicaInner() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [musicas, setMusicas] = useState<MusicaRow[]>([]);
  const [loadingMusicas, setLoadingMusicas] = useState(true);
  const [selectedGenero, setSelectedGenero] = useState<string>('');
  const [selectedArtista, setSelectedArtista] = useState<string>('');
  const [selectedMusicaId, setSelectedMusicaId] = useState<string>('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [audioOnly, setAudioOnly] = useState(false);
  const [difficultyCount, setDifficultyCount] = useState<1 | 3 | 5>(1);
  const [challenge, setChallenge] = useState<MaskedChallenge | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [statusError, setStatusError] = useState<string | null>(null);
  const [googleProfile, setGoogleProfile] = useState<{ email?: string; name?: string } | null>(null);

  const selectedMusica = useMemo(
    () => musicas.find((musica) => musica.id === selectedMusicaId) ?? null,
    [musicas, selectedMusicaId],
  );

  const generos = useMemo(
    () => Array.from(new Set(musicas.map((musica) => musica.genero ?? 'Sem gênero'))).sort((a, b) => a.localeCompare(b)),
    [musicas],
  );

  const artistasFiltrados = useMemo(() => {
    if (!selectedGenero) return [];
    return Array.from(
      new Set(
        musicas
          .filter((musica) => (musica.genero ?? 'Sem gênero') === selectedGenero)
          .map((musica) => musica.artista ?? 'Artista desconhecido'),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [musicas, selectedGenero]);

  const musicasFiltradas = useMemo(() => {
    if (!selectedGenero || !selectedArtista) return [];
    return musicas.filter(
      (musica) =>
        (musica.genero ?? 'Sem gênero') === selectedGenero &&
        (musica.artista ?? 'Artista desconhecido') === selectedArtista,
    );
  }, [musicas, selectedGenero, selectedArtista]);

  async function fetchMusicas() {
    setLoadingMusicas(true);
    setStatusError(null);

    const { data, error } = await supabase
      .from('musicas')
      .select('*')
      .limit(5000);

    if (error) {
      setStatusError('Não foi possível carregar as músicas do banco agora.');
      setLoadingMusicas(false);
      return;
    }

    const normalized = (data ?? [])
      .filter((row) => typeof row.letra_cifrada === 'string' && row.letra_cifrada.length > 0)
      .map((row) => ({
        id: row.id,
        titulo: row.titulo,
        artista: row.artista,
        genero: ((row as unknown as { genero?: string | null }).genero) ?? null,
        letra_cifrada: row.letra_cifrada,
        source_url: ((row as unknown as { source_url?: string | null }).source_url) ?? null,
      }));

    setMusicas(normalized);

    if (normalized.length > 0) {
      const randomSong = pickRandom(normalized);
      setSelectedGenero(randomSong.genero ?? 'Sem gênero');
      setSelectedArtista(randomSong.artista ?? 'Artista desconhecido');
      setSelectedMusicaId(randomSong.id);
    } else {
      setSelectedGenero('');
      setSelectedArtista('');
      setSelectedMusicaId('');
      setStatusError('Nenhuma música encontrada no banco.');
    }

    setLoadingMusicas(false);
  }

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setLoadingMusicas(false);
      return;
    }
    fetchMusicas();
  }, [user, loading]);

  useEffect(() => {
    async function prepareChallenge() {
      if (!selectedMusica) {
        setChallenge(null);
        setYoutubeVideoId(null);
        setSelectedOptions({});
        return;
      }

      setSelectedOptions({});

      const built = buildMaskedChallenge(selectedMusica.letra_cifrada, difficultyCount);
      if (!built) {
        setChallenge(null);
        setStatusError('Essa música não tem linhas de acordes válidas para o Tira-Música.');
      } else {
        setChallenge(built);
        setStatusError(null);
      }

      const query = getYoutubeSearchQuery(selectedMusica);
      const videoId = await getYoutubeVideoId(query);
      setYoutubeVideoId(videoId);
    }

    prepareChallenge();
  }, [selectedMusica, difficultyCount]);

  async function handleGoogleLogin(response: CredentialResponse) {
    if (!response.credential) {
      setStatusError('Falha ao obter credencial do Google.');
      return;
    }

    const decoded = decodeGoogleJwtPayload(response.credential);
    setGoogleProfile(decoded);

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
    });

    if (error) {
      setStatusError('Falha no login Google via Supabase.');
    } else {
      setStatusError(null);
    }
  }

  function handleRandomSong() {
    if (!musicasFiltradas.length) return;
    const randomSong = pickRandom(musicasFiltradas);
    setSelectedMusicaId(randomSong.id);
  }
  
  function handleSelectGenero(genero: string) {
    setSelectedGenero(genero);
    setSelectedArtista('');
    setSelectedMusicaId('');
  }

  function handleSelectArtista(artista: string) {
    setSelectedArtista(artista);
    setSelectedMusicaId('');
  }

  function handleSelectOption(hiddenId: string, option: string) {
    setSelectedOptions((prev) => ({ ...prev, [hiddenId]: option }));
  }

  const allAnswered = challenge ? challenge.ocultos.every((oculto) => selectedOptions[oculto.id]) : false;
  const allCorrect = challenge
    ? challenge.ocultos.every((oculto) => selectedOptions[oculto.id] === oculto.acordeCorreto)
    : false;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-20">
      <div className="mx-auto w-full max-w-5xl px-4 pt-6">
        <div className="mb-5 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={() => navigate('/estude')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold">Tira-Música</h1>
            <p className="text-xs text-muted-foreground">Escute, veja a cifra e descubra o acorde oculto.</p>
          </div>
        </div>

        {!user && !loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-4 text-sm text-muted-foreground">
              Faça login com Google para começar o treino.
            </p>
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setStatusError('Não foi possível autenticar com Google.')}
              theme="outline"
              size="large"
              shape="pill"
              text="signin_with"
            />
          </div>
        )}

        {user && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-muted-foreground">
                Logado como <span className="font-semibold text-foreground">{googleProfile?.email ?? user.email}</span>
              </p>
            </div>

            <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_auto]">
              <div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label htmlFor="generoSelect" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Gênero
                    </label>
                    <select
                      id="generoSelect"
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#0E0E0E] px-3 text-sm text-foreground outline-none focus:border-[#3B82F6]"
                      value={selectedGenero}
                      onChange={(event) => handleSelectGenero(event.target.value)}
                      disabled={loadingMusicas || !generos.length}
                    >
                      <option value="">Selecione um gênero</option>
                      {generos.map((genero) => (
                        <option key={genero} value={genero}>
                          {genero}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="artistaSelect" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Artista
                    </label>
                    <select
                      id="artistaSelect"
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#0E0E0E] px-3 text-sm text-foreground outline-none focus:border-[#3B82F6]"
                      value={selectedArtista}
                      onChange={(event) => handleSelectArtista(event.target.value)}
                      disabled={loadingMusicas || !selectedGenero || !artistasFiltrados.length}
                    >
                      <option value="">Selecione um artista</option>
                      {artistasFiltrados.map((artista) => (
                        <option key={artista} value={artista}>
                          {artista}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="musicaSelect" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Música
                    </label>
                    <select
                      id="musicaSelect"
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#0E0E0E] px-3 text-sm text-foreground outline-none focus:border-[#3B82F6]"
                      value={selectedMusicaId}
                      onChange={(event) => setSelectedMusicaId(event.target.value)}
                      disabled={loadingMusicas || !selectedArtista || !musicasFiltradas.length}
                    >
                      <option value="">Selecione uma música</option>
                      {musicasFiltradas.map((musica) => (
                        <option key={musica.id} value={musica.id}>
                          {musica.titulo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRandomSong}
                  disabled={!musicasFiltradas.length}
                  className="w-full border-white/10 bg-white/[0.03] hover:bg-white/[0.08] md:w-auto"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Outra música
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nível de dificuldade</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { label: 'Fácil', value: 1 as const },
                  { label: 'Médio', value: 3 as const },
                  { label: 'Difícil', value: 5 as const },
                ].map((level) => (
                  <button
                    key={level.label}
                    type="button"
                    onClick={() => setDifficultyCount(level.value)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      difficultyCount === level.value
                        ? 'border-[#3B82F6]/80 bg-[#3B82F6]/20 text-[#93C5FD]'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08]'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              {youtubeVideoId ? (
                <>
                  <div className="flex justify-end border-b border-white/10 bg-white/[0.03] p-2">
                    <button
                      type="button"
                      onClick={() => setAudioOnly((prev) => !prev)}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/[0.08]"
                    >
                      {audioOnly ? 'Ver Vídeo' : 'Só Áudio'}
                    </button>
                  </div>
                  <div className={audioOnly ? 'h-0 overflow-hidden' : 'aspect-video'}>
                    <iframe
                      title="Trecho da música no YouTube"
                      src={`https://www.youtube.com/embed/${youtubeVideoId}?start=${YOUTUBE_EMBED_START_SECONDS}&autoplay=1`}
                      className={`w-full ${audioOnly ? 'h-0 invisible' : 'h-full visible'}`}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </>
              ) : (
                <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  Não foi possível localizar vídeo no YouTube para esta música.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Music className="h-4 w-4" /> Cifra com acorde oculto
              </div>

              {challenge ? (
                <>
                  <div className="max-h-[340px] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-sm">
                    {(() => {
                      const rawLines = challenge.cifraComOculto.split('\n');
                      const groups: Array<{ chords: string | null; lyrics: string | null }> = [];
                      let i = 0;
                      while (i < rawLines.length) {
                        const curr = rawLines[i];
                        const next = rawLines[i + 1];
                        // Verifica se a linha atual é de acordes (contém ? ou acordes maiúsculos)
                        const isChordLine = /^[A-G?]/.test(curr.trim()) || curr.includes('?');
                        if (isChordLine && next !== undefined && !/^[A-G?]/.test(next.trim()) && !next.includes('[')) {
                          groups.push({ chords: curr, lyrics: next });
                          i += 2;
                        } else {
                          groups.push({ chords: isChordLine ? curr : null, lyrics: isChordLine ? null : curr });
                          i += 1;
                        }
                      }
                      return groups.map((g, gi) => (
                        <div key={gi} className="mb-1">
                          {g.chords && (
                            <div className="leading-5">
                              {g.chords.split('?').map((part, pi, arr) => (
                                <span key={pi}>
                                  <span className="text-orange-300">{part}</span>
                                  {pi < arr.length - 1 && (
                                    <span className="animate-pulse rounded bg-orange-500 px-1.5 py-0.5 font-bold text-white shadow-[0_0_10px_rgba(249,115,22,0.8)]">?</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                          {g.lyrics && (
                            <div className="leading-5 text-[#EAEAEA]">{g.lyrics}</div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>

                  <div className="mt-4 space-y-4">
                    {challenge.ocultos.map((oculto, hiddenIndex) => (
                      <div key={oculto.id}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Acorde oculto {hiddenIndex + 1}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {oculto.opcoes.map((option) => {
                            const selectedForThis = selectedOptions[oculto.id];
                            const isSelected = selectedForThis === option;
                            const isCorrect = option === oculto.acordeCorreto;

                            let className = 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08]';

                            if (selectedForThis) {
                              if (isCorrect) {
                                className = 'border-emerald-500/70 bg-emerald-500/15 text-emerald-300';
                              } else if (isSelected) {
                                className = 'border-red-500/70 bg-red-500/15 text-red-300';
                              } else {
                                className = 'border-white/10 bg-white/[0.02] text-muted-foreground';
                              }
                            }

                            return (
                              <button
                                key={`${oculto.id}-${option}`}
                                type="button"
                                disabled={!!selectedForThis}
                                onClick={() => handleSelectOption(oculto.id, option)}
                                className={`rounded-xl border px-4 py-3 text-left font-mono text-lg font-semibold transition-colors ${className}`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {allAnswered && (
                    <div className={`mt-4 rounded-xl border p-3 text-sm ${allCorrect ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
                      {allCorrect
                        ? 'Boa! Você acertou todos os acordes ocultos.'
                        : `Quase. Os acordes corretos eram ${challenge.ocultos.map((oculto) => oculto.acordeCorreto).join(', ')}.`}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Não foi possível montar o desafio dessa música.</p>
              )}
            </div>
          </div>
        )}

        {loadingMusicas && user && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-muted-foreground">
            Carregando músicas...
          </div>
        )}

        {statusError && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{statusError}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TiraMusica() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <TiraMusicaInner />
    </GoogleOAuthProvider>
  );
}
