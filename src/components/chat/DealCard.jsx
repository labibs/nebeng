import { useState } from 'react';
import NegoModal from './NegoModal';
import LocationModal from './LocationModal';
import TimeModal from './TimeModal';
import DeliveryModal from './DeliveryModal';
import ItemModal from './ItemModal';
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

// Helper function to convert Indonesian date format to ISO datetime
function convertIndonesianDateTimeToISO(dateStr, timeStr) {
  // Parse Indonesian date format: "Kamis, 8 Januari 2026"
  const dateMatch = dateStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!dateMatch) return null;

  const day = parseInt(dateMatch[1], 10);
  const monthName = dateMatch[2].toLowerCase();
  const year = parseInt(dateMatch[3], 10);

  // Convert month name to number
  const monthMap = {
    'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6,
    'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12
  };

  const month = monthMap[monthName];
  if (!month) return null;

  // Parse time format: "07.53" or "07:53"
  const timeMatch = timeStr.match(/(\d{1,2})[.:](\d{2})/);
  if (!timeMatch) return null;

  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);

  // Create ISO datetime string
  const date = new Date(year, month - 1, day, hour, minute, 0);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export default function DealCard({ msg, isMine, avatar, postInfo, currentUserId, onOpenNego, onSendNego, onInsertDeal, onUpdateDealLocation, onUpdateDealTime, onUpdateDealDelivery, onUpdateDealItem }) {
  const [negoPrice, setNegoPrice] = useState('');
  const [showNegoModal, setShowNegoModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [initialItemData, setInitialItemData] = useState({});
  const [mapInteractive, setMapInteractive] = useState(false);

  // Helper untuk menghilangkan koordinat (lat,lng, ) dari tampilan
  const stripCoordinates = (text) => {
    if (!text) return '';
    return text.replace(/[-+]?\d*\.\d+,\s*[-+]?\d*\.\d+,\s*/g, '');
  };

  // Tentukan jenis deal
  const dealType = msg.message_type || (msg.content.includes('[deal_ongkos_jastip]') ? 'deal_ongkos_jastip' : msg.content.includes('[deal_lokasi_ketemuan]') ? 'deal_lokasi_ketemuan' : msg.content.includes('[deal_waktu_ketemuan]') ? 'deal_waktu_ketemuan' : msg.content.includes('[deal_lokasi_pengantaran]') ? 'deal_lokasi_pengantaran' : msg.content.includes('[deal_barang_titipan]') ? 'deal_barang_titipan' : null);

  console.log('DealCard - Message content:', msg.content);
  console.log('DealCard - Detected dealType:', dealType);

  // Ekstrak data berdasarkan jenis deal
  let extractedData = {};
  if (dealType === 'deal_ongkos_jastip') {
    const ongkosMatch = msg.content.match(/💰[^0-9]*([0-9.,]+)/);
    const ongkosText = ongkosMatch ? ongkosMatch[1].replace(/\./g, '') : null;
    extractedData.ongkos = ongkosText ? parseInt(ongkosText.replace(/,/g, ''), 10) : null;
  } else if (dealType === 'deal_lokasi_ketemuan' || dealType === 'deal_lokasi_pengantaran') {

    const locationMatch = msg.content.match(/📍\s*Lokasi[^:]*:\s*(.+)/);
    const addressMatch = msg.content.match(/📝\s*Alamat:\s*(.+)/);

    // Tangkap koordinat aman
    const coordMatch = msg.content.match(/Koordinat:\s*([-0-9.]+),\s*([-0-9.]+)/);

    // Hapus baris koordinat dari pesan
    const cleanedMessage = msg.content
      .replace(/^\[[^\]]+\]\s*/, '')          // hapus [deal_xxx]
      .replace(/🗺️\s*Koordinat:[^\n]+/g, '')  // hapus baris koordinat
      .trim();

    extractedData.cleanedMessage = cleanedMessage;

    extractedData.locationName = locationMatch ? locationMatch[1].trim() : "Lokasi Terpilih";
    extractedData.address = addressMatch ? addressMatch[1].trim() : "Alamat tidak tersedia";

    extractedData.lat = coordMatch ? parseFloat(coordMatch[1]) : null;
    extractedData.lng = coordMatch ? parseFloat(coordMatch[2]) : null;

    extractedData.gmapsUrl =
      extractedData.lat && extractedData.lng
        ? `https://www.google.com/maps/search/?api=1&query=${extractedData.lat},${extractedData.lng}`
        : null;
  } else if (dealType === 'deal_waktu_ketemuan') {
    const timeMatch = msg.content.match(/🕐 Waktu ketemuan: ([^\n]+)/);
    const notesMatch = msg.content.match(/📝 Catatan: ([^\n]+)/);
    extractedData.meetingTime = timeMatch ? timeMatch[1].trim() : "Waktu tidak tersedia";
    extractedData.notes = notesMatch ? notesMatch[1].trim() : "Tidak ada catatan";
  } else if (dealType === 'deal_barang_titipan') {
    // More robust parsing
    const lines = msg.content.split('\n');
    let itemDetail = "Detail tidak tersedia";
    let weight = "Ukuran & berat tidak tersedia";
    let photos = [];
    let ongkos = null;

    lines.forEach(line => {
      if (line.includes('📦 Detail barang:')) {
        itemDetail = line.split('📦 Detail barang:')[1]?.trim() || itemDetail;
      } else if (line.includes('⚖️ Ukuran & berat:')) {
        weight = line.split('⚖️ Ukuran & berat:')[1]?.trim() || weight;
      } else if (line.includes('📸 Foto barang:')) {
        const photoStr = line.split('📸 Foto barang:')[1]?.trim();
        if (photoStr) {
          photos = photoStr.split(',').map(url => url.trim()).filter(url => url && url.startsWith('http'));
        }
      } else if (line.includes('💰 Penawaran Ongkos: Rp')) {
        const ongkosMatch = line.match(/Rp ([0-9.,]+)/);
        if (ongkosMatch) {
          ongkos = parseInt(ongkosMatch[1].replace(/\./g, ''), 10);
        }
      }
    });

    extractedData.itemDetail = itemDetail;
    extractedData.weight = weight;
    extractedData.photos = photos;
    extractedData.ongkos = ongkos;

    console.log('Parsed deal barang titipan:', { itemDetail, weight, photos });
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

  const created = new Date(msg.created_at);
  const today = new Date();

  // cek apakah di hari yang sama
  const isToday =
    created.getDate() === today.getDate() &&
    created.getMonth() === today.getMonth() &&
    created.getFullYear() === today.getFullYear();

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
            relative max-w-[85vw] md:max-w-md px-5 py-4 rounded-2xl shadow-lg overflow-hidden border
            ${isMine
              ? (dealType === 'deal_ongkos_jastip'
                ? 'bg-linear-to-r from-[#81c784]/10 to-[#66bb6a]/10 border-emerald-300 rounded-br-none'
                : dealType === 'deal_lokasi_ketemuan'
                  ? 'bg-linear-to-r from-[#64b5f6]/10 to-[#42a5f5]/10 border-blue-300 rounded-br-none'
                  : dealType === 'deal_waktu_ketemuan'
                    ? 'bg-linear-to-r from-[#ba68c8]/10 to-[#9c27b0]/10 border-purple-300 rounded-br-none'
                    : dealType === 'deal_lokasi_pengantaran'
                      ? 'bg-linear-to-r from-[#4dd0e1]/10 to-[#00bcd4]/10 border-cyan-300 rounded-br-none'
                      : 'bg-linear-to-r from-[#fb8c00]/10 to-[#f57c00]/10 border-orange-300 rounded-br-none')
              : (dealType === 'deal_ongkos_jastip'
                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 rounded-bl-none'
                : dealType === 'deal_lokasi_ketemuan'
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 rounded-bl-none'
                  : dealType === 'deal_waktu_ketemuan'
                    ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/30 rounded-bl-none'
                    : dealType === 'deal_lokasi_pengantaran'
                      ? 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/30 rounded-bl-none'
                      : 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 rounded-bl-none')
            }
          `}
        >
          {/* Header Card */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${dealType === 'deal_ongkos_jastip' ? 'bg-emerald-500' : dealType === 'deal_lokasi_ketemuan' ? 'bg-blue-500' : dealType === 'deal_waktu_ketemuan' ? 'bg-purple-500' : dealType === 'deal_lokasi_pengantaran' ? 'bg-cyan-500' : 'bg-orange-500'
              }`}>
              {dealType === 'deal_ongkos_jastip' ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : dealType === 'deal_lokasi_ketemuan' ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : dealType === 'deal_waktu_ketemuan' ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : dealType === 'deal_lokasi_pengantaran' ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
            </div>
            <div>
              <div className={`font-bold ${dealType === 'deal_ongkos_jastip' ? 'text-emerald-700 dark:text-emerald-300' : dealType === 'deal_lokasi_ketemuan' ? 'text-blue-700 dark:text-blue-300' : dealType === 'deal_waktu_ketemuan' ? 'text-purple-700 dark:text-purple-300' : dealType === 'deal_lokasi_pengantaran' ? 'text-cyan-700 dark:text-cyan-300' : 'text-orange-700 dark:text-orange-300'
                }`}>
                {dealType === 'deal_ongkos_jastip' ? 'Deal Ongkos Jastip' : dealType === 'deal_lokasi_ketemuan' ? 'Deal Lokasi Ketemuan' : dealType === 'deal_waktu_ketemuan' ? 'Deal Waktu Ketemuan' : dealType === 'deal_lokasi_pengantaran' ? 'Deal Lokasi Pengantaran' : 'Deal Barang Titipan'}
              </div>
              <div className="text-xs opacity-70">
                {msg.deal_id === null ? isMine ? 'Menunggu konfirmasi dari lawan...' : 'Pilih aksi' : 'Sudah deal'}
              </div>
            </div>
          </div>

          {/* Isi Pesan */}
          {dealType === 'deal_ongkos_jastip' ? (
            <div className="mb-5 whitespace-pre-wrap text-base-content/90 text-sm leading-relaxed">
              💰 Ongkos awal jastip : Rp {postInfo?.fee ? parseInt(postInfo.fee).toLocaleString('id-ID') : '-'} <br />
              {stripCoordinates(msg.content.replace(/^\[[^\]]+\]\s*/, '').trim())}
            </div>
          ) : dealType === 'deal_lokasi_ketemuan' && extractedData.lat && extractedData.lng && extractedData.cleanedMessage ? (
            <div className="mb-5">
              <div className="whitespace-pre-wrap text-sm leading-relaxed mb-3">
                {stripCoordinates(extractedData.cleanedMessage)}

                {extractedData.gmapsUrl && (
                  <a
                    href={extractedData.gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#81c784] underline font-medium mt-1 inline-block"
                  >
                    Lihat di Google Maps
                  </a>
                )}
              </div>

              {/* Mini Map */}
              <div className="relative w-full h-24 rounded-xl overflow-hidden border border-base-300">

                <MapContainer
                  center={[extractedData.lat, extractedData.lng]}
                  zoom={15}
                  scrollWheelZoom={mapInteractive}
                  zoomControl={mapInteractive}
                  dragging={mapInteractive}
                  touchZoom={mapInteractive}
                  doubleClickZoom={mapInteractive}
                  keyboard={mapInteractive}
                  boxZoom={mapInteractive}
                  className="h-full w-full z-0"
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[extractedData.lat, extractedData.lng]} />
                </MapContainer>

                {/* Overlay klik untuk mengaktifkan zoom */}
                {!mapInteractive && (
                  <button
                    onClick={() => setMapInteractive(true)}
                    className="absolute inset-0 z-0 flex items-center justify-center
                              bg-base-100/10 backdrop-blur-[1px] cursor-zoom-in"
                  >
                    <span className="px-3 py-1 text-xs rounded-lg bg-base-200/80">
                      Klik untuk zoom & geser
                    </span>
                  </button>
                )}

                {/* Tombol keluar zoom */}
                {mapInteractive && (
                  <button
                    onClick={() => setMapInteractive(false)}
                    className="absolute top-2 right-2 z-0 px-2 py-1 text-xs rounded-lg
                              bg-base-200/90 border border-base-300"
                  >
                    Kunci Map
                  </button>
                )}

              </div>
            </div>
          ) : dealType === 'deal_lokasi_pengantaran' && extractedData.lat && extractedData.lng ? (
            <div className="mb-5">
              <div className="whitespace-pre-wrap text-sm leading-relaxed mb-3">
                {stripCoordinates(extractedData.cleanedMessage)}

                {extractedData.gmapsUrl && (
                  <a
                    href={extractedData.gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#81c784] underline font-medium mt-1 inline-block"
                  >
                    Lihat di Google Maps
                  </a>
                )}
              </div>
              {/* Mini Map */}
              <div className="relative w-full h-24 rounded-xl overflow-hidden border border-base-300">

                <MapContainer
                  center={[extractedData.lat, extractedData.lng]}
                  zoom={15}
                  scrollWheelZoom={mapInteractive}
                  zoomControl={mapInteractive}
                  dragging={mapInteractive}
                  touchZoom={mapInteractive}
                  doubleClickZoom={mapInteractive}
                  keyboard={mapInteractive}
                  boxZoom={mapInteractive}
                  className="h-full w-full z-0"
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[extractedData.lat, extractedData.lng]} />
                </MapContainer>

                {/* Overlay klik untuk mengaktifkan zoom */}
                {!mapInteractive && (
                  <button
                    onClick={() => setMapInteractive(true)}
                    className="absolute inset-0 z-0 flex items-center justify-center
                              bg-base-100/10 backdrop-blur-[1px] cursor-zoom-in"
                  >
                    <span className="px-3 py-1 text-xs rounded-lg bg-base-200/80">
                      Klik untuk zoom & geser
                    </span>
                  </button>
                )}

                {/* Tombol keluar zoom */}
                {mapInteractive && (
                  <button
                    onClick={() => setMapInteractive(false)}
                    className="absolute top-2 right-2 z-0 px-2 py-1 text-xs rounded-lg
                              bg-base-200/90 border border-base-300"
                  >
                    Kunci Map
                  </button>
                )}

              </div>
            </div>
          ) : dealType === 'deal_waktu_ketemuan' ? (
            <div className="mb-5 whitespace-pre-wrap text-base-content/90 text-sm leading-relaxed">
              {stripCoordinates(msg.content.replace(/^\[[^\]]+\]\s*/, '').trim())}
            </div>
          ) : dealType === 'deal_barang_titipan' ? (
            <div className="mb-5">
              <div className="whitespace-pre-wrap text-base-content/90 text-sm leading-relaxed mb-3">
                {stripCoordinates(msg.content
                  .replace(/^\[[^\]]+\]\s*/, '') // Remove tag
                  .split('\n')
                  .filter(line => !line.startsWith('📸 Foto barang:') && !line.startsWith('💰 Penawaran Ongkos:')) // Remove photo URLs line and fee
                  .join('\n')
                  .trim())}
              </div>
              {extractedData.ongkos !== null && (
                <div className="mb-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  💰 Penawaran Ongkos: Rp {extractedData.ongkos.toLocaleString('id-ID')}
                </div>
              )}
              {/* Photo Gallery */}
              {extractedData.photos && extractedData.photos.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {extractedData.photos.map((photoUrl, index) => (
                    <img
                      key={index}
                      src={photoUrl}
                      alt={`Barang ${index + 1}`}
                      className="w-full max-h-24 object-cover rounded-lg border border-base-300 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(photoUrl, '_blank')}
                      onError={(e) => console.log('Image failed to load:', photoUrl)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mb-5 whitespace-pre-wrap text-base-content/90 text-sm leading-relaxed">
              {stripCoordinates(msg.content.replace(/^\[[^\]]+\]\s*/, '').trim())}
            </div>
          )}

          {/* Tombol hanya muncul jika pesan dari lawan */}
          {!isMine && (
            <div className="flex gap-3">
              {dealType === 'deal_ongkos_jastip' && msg.deal_id == null ? (
                <>
                  <button
                    onClick={() => {
                      const replyText = extractedData.ongkos
                        ? `Deal! Ongkos jastip Rp${extractedData.ongkos.toLocaleString('id-ID')} ✅`
                        : `Deal! Ongkos jastip sesuai kesepakatan ✅`;
                      handleQuickReply(replyText);
                      if (onInsertDeal && extractedData.ongkos) {
                        onInsertDeal(msg.post.id, extractedData.ongkos, msg.id);
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
              ) : dealType === 'deal_lokasi_ketemuan' && msg.deal_id == null ? (
                <>
                  <button
                    onClick={() => {
                      const replyText = `Deal! Lokasi ketemuan di ${extractedData.locationName} ✅\nTerima kasih kak`;
                      handleQuickReply(replyText);
                      if (onUpdateDealLocation && extractedData.lat && extractedData.lng) {
                        onUpdateDealLocation(msg.post.id, {
                          lat: extractedData.lat,
                          lng: extractedData.lng,
                          name: extractedData.locationName,
                          address: extractedData.address
                        }, msg.id);
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
              ) : dealType === 'deal_lokasi_pengantaran' && msg.deal_id == null ? (
                <>
                  <button
                    onClick={() => {
                      const replyText = `Deal! Lokasi pengantaran di ${extractedData.locationName} ✅\nTerima kasih kak`;
                      handleQuickReply(replyText);
                      if (onUpdateDealDelivery && extractedData.lat && extractedData.lng) {
                        onUpdateDealDelivery(msg.post.id, {
                          lat: extractedData.lat,
                          lng: extractedData.lng,
                          name: extractedData.locationName,
                          address: extractedData.address
                        }, msg.id);
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
                    onClick={() => setShowDeliveryModal(true)}
                    className="flex-1 btn btn-outline btn-info btn-sm rounded-xl font-medium hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Revisi
                  </button>
                </>
              ) : dealType === 'deal_waktu_ketemuan' && msg.deal_id == null ? (
                <>
                  <button
                    onClick={() => {
                      const replyText = `Deal! Waktu ketemuan ${extractedData.meetingTime} ✅\nTerima kasih kak!`;
                      handleQuickReply(replyText);
                      if (onUpdateDealTime && msg.post.id) {
                        // Parse meeting time to get date and time, then convert to ISO format
                        const timeMatch = extractedData.meetingTime.match(/(.+), (.+)/);
                        if (timeMatch) {
                          const dateStr = timeMatch[1].trim();
                          const timeStr = timeMatch[2].trim();

                          // Convert Indonesian date format to ISO datetime
                          const dateTimeISO = convertIndonesianDateTimeToISO(dateStr, timeStr);

                          onUpdateDealTime(msg.post.id, {
                            datetime: dateTimeISO,
                            notes: extractedData.notes
                          }, msg.id);
                        }
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
                    onClick={() => setShowTimeModal(true)}
                    className="flex-1 btn btn-outline btn-warning btn-sm rounded-xl font-medium hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Ubah
                  </button>
                </>
              ) : dealType === 'deal_barang_titipan' && msg.deal_id == null ? (
                <>
                  <button
                    onClick={() => {
                      const replyText = `Deal! Barang titipan ${extractedData.itemDetail} ✅\nTerima kasih kak!`;
                      handleQuickReply(replyText);
                      if (onUpdateDealItem && msg.post.id) {
                        onUpdateDealItem(msg.post.id, {
                          description: extractedData.itemDetail || '',
                          photos: extractedData.photos || []
                        }, msg.id);
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
                      setInitialItemData({
                        description: extractedData.itemDetail || '',
                        weight: extractedData.weight || '',
                        photos: extractedData.photos || []
                      });
                      setShowItemModal(true);
                    }}
                    className="flex-1 btn btn-outline btn-warning btn-sm rounded-xl font-medium hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-all"
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
                  ? (dealType === 'deal_ongkos_jastip' ? '#66bb6a' : dealType === 'deal_lokasi_ketemuan' ? '#42a5f5' : dealType === 'deal_waktu_ketemuan' ? '#9c27b0' : dealType === 'deal_lokasi_pengantaran' ? '#00bcd4' : '#f57c00')
                  : (dealType === 'deal_ongkos_jastip' ? '#dcfce7' : dealType === 'deal_lokasi_ketemuan' ? '#dbeafe' : dealType === 'deal_waktu_ketemuan' ? '#f3e5f5' : dealType === 'deal_lokasi_pengantaran' ? '#e0f7fa' : '#fff3e0')
                }
                className={dealType === 'deal_ongkos_jastip' ? "dark:fill-emerald-900/50" : dealType === 'deal_lokasi_ketemuan' ? "dark:fill-blue-900/50" : dealType === 'deal_waktu_ketemuan' ? "dark:fill-purple-900/50" : dealType === 'deal_lokasi_pengantaran' ? "dark:fill-cyan-900/50" : "dark:fill-orange-900/50"}
              />
            </svg>
          </div>
        </div>
        {isMine && (
          <div className={`chat-footer text-xs mt-0 ${msg.is_read ? 'text-blue-500' : 'opacity-70'}`}>
            {msg.is_read ? 'Terbaca ✓✓' : 'Terkirim ✓'}
          </div>
        )}
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

      {/* Modal Time */}
      <TimeModal
        isOpen={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        onSend={onSendNego || handleQuickReply}
      />

      {/* Modal Delivery */}
      <DeliveryModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        onSend={onSendNego || handleQuickReply}
      />

      {/* Modal Item */}
      <ItemModal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        onSend={onSendNego || handleQuickReply}
        initialData={initialItemData}
      />
    </>
  );
}