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
    const url = new URL(req.url);
    const action = req.method;
    console.log(`Webhook recebido: ${action} ${url.search}`);
    
    let body;
    try {
      body = await req.json();
      console.log("Body do webhook:", JSON.stringify(body));
    } catch (e) {
      console.log("Corpo não é JSON ou vazio");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Mercado Pago envia o ID do pagamento quando aprovado
    const paymentId = body.data?.id || body.id;
    const type = body.type || url.searchParams.get("type") || url.searchParams.get("topic");

    if (type !== "payment" || !paymentId) {
      return new Response("Ignorado, não é pagamento", { status: 200, headers: corsHeaders });
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("Sem token do MP");

    // Consulta o status real do pagamento no Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    
    if (!mpRes.ok) throw new Error("Falha ao buscar pagamento no MP");
    const paymentData = await mpRes.json();
    
    console.log(`Status do pagamento ${paymentId}: ${paymentData.status}`);

    if (paymentData.status === "approved") {
      const externalReference = paymentData.external_reference; // Que é o ID do usuário que mandamos
      const plan = paymentData.metadata?.plan || (paymentData.description?.toLowerCase().includes("maestro") ? "maestro" : "artista");
      
      if (!externalReference || externalReference === "default-user") {
        console.error("Pagamento aprovado, mas sem ID de usuário atrelado.");
        return new Response("OK, mas sem usuário", { status: 200, headers: corsHeaders });
      }

      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        console.log(`Promovendo usuário ${externalReference} para o plano ${plan}...`);
        
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ role: "premium", plan: plan }) // Seta premium no banco
          .eq("id", externalReference);
          
        if (updateError) {
          console.error("Erro ao atualizar banco:", updateError);
        } else {
          console.log(`Sucesso! Usuário promovido.`);
        }
      }
    }

    return new Response("Webhook processado", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(String(error), { status: 500, headers: corsHeaders });
  }
});
