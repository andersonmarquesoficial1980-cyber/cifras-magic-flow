import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Plan = "musico" | "artista" | "maestro";

function parseSignature(signatureHeader: string | null): { ts: string; v1: string } | null {
  if (!signatureHeader) return null;

  const parts = signatureHeader.split(",").map((part) => part.trim());
  const ts = parts.find((part) => part.startsWith("ts="))?.split("=")[1];
  const v1 = parts.find((part) => part.startsWith("v1="))?.split("=")[1];

  if (!ts || !v1) return null;
  return { ts, v1 };
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function isSignatureValid(req: Request, paymentId: string): Promise<boolean> {
  const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET");
  if (!webhookSecret) return true;

  const signature = parseSignature(req.headers.get("x-signature"));
  const requestId = req.headers.get("x-request-id") ?? "";
  if (!signature) return false;

  const manifest = `id:${paymentId};request-id:${requestId};ts:${signature.ts};`;
  const expected = await hmacSha256Hex(webhookSecret, manifest);

  return expected === signature.v1;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok");
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Configuração Supabase ausente");
    }
    if (!MP_ACCESS_TOKEN) throw new Error("MP_ACCESS_TOKEN não configurado");

    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    const paymentId = String(
      body?.data?.id ??
      body?.resource?.split("/").pop() ??
      url.searchParams.get("data.id") ??
      url.searchParams.get("id") ??
      "",
    );

    const eventType = String(
      body?.type ??
      body?.topic ??
      url.searchParams.get("type") ??
      url.searchParams.get("topic") ??
      "",
    );

    if (!paymentId) {
      return new Response("missing payment id", { status: 200 });
    }

    const isPaymentEvent = eventType.includes("payment") || eventType === "";
    if (!isPaymentEvent) {
      return new Response("ignored", { status: 200 });
    }

    const validSignature = await isSignatureValid(req, paymentId);
    if (!validSignature) {
      return new Response("invalid signature", { status: 401 });
    }

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
    });

    if (!paymentRes.ok) {
      const errorText = await paymentRes.text();
      console.error("Mercado Pago payment fetch error:", paymentRes.status, errorText);
      return new Response("payment lookup failed", { status: 502 });
    }

    const payment = await paymentRes.json();
    if (payment.status !== "approved") {
      return new Response("payment not approved", { status: 200 });
    }

    const metadataUserId = payment.metadata?.user_id;
    const externalReference = payment.external_reference;
    const userId = String(metadataUserId ?? externalReference ?? "");
    const plan = String(payment.metadata?.plan ?? "") as Plan;

    if (!userId || (plan !== "artista" && plan !== "maestro")) {
      console.error("Webhook sem user_id/plan válido", { userId, plan, paymentId });
      return new Response("missing metadata", { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ plan, role: "premium" })
      .eq("id", userId);

    if (profileError) {
      console.error("Erro ao atualizar profile:", profileError);
      return new Response("profile update failed", { status: 500 });
    }

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("mp-webhook error:", error);
    return new Response("error", { status: 500 });
  }
});
