import { Compass, MoveRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MarketPromoBanner() {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,_#1cb5c3_0%,_#2fd3b7_58%,_#bff5ef_100%)] p-5 text-white shadow-[0_24px_50px_rgba(31,183,194,0.28)]">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/18 blur-2xl" />
      <div className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
        <Compass size={22} />
      </div>

      <div className="relative max-w-[72%]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/75">
          Smart nitip flow
        </p>
        <h3 className="mt-2 text-2xl font-semibold leading-7 tracking-[-0.04em]">
          Cari barang, pilih outlet, lanjut titip dalam satu layar.
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/85">
          Visual baru untuk browsing yang lebih ringan, cepat, dan enak dipakai
          di mobile.
        </p>

        <button
          type="button"
          onClick={() => navigate("/create")}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#1498a0] shadow-lg transition hover:translate-x-0.5"
        >
          Buat titipan sekarang
          <MoveRight size={16} />
        </button>
      </div>
    </div>
  );
}
