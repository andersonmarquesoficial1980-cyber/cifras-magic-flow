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

    const urlObj = new URL(url);
    const segments = urlObj.pathname.split('/').filter(Boolean);
    // Pegar sempre o primeiro segmento como artista (ignora discografia, etc.)
    const artistSlug = segments[0];

    if (!artistSlug) {
      return new Response(JSON.stringify({ error: "Não foi possível identificar o artista na URL" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const songs: { titulo: string; url: string }[] = [];
    const seen = new Set<string>();

    // Tentar múltiplas páginas (paginação)
    for (let page = 1; page <= 5; page++) {
      const pageUrl = page === 1
        ? `https://www.cifraclub.com.br/${artistSlug}/`
        : `https://www.cifraclub.com.br/${artistSlug}/pagina/${page}/`;

      console.log(`Buscando página ${page}: ${pageUrl}`);

      const pageRes = await fetch(pageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9",
          "Referer": "https://www.cifraclub.com.br/",
        },
      });

      if (!pageRes.ok) {
        if (page === 1) {
          return new Response(JSON.stringify({ error: `Artista não encontrado (${pageRes.status}). Use a URL da página do artista no Cifra Club.` }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        break;
      }

      const html = await pageRes.text();
      let foundOnPage = 0;

      // Padrão 1: links diretos artista/musica
      const pattern1 = new RegExp(`href=["'](/${artistSlug}/[a-z0-9-]+/)["']`, 'gi');
      let m;
      while ((m = pattern1.exec(html)) !== null) {
        const path = m[1];
        // Ignorar páginas especiais
        if (/\/(discografia|videos|fotos|bio|letras|pagina|cifras|tabs|partituras)\//i.test(path)) continue;
        if (seen.has(path)) continue;
        seen.add(path);

        // Tentar pegar o nome do link
        const linkMatch = html.slice(Math.max(0, m.index - 5), m.index + m[0].length + 200)
          .match(/>([^<]{2,80})</);
        const titulo = linkMatch ? linkMatch[1].trim() : path.split('/').filter(Boolean)[1].replace(/-/g, ' ');

        songs.push({ titulo, url: `https://www.cifraclub.com.br${path}` });
        foundOnPage++;
      }

      // Padrão 2: JSON embebido na página
      const jsonPatterns = [
        /"musicas":\s*(\[[\s\S]*?\])/,
        /"songs":\s*(\[[\s\S]*?\])/,
        /"cifras":\s*(\[[\s\S]*?\])/,
      ];
      for (const pattern of jsonPatterns) {
        const jsonMatch = html.match(pattern);
        if (jsonMatch) {
          try {
            const items = JSON.parse(jsonMatch[1]);
            for (const item of items) {
              const slug = item.slug || item.url_slug || item.cifra_url;
              const name = item.name || item.title || item.nome || item.cifra_name;
              if (!slug || !name) continue;
              const path = `/${artistSlug}/${slug}/`;
              if (seen.has(path)) continue;
              seen.add(path);
              songs.push({ titulo: name, url: `https://www.cifraclub.com.br${path}` });
              foundOnPage++;
            }
          } catch {}
        }
      }

      console.log(`Página ${page}: ${foundOnPage} músicas`);

      // Se não achou nada na página 2+, para
      if (page > 1 && foundOnPage === 0) break;
    }

    console.log(`Total: ${songs.length} músicas`);

    if (songs.length === 0) {
      return new Response(JSON.stringify({
        error: `Nenhuma música encontrada para "${artistSlug}". Use a URL da página principal do artista no Cifra Club, ex: https://www.cifraclub.com.br/oficina-g3/`
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ songs: songs.slice(0, 200) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("scan-artist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
