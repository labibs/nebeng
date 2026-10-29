import { apiFetch } from "./apiClient";

export async function handlePay({ transactionId, navigate, setPaying }) {
  if (!transactionId) {
    alert("Transaction ID tidak valid");
    return;
  }

  if (setPaying) setPaying(true);

  try {
    const data = await apiFetch("/transactions/pay", {
      method: "POST",
      body: JSON.stringify({ transaction_id: transactionId }),
    });

    if (!data?.snap_token) {
      console.error("No snap token:", data);
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
        // Popup closed
      },
    });
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan: " + err.message);
  } finally {
    if (setPaying) setPaying(false);
  }
}
