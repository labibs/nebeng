import { useState } from 'react';
import NegoModal from './NegoModal';
import LocationModal from './LocationModal';
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix icon marker biar muncul (penting!)
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function DealCard({ msg, isMine, avatar, postInfo, currentUserId, onOpenNego, onSendNego, onInsertDeal, onUpdateDealLocation }) {
  const [negoPrice, setNegoPrice] = useState('');
  const [showNegoModal, setShowNegoModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Tentukan jenis deal
  const dealType = msg.message_type || (msg.content.includes('[deal_ongkos_jastip]') ? 'deal_ongkos_jastip' : msg.content.includes('[deal_lokasi_ketemuan]') ? 'deal_lokasi_ketemuan' : null);

  // Ekstrak data berdasarkan jenis deal
  let extractedData = {};
  if (dealType === 'deal_ongkos_jastip') {
    const ongkosMatch = msg.content.match(/💰[^0-9]*([0-9.,]+)/);
    const ongkosText = ongkosMatch ? ongkosMatch[1].replace(/\./g, '') : null;
    extractedData.ongkos = ongkosText ? parseInt(ongkosText.replace(/,/g, ''), 10) : null;
  } else if (dealType === 'deal_lokasi_ketemuan') {
    const locationMatch = msg.content.match(/📍 Lokasi ketemuan: ([^\n]+)/);
    const addressMatch = msg.content.match(/📝 Alamat: ([^\n]+)/);
    const coordMatch = msg.content.match(/🗺️ Koordinat: ([^,]+), ([^\n]+)/);
    extractedData.locationName = locationMatch ? locationMatch[1].trim() : "Lokasi Terpilih";
    extractedData.address = addressMatch ? addressMatch[1].trim() : "Alamat tidak tersedia";
    extractedData.lat = coordMatch ? parseFloat(coordMatch[1].trim()) : null;
    extractedData.lng = coordMatch ? parseFloat(coordMatch[2].trim()) : null;
  }

  const handleQuickReply = (text) => {
    if (onSendNego) {
      onSendNego(text);
    } else {
      // Fallback sementara
      navigator.clipboard.writeText(text);
      alert('Teks deal disalin ke clipboard!\n\n' + text);
    }
  };

  return (
    <>
      <div className={`chat ${isMine ? 'chat-end' : 'chat-start'}`}>
        <div className="chat-image avatar">
          <div className="w-10 rounded-full">
            <img src={avatar} alt="avatar" />
          </div>
        </div>

        <div className="chat-header">
          <time className="text-xs opacity-70">
            {new Date(msg.created_at).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </div>

        <div
          className={`
            relative max-w-md px-5 py-4 rounded-2xl shadow-lg overflow-hidden border
            ${isMine
              ? (dealType === 'deal_ongkos_jastip'
                  ? 'bg-gradient-to-r from-[#81c784]/10 to-[#66bb6a]/10 border-emerald-300 rounded-br-none'
                  : 'bg-gradient-to-r from-[#64b5f6]/10 to-[#42a5f5]/10 border-blue-300 rounded-br-none')
              : (dealType === 'deal_ongkos_jastip'
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 rounded-bl-none'
                  : 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 rounded-bl-none')
            }
          `}
        >
          {/* Header Card */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              dealType === 'deal_ongkos_jastip' ? 'bg-emerald-500' : 'bg-blue-500'
            }`}>
              {dealType === 'deal_ongkos_jastip' ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
            <div>
              <div className={`font-bold ${
                dealType === 'deal_ongkos_jastip' ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'
              }`}>
                {dealType === 'deal_ongkos_jastip' ? 'Deal Ongkos Jastip' : 'Deal Lokasi Ketemuan'}
              </div>
              <div className="text-xs opacity-70">
                {isMine ? 'Menunggu konfirmasi dari lawan...' : 'Pilih aksi'}
              </div>
            </div>
          </div>

          {/* Isi Pesan */}
          {dealType === 'deal_ongkos_jastip' ? (
            <div className="mb-5 whitespace-pre-wrap text-base-content/90 text-sm leading-relaxed">
              💰 Ongkos awal jastip : Rp {postInfo?.fee ? parseInt(postInfo.fee).toLocaleString('id-ID') : '-'} <br />
              {msg.content.replace(/^\[[^\]]+\]\s*/, '').trim()}
            </div>
          ) : dealType === 'deal_lokasi_ketemuan' && extractedData.lat && extractedData.lng ? (
            <div className="mb-5">
              <div className="whitespace-pre-wrap text-base-content/90 text-sm leading-relaxed mb-3">
                {msg.content.replace(/^\[[^\]]+\]\s*/, '').trim()}
              </div>
              {/* Mini Map */}
              <div className="relative w-full h-24 rounded-xl overflow-hidden border border-base-300 cursor-not-allowed">
                <div className="absolute inset-0 z-10 pointer-events-none bg-transparent"></div>
                <MapContainer
                  center={[extractedData.lat, extractedData.lng]}
                  zoom={15}
                  scrollWheelZoom={false}
                  zoomControl={false}
                  dragging={false}
                  touchZoom={false}
                  doubleClickZoom={false}
                  style={{ height: "100%", width: "100%" }}
                  className="pointer-events-none"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[extractedData.lat, extractedData.lng]} />
                </MapContainer>
              </div>
            </div>
          ) : (
            <div className="mb-5 whitespace-pre-wrap text-base-content/90 text-sm leading-relaxed">
              {msg.content.replace(/^\[[^\]]+\]\s*/, '').trim()}
            </div>
          )}

          {/* Tombol hanya muncul jika pesan dari lawan */}
          {!isMine && (
            <div className="flex gap-3">
              {dealType === 'deal_ongkos_jastip' ? (
                <>
                  <button
                    onClick={() => {
                      const replyText = extractedData.ongkos
                        ? `Deal! Ongkos jastip Rp${extractedData.ongkos.toLocaleString('id-ID')} ✅\nTerima kasih kak, kapan mau ketemuan?`
                        : `Deal! Ongkos jastip sesuai kesepakatan ✅\nKapan mau ketemuan ya kak?`;
                      handleQuickReply(replyText);
                      if (onInsertDeal && extractedData.ongkos) {
                        onInsertDeal(msg.post_id, extractedData.ongkos);
                      }
                    }}
                    className="flex-1 btn btn-success btn-sm rounded-xl text-white font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Deal
                  </button>

                  <button
                    onClick={() => {
                      const defaultPrice = extractedData.ongkos ? Math.floor(extractedData.ongkos * 0.9) : 30000;
                      setNegoPrice(defaultPrice.toString());
                      setShowNegoModal(true);
                    }}
                    className="flex-1 btn btn-outline btn-warning btn-sm rounded-xl font-medium hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Nego
                  </button>
                </>
              ) : dealType === 'deal_lokasi_ketemuan' ? (
                <>
                  <button
                    onClick={() => {
                      const replyText = `Deal! Lokasi ketemuan di ${extractedData.locationName} ✅\nTerima kasih kak, kapan jam berapa?`;
                      handleQuickReply(replyText);
                      if (onUpdateDealLocation && extractedData.lat && extractedData.lng) {
                        onUpdateDealLocation(msg.post_id, {
                          lat: extractedData.lat,
                          lng: extractedData.lng,
                          name: extractedData.locationName,
                          address: extractedData.address
                        });
                      }
                    }}
                    className="flex-1 btn btn-success btn-sm rounded-xl text-white font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Deal
                  </button>

                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="flex-1 btn btn-outline btn-info btn-sm rounded-xl font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Revisi
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* Tail lancip */}
          <div className={`absolute w-3 h-5 top-6 ${isMine ? 'right-0 translate-x-full' : 'left-0 -translate-x-full'}`}>
            <svg viewBox="0 0 8 16" className="w-full h-full drop-shadow-md">
              <path
                d="M0,0 Q8,8 0,16 L0,0"
                fill={isMine
                  ? (dealType === 'deal_ongkos_jastip' ? '#66bb6a' : '#42a5f5')
                  : (dealType === 'deal_ongkos_jastip' ? '#dcfce7' : '#dbeafe')
                }
                className={dealType === 'deal_ongkos_jastip' ? "dark:fill-emerald-900/50" : "dark:fill-blue-900/50"}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Modal Nego */}
      <NegoModal
        isOpen={showNegoModal}
        onClose={() => setShowNegoModal(false)}
        onSend={onSendNego || handleQuickReply}
        initialPrice={negoPrice}
      />

      {/* Modal Location */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSend={onSendNego || handleQuickReply}
      />
    </>
  );
}