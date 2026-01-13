export const actions = [
  // ===== REQUEST (butuh bantuan) =====
  {
    key: "nitip_bawakan",
    icon: "🧳",
    title: "Nitip Bawain",
    desc: "Barang sudah ada",
    mode: "request"
  },
  {
    key: "nitip_belikan",
    icon: "🛍️",
    title: "Nitip Beliin",
    desc: "Minta dibeliin",
    mode: "request"
  },
  {
    key: "cari_boncengan",
    icon: "🛵",
    title: "Cari Boncengan",
    desc: "Nebeng searah",
    mode: "request"
  },

  // ===== OFFER (sedang perjalanan) =====
  {
    key: "perjalanan",
    icon: "🚚",
    title: "Sedang Perjalanan",
    desc: "Bersedia dititipan & mboncengin",
    mode: "offer",
    capabilities: {
      barang: true,
      belikan: true,
      boncengan: true
    }
  },

  // ===== LAINNYA =====
  {
    key: "content",
    icon: "🎥",
    title: "Buat Konten",
    desc: "Video pendek / afiliator",
    mode: "content",
    attachableOffers: ["nitip_bawakan", "nitip_belikan", "cari_boncengan"]
  },
  {
    key: "warung",
    icon: "🏪",
    title: "Tambah Outlet",
    desc: "Outlet sendiri / rekomendasi",
    mode: "business"
  }
];
