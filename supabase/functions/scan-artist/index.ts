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
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extrair artista da URL do Cifra Club
    // ex: https://www.cifraclub.com.br/oficina-g3/ → oficina-g3
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split('/').filter(Boolean);
    const artistSlug = segments[0];

    if (!artistSlug) {
      return new Response(JSON.stringify({ error: "Não foi possível identificar o artista na URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usar API não-oficial do Cifra Club para buscar músicas
    const apiUrl = `https://www.cifraclub.com.br/api/v2/artist/${artistSlug}/musics/?limit=100`;
    
    console.log("Buscando via API:", apiUrl);
    
    const apiRes = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://www.cifraclub.com.br/",
        "Origin": "https://www.cifraclub.com.br",
      },
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      const musics = data.items || data.results || data.musics || [];
      
      if (musics.length > 0) {
        const songs = musics.map((m: any) => ({
          titulo: m.name || m.title || m.nome || '',
          url: m.url || `https://www.cifraclub.com.br/${artistSlug}/${m.slug || m.id}/`,
        })).filter((s: any) => s.titulo);

        console.log(`API retornou ${songs.length} músicas`);
        return new Response(JSON.stringify({ songs }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fallback: scraping da página do artista
    console.log("Fallback: scraping da página");
    const pageRes = await fetch(`https://www.cifraclub.com.br/${artistSlug}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
        "Referer": "https://www.cifraclub.com.br/",
      },
    });

    if (!pageRes.ok) {
      return new Response(JSON.stringify({ error: `Artista não encontrado (${pageRes.status})` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await pageRes.text();
    const songs: { titulo: string; url: string }[] = [];
    const seen = new Set<string>();

    // Padrão específico do Cifra Club: links de música ficam em /artista/musica/
    const musicRegex = new RegExp(`href=["'](/${artistSlug}/[^/"'?#]+/)["'][^>]*>\\s*([^<]{2,100})\\s*<`, 'gi');
    let match;

    while ((match = musicRegex.exec(html)) !== null) {
      const path = match[1];
      const text = match[2].trim();
      
      // Ignorar subpáginas que não são músicas
      if (path.includes('/discografia') || path.includes('/fotos') || path.includes('/videos') || 
          path.includes('/bio') || path.includes('/letras')) continue;

      if (seen.has(path)) continue;
      seen.add(path);

      songs.push({
        titulo: text,
        url: `https://www.cifraclub.com.br${path}`,
      });
    }

    // Tentar também JSON embebido na página
    const jsonMatch = html.match(/"musicas":\s*(\[[\s\S]*?\])/);
    if (jsonMatch && songs.length < 5) {
      try {
        const musics = JSON.parse(jsonMatch[1]);
        for (const m of musics) {
          const slug = m.slug || m.url_slug;
          if (!slug) continue;
          const path = `/${artistSlug}/${slug}/`;
          if (seen.has(path)) continue;
          seen.add(path);
          songs.push({
            titulo: m.name || m.title || slug,
            url: `https://www.cifraclub.com.br${path}`,
          });
        }
      } catch {}
    }

    console.log(`Scraping encontrou ${songs.length} músicas`);

    if (songs.length === 0) {
      return new Response(JSON.stringify({ 
        error: "Nenhuma música encontrada. Tente a URL da página do artista no Cifra Club (ex: https://www.cifraclub.com.br/nome-do-artista/)" 
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ songs: songs.slice(0, 100) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("scan-artist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
