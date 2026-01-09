// supabase/functions/midtrans-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Konstanta & env check
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MIDTRANS_SERVER_KEY) {
  console.error("Missing required environment variables for Midtrans webhook");
}

// Singleton Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Mapping status Midtrans → status bisnis di DB (kolom transaction_status)
const STATUS_MAP: Record<string, string> = {
  settlement: "paid",
  "capture-accept": "paid",           // credit card sukses
  cancel: "cancelled",
  expire: "expired",
  deny: "failed",
  "capture-challenge": "fraud_review", // review fraud
  "capture-deny": "failed",
  pending: "pending",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const notification = await req.json() as MidtransNotification;

    const {
      order_id,
      transaction_status = "",
      fraud_status = "",
      gross_amount = "",
      signature_key = "",
      status_code = "200", // hampir selalu 200 untuk notif sukses
      payment_type,
    } = notification;

    if (!order_id) {
      console.warn("Webhook tanpa order_id");
      return badRequest("Missing order_id");
    }

    // =====================================
    // VALIDASI SIGNATURE WAJIB (perbaikan penting!)
    // Formula resmi Midtrans: SHA512(order_id + status_code + gross_amount + serverKey)
    // =====================================
    const payloadString = order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY;
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadString);
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    if (signature_key !== calculatedSignature) {
      console.warn(`Invalid signature for order_id: ${order_id}`);
      return new Response("Invalid signature", { status: 401 });
    }

    // =====================================
    // Tentukan status bisnis
    // =====================================
    const statusKey = transaction_status === "capture"
      ? `capture-${fraud_status.toLowerCase() || "unknown"}`
      : transaction_status.toLowerCase();

    let newTransactionStatus = STATUS_MAP[statusKey] || "pending";

    // =====================================
    // Cek existing record (idempotency & proteksi)
    // =====================================
    const { data: existing, error: fetchError } = await supabase
      .from("transactions")
      .select("transaction_status")
      .eq("order_id", order_id)
      .maybeSingle(); // single() akan error kalau >1 atau 0

    if (fetchError) {
      console.error("Error fetch transaction:", fetchError);
      // Tetap return 200 biar Midtrans tidak retry spam
      return successResponse();
    }

    if (!existing) {
      console.warn(`Transaction dengan order_id ${order_id} tidak ditemukan`);
      return successResponse(); // jangan error, mungkin race condition
    }

    const currentStatus = existing.transaction_status;

    // Skip kalau sudah final / sudah sama
    if (["paid", "cancelled", "expired", "failed"].includes(currentStatus)) {
      console.info(`Order ${order_id} sudah final: ${currentStatus} → skip update`);
      return successResponse();
    }

    if (currentStatus === newTransactionStatus) {
      console.info(`Status sudah sama: ${currentStatus} → skip`);
      return successResponse();
    }

    // =====================================
    // Update tabel sesuai struktur kamu
    // =====================================
    const updateData: any = {
      transaction_status: newTransactionStatus,
      fraud_status: fraud_status || null,
      payment_type: payment_type || null,
      updated_at: new Date().toISOString(),
    };

    if (newTransactionStatus === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("order_id", order_id);

    if (updateError) {
      console.error("Update gagal:", updateError);
      throw updateError;
    }

    console.info(`Order ${order_id} berhasil diupdate ke transaction_status: ${newTransactionStatus}`);

    return successResponse();
  } catch (err) {
    console.error("Webhook error:", err);
    // WAJIB return 200 agar Midtrans stop retry
    return successResponse();
  }
});

// Helpers
function successResponse(): Response {
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function badRequest(message: string): Response {
  return new Response(JSON.stringify({ error: message }), { status: 400 });
}

// Type untuk payload Midtrans (lebih aman)
interface MidtransNotification {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  gross_amount: string;
  signature_key: string;
  status_code?: string;
  payment_type?: string;
  transaction_time?: string;
  settlement_time?: string;
  [key: string]: unknown;
}