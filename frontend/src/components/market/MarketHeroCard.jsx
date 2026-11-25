import { Calendar, Clock, Heart, Sparkles } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";

export default function MarketHeroCard() {
  const { t } = useLanguage();
  return (
    <div className="relative mt-2 overflow-hidden rounded-[40px] bg-gradient-to-br from-[#4e73df] via-[#5a81f3] to-[#6c8ef8] p-6 shadow-[0_25px_50px_-12px_rgba(78,115,223,0.3)]">
      {/* Decorative Elements */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />

      {/* Background Illustration */}
      <div className="absolute -top-6 -right-4 h-[190px] w-[190px] pointer-events-none z-0">
        <img
          src="https://ouch-cdn2.icons8.com/mO_8p_A9v9N9qfQpX0R_7_qQ9Z9Z9Z9Z9Z9Z9Z9Z9Z8/rs:fit:456:456/czM6Ly9pY29uczgu/b3VjaC1wcm9kLmFz/c2V0cy9zdmcvMTYv/OTg2ZjZiZTgtOGYy/YS00YjRhLWI5YmYt/MjMwYTgxYmY5YmY5/LnN2Zw.png"
          alt="Illustration"
          className="h-full w-full object-contain drop-shadow-2xl"
          style={{ transform: "rotate(-10deg) scale(1.1)" }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/30">
            <Sparkles size={16} className="text-amber-200 fill-amber-200" />
          </div>
          <span className="text-[13px] font-bold tracking-wider text-white uppercase">
            {t("Promo Terbatas")}
          </span>
        </div>

        <div className="mb-6">
          <h2 className="text-[26px] font-extrabold leading-tight text-white">
            {t("Belanja Hemat")} <br />
            <span className="text-blue-100 opacity-90">{t("Hingga 50%")}</span>
          </h2>
        </div>

        {/* Inner Info Card - Boarding Pass Style */}
        <div className="bg-white/20 backdrop-blur-xl rounded-[28px] p-4 mb-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5 text-white">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Calendar size={14} />
                </div>
                <span className="text-[13px] font-bold">{t("Minggu, 05 April")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-white/90">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Clock size={14} />
                </div>
                <span className="text-[13px] font-semibold">
                  09:00 - 21:00 WIB
                </span>
              </div>
            </div>

            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_8px_20px_rgba(255,255,255,0.3)] text-pink-500 transition-all hover:scale-110 active:scale-95">
              <Heart size={24} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-auto">
          <button className="flex-1 rounded-[20px] bg-white py-3.5 text-[14px] font-bold text-slate-500 shadow-md transition-all active:scale-95">
            {t("Abaikan")}
          </button>
          <button className="flex-1 rounded-[20px] bg-[#2e3a59]/30 backdrop-blur-md border border-white/20 py-3.5 text-[14px] font-bold text-white shadow-md transition-all active:scale-95">
            {t("Cek Produk")}
          </button>
        </div>
      </div>
    </div>
  );
}
