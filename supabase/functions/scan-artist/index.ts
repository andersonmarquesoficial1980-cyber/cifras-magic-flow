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
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CifrasFlow/1.0)" },
    });
    if (!pageRes.ok) {
      return new Response(JSON.stringify({ error: `Falha ao acessar a URL (${pageRes.status})` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const html = await pageRes.text();

    const songs: { titulo: string; url: string }[] = [];
    const seen = new Set<string>();

    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1];
      const text = match[2].trim();

      if (!text || text.length < 2 || text.length > 120) continue;
      if (href.includes('/blog') || (href.includes('/artista') && href.endsWith('/') && href.split('/').filter(Boolean).length <= 1)) continue;
      if (href.includes('#') || href.includes('javascript:') || href.includes('mailto:')) continue;
      if (href.includes('/login') || href.includes('/cadastro') || href.includes('/app')) continue;

      if (href.startsWith('/')) {
        try {
          const base = new URL(url);
          href = `${base.origin}${href}`;
        } catch { continue; }
      }

      const path = new URL(href).pathname;
      const segments = path.split('/').filter(Boolean);
      if (segments.length < 2) continue;

      const key = path.replace(/\/$/, '');
      if (seen.has(key)) continue;
      seen.add(key);

      songs.push({ titulo: text, url: href });
    }

    if (songs.length < 3) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, "\n")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, 20000);

      const anchors: string[] = [];
      const anchorRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let am;
      while ((am = anchorRegex.exec(html)) !== null) {
        const h = am[1];
        const t = am[2].replace(/<[^>]+>/g, '').trim();
        if (t && t.length > 1 && t.length < 120) {
          anchors.push(`[${t}](${h})`);
        }
      }

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          tools: [{
            type: "function",
            function: {
              name: "extract_songs",
              description: "Extrai a lista de músicas e seus links de uma página de artista",
              parameters: {
                type: "object",
                properties: {
                  songs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        titulo: { type: "string" },
                        url: { type: "string" },
                      },
                      required: ["titulo", "url"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["songs"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "extract_songs" } },
          messages: [
            {
              role: "system",
              content: "Extraia os nomes e URLs de todas as músicas/cifras listadas nesta página. Retorne apenas músicas, não artistas, categorias ou links de navegação.",
            },
            {
              role: "user",
              content: `Links encontrados:\n${anchors.slice(0, 200).join('\n')}\n\nTexto:\n${textContent.slice(0, 8000)}`,
            },
          ],
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          const parsed = JSON.parse(toolCall.function.arguments);
          if (parsed.songs?.length) {
            for (const s of parsed.songs) {
              let songUrl = s.url;
              if (songUrl.startsWith('/')) {
                try {
                  const base = new URL(url);
                  songUrl = `${base.origin}${songUrl}`;
                } catch { continue; }
              }
              const key = new URL(songUrl).pathname.replace(/\/$/, '');
              if (!seen.has(key)) {
                seen.add(key);
                songs.push({ titulo: s.titulo, url: songUrl });
              }
            }
          }
        }
      }
    }

    console.log(`Found ${songs.length} songs`);

    return new Response(JSON.stringify({ songs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-artist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
