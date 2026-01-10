import { supabase } from "./supabaseClient";

export async function handlePay({
  transactionId,
  navigate,
  setPaying,
}) {
  if (!transactionId) {
    alert("Transaction ID tidak valid");
    return;
  }

  if (setPaying) setPaying(true);

  try {
    const { data, error } = await supabase.functions.invoke(
      "create-midtrans-snap",
      {
        body: { transaction_id: transactionId },
      }
    );

    if (error || !data?.snap_token) {
      console.error("Midtrans error:", error, data);
      alert("Gagal membuat pembayaran. Coba lagi.");
      return;
    }

    if (!window.snap) {
      alert("Midtrans belum siap. Refresh halaman.");
      return;
    }

    window.snap.pay(data.snap_token, {
      onSuccess: (result) => {
        navigate?.(`/payment-success?order_id=${result.order_id}`);
      },
      onPending: (result) => {
        navigate?.(`/payment-pending?order_id=${result.order_id}`);
      },
      onError: () => {
        alert("Pembayaran gagal");
      },
      onClose: () => {
        console.log("Popup ditutup");
      },
    });
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan");
  } finally {
    if (setPaying) setPaying(false);
  }
}
