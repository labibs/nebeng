import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { transaction_id } = await req.json();

    console.log('Cek transaksi ID:', transaction_id);

    if (!transaction_id) {
      throw new Error("transaction_id required");
    }

    // Ambil data transaksi dari DB (pakai service_role biar bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: trx, error: trxError } = await supabaseAdmin
      .from("transactions")
      .select("id, deal_id, gross_amount, transaction_status")
      .eq("id", transaction_id)
      .single();

    if (trxError || !trx) {
      throw new Error("Transaksi tidak ditemukan");
    }

    if (trx.transaction_status !== 'draft') {
      throw new Error("Transaksi sudah dibayar atau dibatalkan");
    }

    // MIDTRANS SNAP API ENDPOINT
    const isProduction = false; // ubah true kalau live
    const midtransUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY")!;

    // Basic Auth: Base64(serverKey:)
    const authString = btoa(serverKey + ":");

    const parameter = {
      transaction_details: {
        order_id: trx.id, // harus unik
        gross_amount: Number(trx.gross_amount), // SESUAIKAN: dari gross_amount
      },
      credit_card: {
        secure: true,
      },
      // Opsional: tambah detail customer jika ada data
      customer_details: {
        // Anda bisa menambahkan field lain seperti email, phone jika ada di tabel
      },
      // Opsional: tambah detail item
      item_details: [
        {
          id: trx.deal_id?.toString() || "item-1",
          price: Number(trx.gross_amount),
          quantity: 1,
          name: `Deal ${trx.deal_id || "Item"}`,
        }
      ],
    };

    const response = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${authString}`,
      },
      body: JSON.stringify(parameter),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Midtrans error response:", errorText);
      throw new Error(`Midtrans error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.token) {
      throw new Error("Gagal generate snap token dari Midtrans");
    }

    // Update snap_token di database (opsional, tapi disarankan)
    const { error: updateError } = await supabaseAdmin
      .from("transactions")
      .update({ snap_token: data.token })
      .eq("id", transaction_id);

    if (updateError) {
      console.warn("Gagal update snap_token ke database:", updateError);
      // Lanjutkan saja, tidak perlu throw error karena token sudah didapat
    }

    // Return snap_token ke frontend
    return new Response(
      JSON.stringify({ snap_token: data.token }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});