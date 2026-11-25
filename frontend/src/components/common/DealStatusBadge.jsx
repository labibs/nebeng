import { useLanguage } from "../../lib/LanguageContext";

export default function DealStatusBadge({
  dealStatus,
  transactionStatus,
  paymentStatus,
  deliveryStatus,
  size = "md", // sm | md | lg
}) {
  const { t } = useLanguage();
  const effectivePaymentStatus = paymentStatus ?? transactionStatus;

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
  else if (effectivePaymentStatus === "draft") {
    label = "Sudah Deal";
    color = "badge-primary badge-outline font-medium";
  } else if (effectivePaymentStatus === "pending") {
    label = "Menunggu Bayar";
    color = "badge-warning";
  } else if (
    effectivePaymentStatus === "expire" ||
    effectivePaymentStatus === "expired"
  ) {
    label = "Transaksi Ulang";
    color = "badge-error";
  } else if (
    effectivePaymentStatus === "fail" ||
    effectivePaymentStatus === "failed"
  ) {
    label = "Bayar Gagal";
    color = "badge-error";
  } else if (effectivePaymentStatus === "paid") {
    label = "Sudah Dibayar";
    color = "badge-emerald-100 text-emerald-800 border-none font-semibold";
  }

  // 3️⃣ DEAL STATUS (FALLBACK)
  else if (dealStatus === "completed") {
    label = "Nego Selesai";
    color = "badge-primary badge-outline font-medium";
  } else if (
    dealStatus === "cancelled" ||
    effectivePaymentStatus === "cancelled"
  ) {
    label = "Dibatalkan";
    color = "badge-error badge-outline opacity-70";
  }

  return <span className={`badge ${color} badge-${size}`}>{t(label)}</span>;
}
