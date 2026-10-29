import { X, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GoogleMapsEmbedViewer({
  open,
  setOpen,
  latitude,
  longitude,
  address,
  title = "Lokasi Outlet",
}) {
  const embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg rounded-[32px] bg-white overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-slate-50 bg-white/80 backdrop-blur-md z-10">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{title}</h3>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Detail Lokasi
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-90 transition-transform"
              >
                <X size={18} />
              </button>
            </div>

            {/* MAP EMBED */}
            <div className="h-[45vh] w-full bg-slate-50 border-y">
              {!latitude ? (
                <div className="h-full flex items-center justify-center text-sm opacity-60">
                  Lokasi belum tersedia
                </div>
              ) : (
                <iframe
                  title="google-map"
                  src={embedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>

            {/* Info Footer */}
            <div className="p-6 bg-slate-50/50 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#4e73df] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                  <MapPin size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-[14px] text-slate-900">
                    Alamat Lengkap
                  </h4>
                  <p className="text-[12px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {address || `${latitude}, ${longitude}`}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
