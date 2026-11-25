import { useLanguage } from "../lib/LanguageContext";

export default function LoadingLogo({ size = "w-16 h-16", className = "" }) {
  const { t } = useLanguage();
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <img
        src="/pwa-512x512.png"
        alt={t("Loading...")}
        className={`${size} animate-pulse object-contain`}
      />
      <p className="text-sm text-slate-400 font-medium">{t("Memuat...")}</p>
    </div>
  );
}
