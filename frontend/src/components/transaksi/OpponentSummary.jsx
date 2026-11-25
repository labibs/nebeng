import { useState } from "react";
import { useLanguage } from "../../lib/LanguageContext";

function OpponentSummary({ isCarrierLogin }) {
  const { t } = useLanguage();
  const [showFull, setShowFull] = useState(false);
  const limit = 60;

  const opponentRingkasan = isCarrierLogin
    ? t("Dana dari customer akan diteruskan kepada Anda setelah barang dinyatakan diterima oleh penerima. Pastikan proses pengiriman dilakukan sesuai kesepakatan.")
    : t("Pastikan seluruh detail pesanan sudah sesuai sebelum melanjutkan pembayaran. Dana akan diteruskan kepada kurir setelah barang diterima oleh penerima.");

  const isLong = opponentRingkasan.length > limit;
  const displayText = showFull ? opponentRingkasan : opponentRingkasan.slice(0, limit);

  return (
    <span className="text-sm opacity-70">
      {displayText}
      {isLong && !showFull && (
        <button
          type="button"
          className="text-blue-600 cursor-pointer ml-1"
          onClick={() => setShowFull(true)}
        >
          {t("... selengkapnya")}
        </button>
      )}
      {isLong && showFull && (
        <button
          type="button"
          className="text-blue-600 cursor-pointer ml-1"
          onClick={() => setShowFull(false)}
        >
          {' '}{t("tutup")}
        </button>
      )}
    </span>
  );
}

export default OpponentSummary;
