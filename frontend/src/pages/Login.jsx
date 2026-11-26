import { Link } from 'react-router-dom'
import { Languages } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export default function Login() {
  const { t, language, setLanguage } = useLanguage();
  return (
    <div className="relative min-h-screen bg-base-200 flex items-center justify-center p-6">
      <button
        type="button"
        onClick={() => setLanguage(language === "en" ? "id" : "en")}
        aria-label={t("Ganti bahasa")}
        title={t("Ganti bahasa")}
        className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-2 text-sm font-bold text-base-content shadow-sm transition hover:bg-base-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Languages size={16} aria-hidden="true" />
        <span>{language === "en" ? "EN" : "ID"}</span>
      </button>
      <div className="card w-full max-w-sm bg-base-100 shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl text-center mb-6">{t("Masuk ke Numpak.id")}</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("Email")}</span>
            </label>
            <input type="email" placeholder="email@contoh.com" className="input input-bordered" />
          </div>

          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text">{t("Password")}</span>
            </label>
            <input type="password" placeholder="••••••••" className="input input-bordered" />
            <label className="label">
              <a href="#" className="label-text-alt link link-primary">{t("Lupa password?")}</a>
            </label>
          </div>

          <button className="btn btn-primary w-full mb-4">{t("Masuk")}</button>

          <div className="divider">{t("ATAU")}</div>

          <button className="btn btn-outline">{t("Masuk dengan Google")}</button>

          <p className="text-center mt-6 text-sm">
            {t("Belum punya akun?")}{' '}
            <Link to="/" className="link link-primary">
              {t("Daftar di sini")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
