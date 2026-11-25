import { lazy, Suspense, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { useEffect } from "react";
import CreateActionPicker from "../components/create/CreateActionPicker";
import CreateNitipBawakan from "../components/create/CreateNitipBawakan";
import CreateNitipBelikan from "../components/create/CreateNitipBelikan";
import CreateCariBoncengan from "../components/create/CreateCariBoncengan";
import CreateCariTukang from "../components/create/CreateCariTukang";
import CreatePerjalanan from "../components/create/CreatePerjalanan";
import CreateWarung from "../components/create/CreateWarung";
import CreateContent from "../components/create/CreateContent";
import CreateJualanKeliling from "../components/create/CreateJualanKeliling";
import { Sparkles } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

const AiPostAssistant = lazy(() => import("../components/create/AiPostAssistant"));

function AssistantLoading() {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#f0f7ff]">
      <img src="/pwa-512x512.png" alt="" className="h-16 w-16 animate-pulse object-contain" />
      <p className="mt-3 text-sm font-medium text-slate-500">Menyiapkan chat AI...</p>
    </div>
  );
}

export default function CreatePost() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { setBottomNavHidden } = useOutletContext();
  const [action, setAction] = useState(() =>
    location.pathname === "/create/assistant"
      ? "assistant"
      : location.state?.actionType || null,
  );

  useEffect(() => {
    const isAssistantOpen = action === "assistant";
    setBottomNavHidden(isAssistantOpen);
    return () => setBottomNavHidden(false);
  }, [action, setBottomNavHidden]);

  useEffect(() => {
    if (location.pathname === "/create/assistant") {
      setAction("assistant");
    } else if (action === "assistant") {
      setAction(null);
    }
  }, [location.pathname, action]);

  const closeAssistant = () => {
    if (location.pathname === "/create/assistant") {
      navigate("/create", { replace: true });
      return;
    }
    setAction(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f0f7ff] px-4 py-6">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-200/45 blur-3xl" />
      <div className="absolute -right-16 top-48 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/20 to-transparent" />

      <div className="relative z-10">
        {!action && (
          <>
            <h1 className="mb-4 text-center text-xl font-bold">
              {t("Mau ngapain hari ini?")}
            </h1>
            <button
              onClick={() => {
                setAction("assistant");
                navigate("/create/assistant");
              }}
              className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-blue-600 p-4 text-left text-white shadow-lg transition hover:bg-blue-700"
            >
              <span className="rounded-full bg-white/15 p-3"><Sparkles size={22} /></span>
              <span>
                <span className="block font-bold">{t("Buat postingan dengan AI")}</span>
                <span className="block text-xs text-white/80">{t("Ceritakan saja, asisten bantu susun postingannya")}</span>
              </span>
            </button>
            <CreateActionPicker onSelect={setAction} />
          </>
        )}
      </div>

      {action && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-[#f0f7ff]">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-200/45 blur-3xl" />
          <div className="absolute -right-16 top-48 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/20 to-transparent" />

          <div className="relative z-10 h-full">
            {action === "assistant" && (
              <Suspense fallback={<AssistantLoading />}>
                <AiPostAssistant onBack={closeAssistant} />
              </Suspense>
            )}
            {action === "nitip_bawakan" && (
              <CreateNitipBawakan
                onBack={() => setAction(null)}
                initialData={location.state?.initialData}
              />
            )}
            {action === "nitip_belikan" && (
              <CreateNitipBelikan
                onBack={() => setAction(null)}
                initialData={location.state?.initialData}
              />
            )}

            {action === "cari_boncengan" && (
              <CreateCariBoncengan
                onBack={() => setAction(null)}
                initialData={location.state?.initialData}
              />
            )}

            {action === "tukang" && (
              <CreateCariTukang
                onBack={() => setAction(null)}
                initialData={location.state?.initialData}
              />
            )}

            {action === "perjalanan" && (
              <CreatePerjalanan
                onBack={() => setAction(null)}
                initialData={location.state?.initialData}
              />
            )}

            {action === "content" && (
              <CreateContent
                onBack={() => setAction(null)}
                initialData={location.state?.initialData}
              />
            )}

            {action === "warung" && (
              <CreateWarung
                onBack={() => setAction(null)}
                initialData={location.state?.initialData}
              />
            )}

            {action === "keliling" && (
              <CreateJualanKeliling
                onBack={() => setAction(null)}
                initialData={location.state?.initialData}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
