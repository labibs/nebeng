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
    title: "Nyari Boncengan",
    desc: "Nebeng searah",
    mode: "request"
  },
  {
    key: "tukang",
    icon: "👷",
    title: "Nyari Tukang",
    desc: "Manggil & anterin",
    mode: "keliling",
    features: [
      "Lihat rute realtime",
      "Order di perjalanan",
      "Scan barcode saat sampai",
      "Notifikasi mendekati lokasi"
    ]
  },

  // ===== OFFER (sedang perjalanan) =====
  {
    key: "perjalanan",
    icon: "🚚",
    title: "Dalam Perjalanan",
    desc: "Terima titipan & boncengan",
    mode: "offer",
    capabilities: {
      barang: true,
      belikan: true,
      boncengan: true
    }
  },
  {
    key: "keliling",
    icon: "🛺",
    title: "Jualan Keliling",
    desc: "Pantau rute & preorder",
    mode: "keliling",
    features: [
      "Lihat rute realtime",
      "Order di perjalanan",
      "Scan barcode saat sampai",
      "Notifikasi mendekati lokasi"
    ]
  },

  // ===== LAINNYA =====
  
  {
    key: "warung",
    icon: "🏪",
    title: "Tambah Outlet",
    desc: "Outlet sendiri / rekomendasi",
    mode: "business"
  },
  {
    key: "content",
    icon: "🎥",
    title: "Buat Konten",
    desc: "Video pendek / afiliator",
    mode: "content",
    attachableOffers: ["nitip_bawakan", "nitip_belikan", "cari_boncengan"]
  },
  
  

];
