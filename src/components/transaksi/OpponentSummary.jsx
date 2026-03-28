import { useState } from "react";

function OpponentSummary({ isCarrierLogin }) {
  const [showFull, setShowFull] = useState(false);
  const limit = 60;

  const opponentRingkasan = isCarrierLogin
    ? "Dana dari customer akan diteruskan kepada Anda setelah barang dinyatakan diterima oleh penerima. Pastikan proses pengiriman dilakukan sesuai kesepakatan."
    : "Pastikan seluruh detail pesanan sudah sesuai sebelum melanjutkan pembayaran. Dana akan diteruskan kepada kurir setelah barang diterima oleh penerima.";

  const isLong = opponentRingkasan.length > limit;
  const displayText = showFull ? opponentRingkasan : opponentRingkasan.slice(0, limit);

  return (
    <p className="text-sm opacity-70">
      {displayText}
      {isLong && !showFull && (
        <span
          className="text-blue-600 cursor-pointer ml-1"
          onClick={() => setShowFull(true)}
        >
          … selengkapnya
        </span>
      )}
      {isLong && showFull && (
        <span
          className="text-blue-600 cursor-pointer ml-1"
          onClick={() => setShowFull(false)}
        >
          {" "}tutup
        </span>
      )}
    </p>
  );
}

export default OpponentSummary;
