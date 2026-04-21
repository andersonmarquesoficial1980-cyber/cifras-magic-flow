import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Plan = "musico" | "artista" | "maestro";

const PLAN_CONFIG: Record<Exclude<Plan, "musico">, { title: string; price: number }> = {
  artista: { title: "MelodAI - Plano Artista", price: 14.9 },
  maestro: { title: "MelodAI - Plano Maestro", price: 24.9 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const WEB_BASE_URL = Deno.env.get("WEB_BASE_URL") ?? "http://localhost:5173";

    if (!MP_ACCESS_TOKEN) throw new Error("MP_ACCESS_TOKEN não configurado");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Configuração Supabase ausente");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan } = await req.json() as { plan?: Plan };
    if (!plan || (plan !== "artista" && plan !== "maestro")) {
      return new Response(JSON.stringify({ error: "Plano inválido para checkout" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planInfo = PLAN_CONFIG[plan];
    const webhookUrl = Deno.env.get("MP_WEBHOOK_URL") ?? `${SUPABASE_URL}/functions/v1/mp-webhook`;

    const preferenceBody = {
      items: [
        {
          id: `melodai-${plan}`,
          title: planInfo.title,
          quantity: 1,
          currency_id: "BRL",
          unit_price: planInfo.price,
        },
      ],
      payer: {
        email: user.email,
      },
      external_reference: user.id,
      metadata: {
        user_id: user.id,
        plan,
      },
      back_urls: {
        success: `${WEB_BASE_URL}/configuracoes?payment=success`,
        pending: `${WEB_BASE_URL}/configuracoes?payment=pending`,
        failure: `${WEB_BASE_URL}/landing?payment=failure`,
      },
      auto_return: "approved",
      notification_url: webhookUrl,
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!mpRes.ok) {
      const errorText = await mpRes.text();
      console.error("Mercado Pago checkout error:", mpRes.status, errorText);
      return new Response(JSON.stringify({ error: "Falha ao criar checkout no Mercado Pago" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpData = await mpRes.json();
    const checkoutUrl = mpData.init_point ?? mpData.sandbox_init_point;

    if (!checkoutUrl) {
      return new Response(JSON.stringify({ error: "Checkout sem URL de redirecionamento" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        checkout_url: checkoutUrl,
        preference_id: mpData.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("mp-checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro inesperado" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
