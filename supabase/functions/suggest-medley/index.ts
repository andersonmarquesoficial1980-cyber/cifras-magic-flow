import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { titulo, tom, genero, artista } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em teoria musical e medleys. O usuário está tocando uma música e quer sugestões para um medley perfeito. Analise o tom, gênero e progressão harmônica típica da música para sugerir 3 músicas populares que compartilhem a mesma progressão de graus (ex: I - V - VIm - IV). Responda APENAS usando a tool fornecida.`,
          },
          {
            role: "user",
            content: `Estou tocando "${titulo}" de ${artista || "artista desconhecido"}, no tom de ${tom}, gênero ${genero || "não especificado"}. Sugira 3 músicas populares para um medley perfeito que compartilhem a mesma progressão harmônica.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_medley",
              description: "Retorna 3 sugestões de músicas para medley",
              parameters: {
                type: "object",
                properties: {
                  progressao: {
                    type: "string",
                    description: "A progressão harmônica identificada, ex: I - V - VIm - IV",
                  },
                  sugestoes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        titulo: { type: "string" },
                        artista: { type: "string" },
                        tom: { type: "string" },
                        motivo: { type: "string", description: "Breve explicação de por que encaixa no medley" },
                      },
                      required: ["titulo", "artista", "tom", "motivo"],
                    },
                  },
                },
                required: ["progressao", "sugestoes"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_medley" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-medley error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
