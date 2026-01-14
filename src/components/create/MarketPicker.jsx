import { useState } from "react"
import { ArrowLeft, Search } from "lucide-react"
import MarketPage from "../../pages/Market"

export default function MarketPicker({ label, value, onSelect }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const mockMarket = [
    { id: 1, name: "Nasi Padang Sederhana", desc: "Masakan Minang" },
    { id: 2, name: "Kopi Literan Janji Jiwa" },
    { id: 3, name: "Ayam Geprek Bensu" },
    { id: 4, name: "Martabak Manis" },
    ]

  const filtered = mockMarket.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
      {/* TRIGGER */}
      <div
        onClick={() => setOpen(true)}
        className="p-4 rounded-b-2xl border-none cursor-pointer bg-white/70 dark:bg-white/5"
      >
        <p className="text-xs opacity-60">{label}</p>
        <p className="font-medium text-sm">
          {value || "Atau liat barang di Market sapa tau ada yang suka"}
        </p>
      </div>

      {/* SLIDE PAGE */}
      <div
        className={`
          fixed inset-0 z-[9999]
          bg-gradient-to-br from-green-100 to-emerald-200 dark:from-slate-900 dark:to-slate-800
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0 " : "translate-x-full"}
        `}
      >
        <div className="fixed inset-0 flex flex-col">
          {/* HEADER FIXED */}
          <div className="shrink-0">
            <div className="pointer-events-auto flex items-start gap-3 mb-2 pt-6 px-4 pb-2">
              <button
                onClick={() => setOpen(false)}
                className="bg-white rounded-full p-3 shadow-lg text-black"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="flex flex-col">
                <h3 className="text-base font-semibold leading-tight">
                  Silahkan Dipilih
                </h3>
                <p className="text-xs opacity-70">
                 Lihat & Cari kamu sukanya yang mana ?.
                </p>
              </div>
            </div>
          </div>
          {/* <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari barang / outlet..."
              className="w-full pl-10 pr-4 py-3 rounded-full
                         bg-white shadow
                         text-black focus:outline-none"
            />
          </div> */}
        

        {/* <div className="pt-24 px-4 space-y-2 pb-10">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item)
                setOpen(false)
              }}
              className="w-full text-left p-4 rounded-2xl
                         bg-white dark:bg-white/5
                         border hover:bg-emerald-50 transition"
            >
              <p className="font-semibold text-sm">{item.name}</p>
              {item.desc && (
                <p className="text-xs opacity-60 mt-1">{item.desc}</p>
              )}
            </button>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-sm opacity-50 mt-10">
              Tidak ada hasil
            </p>
          )}
        </div> */}
        {/* CONTENT SCROLL */}
          <div className="flex-1 overflow-y-auto">
            <MarketPage />
          </div>
        </div>
      </div>
    </>
  )
}
