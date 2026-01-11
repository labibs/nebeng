export default function DealStatusBadge({
  dealStatus,
  transactionStatus,
  deliveryStatus,
  size = "md", // sm | md | lg
}) {
  let label = "Status Tidak Diketahui";
  let color = "badge-ghost";

  // 1️⃣ DELIVERY STATUS (PRIORITAS TERTINGGI)
  if (deliveryStatus === "running") {
    label = "Sedang Diantar";
    color = "badge-info";
  } else if (deliveryStatus === "delivered") {
    label = "Titipan Diterima";
    color = "badge-success";
  }

  // 2️⃣ TRANSACTION STATUS
  else if (transactionStatus === "pending") {
    label = "Menunggu Pembayaran";
    color = "badge-warning";
  } else if (transactionStatus === "expire") {
    label = "Pembayaran Expired";
    color = "badge-error";
  } else if (transactionStatus === "fail") {
    label = "Pembayaran Gagal";
    color = "badge-error";
  } else if (transactionStatus === "paid") {
    label = "Pembayaran Berhasil";
    color = "badge-success";
  }

  // 3️⃣ DEAL STATUS (FALLBACK)
  else if (dealStatus === "completed") {
    label = "Transaksi Baru";
    color = "badge-neutral";
  }

  return (
    <span className={`badge ${color} badge-${size}`}>
      {label}
    </span>
  );
}
