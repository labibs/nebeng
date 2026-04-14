import { ArrowLeft, MapPin } from "lucide-react";

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
    <div
      className={`
        fixed inset-0 z-[11000]
        bg-gradient-to-br from-green-100 to-emerald-200
        dark:from-slate-900 dark:to-slate-800
        transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "translate-x-full"}
      `}
    >
      <div className="h-full flex flex-col pt-12 pb-20">
        {/* HEADER */}
        <div className="shrink-0">
          <div className="flex items-start gap-3 mb-2 px-4 pb-2">
            <button
              onClick={() => setOpen(false)}
              className="bg-white rounded-full p-3 shadow-lg text-black active:scale-95 transition-transform"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex flex-col">
              <h3 className="text-base font-semibold leading-tight">{title}</h3>

              <p className="text-xs opacity-70">
                {address || "Lokasi pada peta"}
              </p>
            </div>
          </div>
        </div>

        {/* MAP EMBED */}
        <div className="flex-1 bg-white border-y">
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

        {/* FOOTER INFO */}
        <div className="shrink-0 p-3 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="opacity-70 text-[#4e73df]" />

            <span className="opacity-80 font-mono text-xs">
              {latitude}, {longitude}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
