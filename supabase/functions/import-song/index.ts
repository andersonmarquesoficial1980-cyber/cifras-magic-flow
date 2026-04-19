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

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        tools: [{
          type: "function",
          function: {
            name: "extract_song",
            description: "Extrai dados completos de uma cifra musical de uma página web, incluindo análise de vibe e informação de capotraste",
            parameters: {
              type: "object",
              properties: {
                titulo: { type: "string", description: "Título da música" },
                artista: { type: "string", description: "Nome do artista/banda" },
                tom_original: { type: "string", description: "Tom original da música (ex: G, Am, D)" },
                bpm: { type: "number", description: "BPM estimado da música baseado no estilo e ritmo. Se não souber, estime com base no gênero (ex: balada ~70, pop ~120, sertanejo ~130, forró ~150)" },
                capo_fret: { type: "number", description: "Casa do capotraste indicada na cifra (ex: 'Capotraste na 2ª casa' → 2, 'Capo 3' → 3). Se não houver indicação de capotraste, retorne 0." },
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
                  description: "Letra completa com cifras posicionadas acima das sílabas correspondentes. REGRAS OBRIGATÓRIAS: (1) Acordes que pertencem ao mesmo verso/frase musical ficam na MESMA linha, separados por espaços, ex: 'C#m          B4' numa só linha acima de 'Antes de eu falar'. NUNCA coloque cada acorde em linha separada quando eles pertencem à mesma frase. (2) O padrão é: linha de acordes, linha de letra, alternando. (3) Acordes que ficam sozinhos acima de uma só sílaba podem ficar em linha própria somente se realmente só há um acorde naquele verso."
                },
                compositor: {
                  type: "string",
                  description: "Nome do compositor ou compositores da música. Geralmente aparece no rodapé da página como 'Composição:' ou 'Compositor:'. Se não encontrar, retorne string vazia."
                },
              },
              required: ["titulo", "artista", "tom_original", "bpm", "capo_fret", "vibe", "letra_cifrada", "compositor"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_song" } },
        messages: [
          {
            role: "system",
            content: `Você é um curador musical especialista. Extraia o título, artista, tom original, BPM estimado, casa do capotraste, vibes e a letra cifrada do conteúdo fornecido.

IMPORTANTE para letra_cifrada:
- Acordes do mesmo verso ficam na MESMA linha de acordes, separados por espaços. Ex: 'C#m          B4' é UMA linha, não duas. NUNCA coloque cada acorde em linha separada quando pertencem à mesma frase musical.
- Formato correto: linha de acordes → linha de letra → linha de acordes → linha de letra...
- Exemplo correto:
  C#m          B4
  Antes de eu falar
       A9
  Tu cantavas sobre mim
- Exemplo ERRADO (não faça isso):
  C#m
  B4
  Antes de eu falar
  A9
  Tu cantavas sobre mim
- NUNCA inclua TABs, tablaturas, diagramas de solo (linhas com e|--, B|--, G|--, D|--, A|--, E|--). Remova completamente esses blocos.
- NUNCA inclua blocos de codigo markdown (tres backticks) — retorne apenas texto puro.
- ELIMINE REPETIÇÕES DE SEÇÕES: Se um refrão, verso ou ponte aparece mais de uma vez com exatamente os mesmos acordes e letra, escreva apenas UMA VEZ. Onde a seção se repetiria, coloque apenas o marcador da seção entre colchetes (ex: [Refrão], [Repetir Refrão x2]).
- Mantenha os marcadores de seção entre colchetes: [Intro], [Verso], [Primeira Parte], [Refrão], [Ponte], [Segunda Parte], [Final], etc.
- Seções com letra/acordes DIFERENTES devem ser escritas por completo mesmo que tenham o mesmo nome.
- O objetivo é ter a cifra mais compacta possível sem perder informação musical.

Para Capotraste: Procure indicações como "Capotraste na Xª casa", "Capo na X casa", "Capo X", "Tom: X (capo Xª casa)". Se encontrar, retorne o número da casa. Se não houver indicação, retorne 0.

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
    console.log("Extracted:", songData.titulo, "-", songData.artista, "| Capo:", songData.capo_fret, "| Vibes:", songData.vibe);

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
