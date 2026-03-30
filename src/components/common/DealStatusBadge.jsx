export default function DealStatusBadge({
  dealStatus,
  transactionStatus,
  deliveryStatus,
  size = "md", // sm | md | lg
}) {
  let label = "Ulang Pembayaran";
  let color = "badge-outline badge-ghost opacity-60";

  // 1️⃣ DELIVERY STATUS (PRIORITAS TERTINGGI)
  if (deliveryStatus === "running") {
    label = "Sedang Diantar";
    color = "badge-info";
  } else if (deliveryStatus === "delivered") {
    label = "Pesanan Selesai";
    color = "badge-success";
  }

  // 2️⃣ TRANSACTION STATUS
  else if (transactionStatus === "draft") {
    label = "Sudah Deal";
    color = "badge-primary badge-outline font-medium";
  } else if (transactionStatus === "pending") {
    label = "Menunggu Bayar";
    color = "badge-warning";
  } else if (
    transactionStatus === "expire" ||
    transactionStatus === "expired"
  ) {
    label = "Transaksi Ulang";
    color = "badge-error";
  } else if (transactionStatus === "fail") {
    label = "Bayar Gagal";
    color = "badge-error";
  } else if (transactionStatus === "paid") {
    label = "Sudah Dibayar";
    color = "badge-emerald-100 text-emerald-800 border-none font-semibold";
  }

  // 3️⃣ DEAL STATUS (FALLBACK)
  else if (dealStatus === "completed") {
    label = "Nego Selesai";
    color = "badge-primary badge-outline font-medium";
  } else if (dealStatus === "cancelled" || transactionStatus === "cancelled") {
    label = "Dibatalkan";
    color = "badge-error badge-outline opacity-70";
  }

  return <span className={`badge ${color} badge-${size}`}>{label}</span>;
}
