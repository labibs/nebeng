import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const { transaction_id } = await req.json();
    if (!transaction_id) throw new Error("transaction_id required");
    console.log("Cek transaksi ID:", transaction_id);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Ambil transaksi dari DB
    const { data: trx, error: trxError } = await supabaseAdmin
      .from("transactions")
      .select("id, deal_id, gross_amount, transaction_status, snap_token")
      .eq("id", transaction_id)
      .single();

    if (trxError || !trx) throw new Error("Transaksi tidak ditemukan");
    if (
      trx.transaction_status !== "draft" &&
      trx.transaction_status !== "pending" &&
      trx.transaction_status !== "expired"
    ) {
      throw new Error("Transaksi sudah dibayar atau dibatalkan");
    }

    const isProduction = false;
    const midtransBaseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1"
      : "https://app.sandbox.midtrans.com/snap/v1";
    const authString = btoa(Deno.env.get("MIDTRANS_SERVER_KEY")! + ":");

    // 1️⃣ Jika snap_token masih valid di DB → return langsung
    // Jangan pakai token lama kalau transaksi sudah expired.
    if (trx.snap_token && trx.transaction_status !== "expired") {
      console.log("Snap token sudah ada di DB, return token lama.");
      return new Response(JSON.stringify({ snap_token: trx.snap_token }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2️⃣ Cek status transaksi di Midtrans
    let existingMidtransData: any = null;
    const statusUrl = `https://api${isProduction ? "" : ".sandbox"}.midtrans.com/v2/${transaction_id}/status`;

    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
    });

    if (statusResponse.ok) {
      existingMidtransData = await statusResponse.json();
      console.log(
        "Transaksi ditemukan di Midtrans:",
        existingMidtransData.transaction_status,
      );
    } else if (statusResponse.status === 404) {
      console.log("Order_id belum ada di Midtrans → aman buat baru");
    } else {
      console.warn(
        "Error cek status Midtrans:",
        statusResponse.status,
        await statusResponse.text(),
      );
    }

    // 3️⃣ Blokir transaksi final
    const finalStatuses = ["settlement", "capture", "deny"];
    if (
      existingMidtransData &&
      finalStatuses.includes(existingMidtransData.transaction_status)
    ) {
      throw new Error(
        `Transaksi dengan order_id lama sudah ${existingMidtransData.transaction_status} di Midtrans`,
      );
    }

    // 4️⃣ Kalau expired / cancel / pending / null → buat order_id baru
    const midtransOrderId = `trx-${uuidv4().slice(0, 20)}`; // potong UUID

    console.log("Generate Midtrans order_id baru:", midtransOrderId);

    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: Number(trx.gross_amount),
      },
      credit_card: { secure: true },
      item_details: [
        {
          id: trx.deal_id?.toString() || "item-1",
          price: Number(trx.gross_amount),
          quantity: 1,
          name: `Transaksi ${trx.id || "Item"}`,
        },
      ],
      custom_field1: `original_trx_id: ${trx.id}`,
      // expiry: { unit: "hours", duration: 2 } // opsional

      finish_redirect_url: `https://nebeng.vercel.app/deal?deal=${trx.deal_id}&trx=${trx.id}`,
    };

    const createResponse = await fetch(`${midtransBaseUrl}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(parameter),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Midtrans error: ${createResponse.status} ${errorText}`);
    }

    const data = await createResponse.json();
    if (!data.token) throw new Error("Gagal generate snap token dari Midtrans");

    // 5️⃣ Simpan snap_token dan midtrans_order_id ke DB
    const { error: updateError } = await supabaseAdmin
      .from("transactions")
      .update({
        snap_token: data.token,
        order_id: midtransOrderId,
        transaction_status: "pending",
      })
      .eq("id", trx.id);

    if (updateError) console.warn("Gagal update snap_token:", updateError);

    return new Response(JSON.stringify({ snap_token: data.token }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
