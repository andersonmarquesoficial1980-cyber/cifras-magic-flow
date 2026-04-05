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

    console.log("Fetching URL:", url);
    const pageRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CifrasFlow/1.0)" },
    });
    if (!pageRes.ok) {
      return new Response(JSON.stringify({ error: `Falha ao acessar a URL (${pageRes.status})` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const html = await pageRes.text();

    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#\d+;/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 15000);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
            name: "extract_song",
            description: "Extrai dados completos de uma cifra musical de uma página web, incluindo análise de vibe",
            parameters: {
              type: "object",
              properties: {
                titulo: { type: "string", description: "Título da música" },
                artista: { type: "string", description: "Nome do artista/banda" },
                tom_original: { type: "string", description: "Tom original da música (ex: G, Am, D)" },
                bpm: { type: "number", description: "BPM estimado da música baseado no estilo e ritmo. Se não souber, estime com base no gênero (ex: balada ~70, pop ~120, sertanejo ~130, forró ~150)" },
                vibe: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["Animada", "Romântica", "Adoração", "Pra Pular", "Modão", "Introspectiva"]
                  },
                  description: "Classificação de vibe da música baseada na letra, estilo do artista e ritmo. Escolha 1 a 3 tags que melhor descrevem a música."
                },
                letra_cifrada: {
                  type: "string",
                  description: "Letra completa com cifras posicionadas acima das sílabas correspondentes, no formato texto puro (uma linha de acordes, uma linha de letra, alternando). Mantenha exatamente o formato original de cifras em cima das letras."
                },
              },
              required: ["titulo", "artista", "tom_original", "bpm", "vibe", "letra_cifrada"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_song" } },
        messages: [
          {
            role: "system",
            content: `Você é um curador musical especialista. Extraia o título, artista, tom original, BPM estimado, vibes e a letra cifrada do conteúdo fornecido.

IMPORTANTE para letra_cifrada: Mantenha o formato original com acordes posicionados acima das sílabas correspondentes usando espaços.

Para BPM: Estime baseado no gênero e estilo. Baladas ~70-80, Pop ~110-130, Sertanejo ~120-140, Forró ~140-160, Rock ~120-150, Worship ~75-90.

Para Vibe: Analise a letra, o sentimento e o estilo do artista. Escolha de 1 a 3 tags:
- Animada: músicas alegres, dançantes, festivas
- Romântica: músicas de amor, paixão, saudade romântica
- Adoração: músicas de louvor, worship, espirituais
- Pra Pular: músicas de festa, alta energia, carnaval
- Modão: sertanejo raiz, sofrência, viola
- Introspectiva: músicas reflexivas, melancólicas, profundas

Se não conseguir identificar o tom, use o primeiro acorde da música.
Não inclua cabeçalhos, tabs de violão ou informações extras - apenas a letra com cifras.`,
          },
          {
            role: "user",
            content: `Extraia a cifra musical e analise a vibe deste conteúdo:\n\n${textContent}`,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "IA não conseguiu extrair os dados da cifra" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const songData = JSON.parse(toolCall.function.arguments);
    console.log("Extracted:", songData.titulo, "-", songData.artista, "| Vibes:", songData.vibe);

    return new Response(JSON.stringify(songData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-song error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
