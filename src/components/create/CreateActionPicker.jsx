const actions = [
  { key: "nitip_bawakan", icon: "🧳", title: "Nitip Bawakan", desc: "Barang sudah ada" },
  { key: "nitip_belikan", icon: "🛍️", title: "Nitip Belikan", desc: "Minta dibelikan" },
  { key: "bawa_titipan", icon: "🚚", title: "Bawa Titipan", desc: "Saya yang bawa" },
  { key: "warung", icon: "🏪", title: "Tambah Toko", desc: "Toko sendiri / rekomendasi" },
  { key: "content", icon: "🎥", title: "Buat Konten", desc: "Video pendek / afiliator" },
];

export default function CreateActionPicker({ onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map(a => (
        <button
          key={a.key}
          onClick={() => onSelect(a.key)}
          className="p-4 rounded-2xl bg-white dark:bg-white/10 shadow hover:scale-105 transition"
        >
          <div className="text-3xl">{a.icon}</div>
          <div className="font-bold mt-2">{a.title}</div>
          <div className="text-xs opacity-70">{a.desc}</div>
        </button>
      ))}
    </div>
  );
}
