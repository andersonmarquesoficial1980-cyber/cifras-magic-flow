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

    console.log("Scanning artist page:", url);
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });

    if (!pageRes.ok) {
      return new Response(JSON.stringify({ error: `Falha ao acessar a URL (${pageRes.status})` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await pageRes.text();
    const songs: { titulo: string; url: string }[] = [];
    const seen = new Set<string>();

    // Regex mais abrangente para links de cifras
    const linkRegex = /<a[^>]+href=["']([^"'#?]+)["'][^>]*>\s*([^<]{2,120})\s*<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1].trim();
      const text = match[2].trim();

      if (!text || text.length < 2 || text.length > 120) continue;
      if (href.includes('/blog') || href.includes('/login') || href.includes('/cadastro')) continue;
      if (href.includes('javascript:') || href.includes('mailto:')) continue;

      // Resolver URL relativa
      if (href.startsWith('/')) {
        try {
          const base = new URL(url);
          href = `${base.origin}${href}`;
        } catch { continue; }
      }

      // Validar URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(href);
      } catch { continue; }

      const path = parsedUrl.pathname;
      const segments = path.split('/').filter(Boolean);

      // Cifra Club: links de música têm 2+ segmentos (artista/musica)
      if (segments.length < 2) continue;

      // Ignorar links de navegação óbvios
      const lowerText = text.toLowerCase();
      if (['entrar', 'cadastrar', 'buscar', 'home', 'início', 'menu', 'mais', 'ver mais', 'voltar'].includes(lowerText)) continue;

      const key = path.replace(/\/$/, '');
      if (seen.has(key)) continue;
      seen.add(key);

      songs.push({ titulo: text, url: href });
    }

    console.log(`Found ${songs.length} songs`);

    // Limitar a 100 músicas por vez
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
