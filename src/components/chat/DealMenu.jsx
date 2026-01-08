import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from '../../lib/supabaseClient';
import SlideToUnlock from './SlideToUnlock';

export default function DealMenu({
  onClose,
  onOpenNego,
  onOpenLocation,
  onOpenTime,
  onOpenItem,
  onOpenDelivery,
  postId,
  postInfo,
  currentUserId,
  conversationId, // WAJIB: id conversation chat
}) {
  const [approvedMessages, setApprovedMessages] = useState([]); // pesan deal yang sudah deal_id != null
  const [lastPendingMessage, setLastPendingMessage] = useState(null); // pesan deal terakhir yang masih pending
  const [loading, setLoading] = useState(true);
  const [dealData, setDealData] = useState(null);
  const [allDone, setAllDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMessages() {
      if (!postId || !conversationId) {
        setLoading(false);
        return;
      }

      try {
        const { data: approved, error: approvedError } = await supabase
          .from('messages')
          .select('message_type, deal_id')
          .eq('post_id', postId)
          .neq('message_type', 'text')
          .not('deal_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10);

        if (approvedError) throw approvedError;

        // ----> pastikan hanya ambil deal_id pertama yang valid
        const dealId = approved?.[0]?.deal_id;

        let dealResult = null;

        if (dealId) {
          const { data, error } = await supabase
            .from('deals')
            .select('id,agreed_fee, pickup_location, delivery_location, pickup_datetime, item_description')
            .eq('post_id', postId)
            .eq('id', dealId)
            .maybeSingle();

          if (!error) {
            dealResult = data;
          }
        }

        // simpan ke GLOBAL STATE
        setDealData(dealResult);

        if (dealId) {
          const REQUIRED_STEPS = [
            'deal_ongkos_jastip',
            'deal_lokasi_ketemuan',
            'deal_waktu_ketemuan',
            'deal_lokasi_pengantaran',
            'deal_barang_titipan'
          ];

          // cek message_type yang sudah ada untuk deal_id ini
          const { data: dealSteps, error: stepsError } = await supabase
            .from('messages')
            .select('message_type')
            .eq('deal_id', dealId)
            .in('message_type', REQUIRED_STEPS);

          if (!stepsError) {
            const completedTypes = dealSteps?.map(m => m.message_type) || [];

            // cek apakah semua step sudah terpenuhi
            const allDone = REQUIRED_STEPS.every(type =>
              completedTypes.includes(type)
            );

            // ⬇️ simpan ke state global komponen
            setAllDone(allDone);   

            // kalau lengkap → update status deal menjadi completed
            if (allDone) {
              await supabase
                .from('deals')
                .update({ status: 'completed' })
                .eq('id', dealId);
            }
          }
        }

        const { data: pending, error: pendingError } = await supabase
          .from('posts')
          .select('fee, from_city, to_city, travel_date, item_description')
          .eq('id', postId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingError && pendingError.code !== 'PGRST116')
          throw pendingError;

        setApprovedMessages(approved || []);
        setLastPendingMessage(pending);
        setLoading(false);

      } catch (err) {
        console.error('Error fetching deal messages:', err);
        setLoading(false);
      }
    }

    fetchMessages();
  }, [postId, conversationId]);

  const formatRupiah = (value) => {
    const num = Number(value);
    if (isNaN(num) || value == null) return '-';
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  const isCurrentNegotiation = (type) => {
    return lastPendingMessage?.message_type === type;
  };

  // Ambil nilai dari pesan yang sudah approved (terbaru)
  const getApprovedValue = (type, field, isFee = false) => {
    const msg = approvedMessages.find(m => m.message_type === type);
    if (!msg || msg[field] == null) return null;
    return isFee ? formatRupiah(msg[field]) : msg[field];
  };

  // Apakah jenis deal ini sudah completed?
  const isCompleted = (type) => {
    return approvedMessages.some(m => m.message_type === type);
  };

  const colorMap = {
    deal_ongkos_jastip: 'emerald',
    deal_lokasi_ketemuan: 'blue',
    deal_waktu_ketemuan: 'purple',
    deal_lokasi_pengantaran: 'emerald',
    deal_barang_titipan: 'orange',
  };

  const formattedPickupTime = dealData?.pickup_datetime
  ? new Date(dealData.pickup_datetime).toLocaleString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    })
  : "-";


  const deals = [
    {
      tag: 'deal_ongkos_jastip',
      title: 'Ongkos Jastip',
      desc: !isCompleted('deal_ongkos_jastip')
        ? 'Sepakati biaya jasa titip / belanja'
        : 'Sudah deal',
      ket: !isCompleted('deal_ongkos_jastip')
        ? formatRupiah(lastPendingMessage?.fee)
        : getApprovedValue('deal_ongkos_jastip', 'fee', true) || formatRupiah(dealData.agreed_fee),
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      action: onOpenNego,
      isCompleted: isCompleted('deal_ongkos_jastip'),
    },
    {
      tag: 'deal_lokasi_ketemuan',
      title: 'Lokasi Ketemuan',
      desc: !isCompleted('deal_lokasi_ketemuan')
        ? 'Tentukan tempat serah terima'
        : 'Sudah deal',
      ket: !isCompleted('deal_lokasi_ketemuan')
        ? (lastPendingMessage?.from_city || '-')
        : getApprovedValue('deal_lokasi_ketemuan', 'from_city') || dealData?.pickup_location?.split(",")[2]?.trim() || "-",
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>,
      action: onOpenLocation,
      isCompleted: isCompleted('deal_lokasi_ketemuan'),
    },
    {
      tag: 'deal_waktu_ketemuan',
      title: 'Waktu Ketemuan',
      desc: !isCompleted('deal_waktu_ketemuan')
        ? 'Sepakati jam & hari bertemu'
        : 'Sudah deal',
      ket: !isCompleted('deal_waktu_ketemuan')
        ? (lastPendingMessage?.travel_date || '-')
        : getApprovedValue('deal_waktu_ketemuan', 'travel_date') || formattedPickupTime,
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      action: onOpenTime,
      isCompleted: isCompleted('deal_waktu_ketemuan'),
    },
    {
      tag: 'deal_lokasi_pengantaran',
      title: 'Lokasi Pengantaran',
      desc: !isCompleted('deal_lokasi_pengantaran')
        ? 'Tentukan tempat pengantaran barang'
        : 'Sudah deal',
      ket: !isCompleted('deal_lokasi_pengantaran')
        ? (lastPendingMessage?.to_city || '-')
        : getApprovedValue('deal_lokasi_pengantaran', 'to_city') || dealData?.delivery_location?.split(",")[2]?.trim() || "-",
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>,
      action: onOpenDelivery,
      isCompleted: isCompleted('deal_lokasi_pengantaran'),
    },
    {
      tag: 'deal_barang_titipan',
      title: 'Barang Titipan',
      desc: !isCompleted('deal_barang_titipan')
        ? 'Kirim detail dan foto barang titipan'
        : 'Sudah deal',
      ket: !isCompleted('deal_barang_titipan')
        ? (lastPendingMessage?.item_description || '-')
        : getApprovedValue('deal_barang_titipan', 'item_description') || dealData.item_description,
      icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>,
      action: onOpenItem,
      isCompleted: isCompleted('deal_barang_titipan'),
    },
  ];

  const handleSelect = (dealItem) => {
    if (dealItem.isCompleted) return;
    dealItem.action();
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <>
      <div className="absolute bottom-20 left-4 right-4 bg-base-100 border border-base-300 rounded-2xl shadow-2xl overflow-hidden z-50">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 w-full">
            <div className="avatar flex-shrink-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-emerald-500/20">
                <img
                  src={postInfo?.item_photo || '/default-item.jpg'}
                  alt="Barang"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-base-content/80">
                <span className="font-semibold">{postInfo?.from_city || '-'}</span>
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span className="font-semibold">{postInfo?.to_city || '-'}</span>
              </div>
              <p className="font-semibold text-base opacity-70 mt-1">Pilih Jenis Deal </p>
            </div>
            <div className="badge badge-primary badge-sm font-medium">
              {postInfo?.type === 'titip' ? 'Mau Titip' : 'Bisa Bawa'}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="max-h-86 overflow-y-auto">
          {deals.map((dealItem, i) => {
            const color = colorMap[dealItem.tag];
            return (
              <button
                key={dealItem.tag}
                onClick={() => handleSelect(dealItem)}
                disabled={dealItem.isCompleted}
                className={`w-full text-left px-5 py-4 flex items-center justify-between transition-colors ${
                  i !== 0 ? 'border-t border-base-300/50' : ''
                } ${dealItem.isCompleted ? 'opacity-60 cursor-not-allowed' : 'hover:bg-base-200'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-100 text-${color}-600`}>
                    {dealItem.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-base">{dealItem.title}</div>
                    <div className="text-xs opacity-70">{dealItem.ket}</div>
                    <div className="text-xs opacity-70">{dealItem.desc}</div>
                  </div>
                </div>
                {dealItem.isCompleted && (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-base-200 text-center border-t border-base-300/50">
          {allDone ? (
            <SlideToUnlock
              onComplete={async () => {
                try {
                  console.log("🚀 lanjut transaksi", dealData);

                  const { data: trx, error } = await supabase
                    .from("transactions")
                    .upsert(
                      {
                        deal_id: dealData.id,
                        gross_amount: dealData.agreed_fee,
                        transaction_status: "draft",
                      },
                      {
                        onConflict: "deal_id",
                      }
                    )
                    .select()
                    .single();

                  if (error) throw error;

                  navigate(`/deal?deal=${dealData.id}&trx=${trx.id}`);
                } catch (err) {
                  console.error("Gagal membuat / update transaksi:", err.message);
                }
              }}
            />
          ) : (
            <button
              onClick={onClose}
              className="text-sm font-medium text-base-content/70 hover:text-base-content"
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
    </>
  );
}