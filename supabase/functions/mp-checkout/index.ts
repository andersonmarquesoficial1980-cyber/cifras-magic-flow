import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("Chave do Mercado Pago não encontrada no servidor.");

    const { plan } = await req.json();
    if (!plan) throw new Error("Plano não informado");

    // Pegar infos do usuário para mandar pro MP
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");
    
    let userEmail = "cliente@melodai.com.br";
    let userId = "default-user";
    
    if (SUPABASE_URL && SUPABASE_ANON_KEY && authHeader) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userEmail = user.email || userEmail;
        userId = user.id;
      }
    }

    const title = plan === "maestro" ? "MelodAI - Plano Maestro" : "MelodAI - Plano Artista";
    const price = plan === "maestro" ? 24.9 : 14.9;

    const preferenceBody = {
      items: [
        {
          id: `melodai-${plan}`,
          title: title,
          quantity: 1,
          currency_id: "BRL",
          unit_price: price,
        },
      ],
      payer: {
        email: userEmail
      },
      payment_methods: {
        installments: 1
      },
      back_urls: {
        success: `https://melodai.com.br/configuracoes?payment=success`,
        pending: `https://melodai.com.br/configuracoes?payment=pending`,
        failure: `https://melodai.com.br/landing?payment=failure`,
      },
      auto_return: "approved",
      external_reference: userId,
      metadata: {
        plan: plan,
        user_id: userId
      }
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    const mpData = await mpRes.json();
    
    if (!mpRes.ok) throw new Error(`Erro do Mercado Pago: ${JSON.stringify(mpData)}`);

    return new Response(
      JSON.stringify({ checkout_url: mpData.init_point }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro crítico" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
