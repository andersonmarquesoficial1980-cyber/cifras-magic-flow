import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL é obrigatória" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let urlFinal = url.trim();
    if (!urlFinal.startsWith("http")) urlFinal = "https://" + urlFinal;

    const urlObj = new URL(urlFinal);
    const segments = urlObj.pathname.split('/').filter(Boolean);
    const artistSlug = segments[0];

    if (!artistSlug) {
      return new Response(JSON.stringify({ error: "Não foi possível identificar o artista na URL" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const songs: { titulo: string; url: string }[] = [];
    const seen = new Set<string>();

    // Fetch the exact URL provided (supports /musicas.html and regular artist page)
    console.log(`Buscando: ${urlFinal}`);

    const pageRes = await fetch(urlFinal, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
        "Referer": "https://www.cifraclub.com.br/",
      },
    });

    if (!pageRes.ok) {
      return new Response(JSON.stringify({ error: `Página não encontrada (${pageRes.status}). Verifique a URL.` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await pageRes.text();

    // Extract song links — pattern: href="/artist-slug/song-slug/" or href="/artist-slug/numeric-id/"
    // Exclude navigation links (musicas.html, discografia, etc.)
    const songPattern = new RegExp(`href="(/${artistSlug}/(?:[a-z0-9][a-z0-9-]*[a-z0-9]|[0-9]+)/)"`, 'gi');
    const excludeTerms = /\/(discografia|videos|fotos|bio|letras|pagina|cifras|tabs|partituras|musicas)\//i;

    let m;
    const linkPositions: { path: string; index: number }[] = [];
    while ((m = songPattern.exec(html)) !== null) {
      const path = m[1];
      if (excludeTerms.test(path)) continue;
      if (seen.has(path)) continue;
      seen.add(path);
      linkPositions.push({ path, index: m.index });
    }

    console.log(`Links encontrados: ${linkPositions.length}`);

    // For each link, try to extract title from nearby HTML
    // Cifra Club uses class "primaryLabel" for song titles
    for (const { path, index } of linkPositions) {
      // Look at surrounding 600 chars for a primaryLabel
      const surrounding = html.slice(Math.max(0, index - 50), index + 600);

      // Try primaryLabel class
      const primaryLabelMatch = surrounding.match(/primaryLabel[^>]*>([^<]{2,120})</);
      let titulo = primaryLabelMatch ? primaryLabelMatch[1].trim() : '';

      // Fallback: any text inside <p> near the link
      if (!titulo) {
        const pMatch = surrounding.match(/<p[^>]*>([^<]{2,80})<\/p>/);
        titulo = pMatch ? pMatch[1].trim() : '';
      }

      // Fallback: derive from slug
      if (!titulo) {
        const slug = path.split('/').filter(Boolean)[1] || '';
        // Skip purely numeric IDs without a title — they'll show the ID as fallback
        titulo = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }

      // Skip obviously bad entries (empty or just numbers)
      if (!titulo || /^\d+$/.test(titulo)) {
        titulo = path.split('/').filter(Boolean)[1]?.replace(/-/g, ' ') || 'Sem título';
      }

      // Decode HTML entities
      titulo = titulo
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

      songs.push({ titulo, url: `https://www.cifraclub.com.br${path}` });
    }

    console.log(`Total músicas extraídas: ${songs.length}`);

    if (songs.length === 0) {
      return new Response(JSON.stringify({
        error: `Nenhuma música encontrada. Tente a URL completa da página do artista, ex: https://www.cifraclub.com.br/diante-do-trono/musicas.html`
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return up to 500 songs (UI can handle selection)
    return new Response(JSON.stringify({ songs: songs.slice(0, 500) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("scan-artist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
