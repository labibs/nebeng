export default function DealMenu({ onClose, onSelectDeal, onOpenNego }) {
  const deals = [
    {
      tag: 'deal_ongkos_jastip',
      title: 'Ongkos Jastip',
      desc: 'Sepakati biaya jasa titip / belanja',
      icon: (
        <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: () => onOpenNego(),
    },
    {
      tag: 'deal_lokasi_ketemuan',
      title: 'Lokasi Ketemuan',
      desc: 'Tentukan tempat serah terima',
      icon: (
        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      template: '📍 Lokasi ketemuan: \n🕐 Jam ketemuan: \n💰 Ongkos tetap: \n📝 Catatan lokasi: ',
    },
    {
      tag: 'deal_waktu_ketemuan',
      title: 'Waktu Ketemuan',
      desc: 'Sepakati jam & hari bertemu',
      icon: (
        <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      template: '🕐 Jam ketemuan: \n📍 Lokasi: \n💰 Ongkos final: \n📝 Konfirmasi jadwal: ',
    },
    {
      tag: 'deal_barang_titipan',
      title: 'Barang Titipan',
      desc: 'Konfirmasi detail barang yang dititipkan',
      icon: (
        <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      template: '📦 Detail barang: \n⚖️ Ukuran & berat: \n💰 Ongkos final: \n📝 Lampirkan foto/detail jika ada',
    },
  ];

  const handleSelect = (deal) => {
    if (deal.action) {
      deal.action();
    } else {
      onSelectDeal(deal.tag, deal.title, deal.template);
    }
  };

  return (
    <>
      <div className="absolute bottom-20 left-4 right-4 bg-base-100 border border-base-300 rounded-2xl shadow-2xl overflow-hidden z-50">
        <div className="p-4 border-b border-base-300 bg-base-200/50">
          <h3 className="font-bold text-lg text-center">Pilih Jenis Deal</h3>
          <p className="text-xs text-center opacity-70 mt-1">Tag otomatis ditambahkan saat kirim</p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {deals.map((deal, i) => (
            <button
              key={i}
              onClick={() => handleSelect(deal)}
              className={`w-full text-left px-5 py-4 hover:bg-base-200 transition-colors flex items-center gap-4 ${
                i !== 0 ? 'border-t border-base-300/50' : ''
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                deal.tag === 'deal_ongkos_jastip' ? 'bg-emerald-100' :
                deal.tag === 'deal_lokasi_ketemuan' ? 'bg-blue-100' :
                deal.tag === 'deal_waktu_ketemuan' ? 'bg-purple-100' :
                'bg-orange-100'
              }`}>
                {deal.icon}
              </div>
              <div>
                <div className="font-semibold text-base">{deal.title}</div>
                <div className="text-xs opacity-70">{deal.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 bg-base-200 text-center border-t border-base-300/50">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-base-content/70 hover:text-base-content"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
    </>
  );
}