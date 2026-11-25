import React from "react";
import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { useRegisterSW } from "virtual:pwa-register/react";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import "leaflet/dist/leaflet.css";
import { UserProvider } from "./lib/UserContext.jsx";
import { LanguageProvider } from "./lib/LanguageContext.jsx";
import { useLanguage } from "./lib/LanguageContext.jsx";
import ApiClientInit from "./components/ApiClientInit.jsx";

// Komponen Toast Minimalis
const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Hilang setelah 4 detik

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-600" : "bg-blue-600";

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div
        className={`text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 ${bgColor}`}
      >
        <svg
          className="w-6 h-6 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              type === "success"
                ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            }
          />
        </svg>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

function SWUpdatePrompt() {
  const { t } = useLanguage();
  const [showToast, setShowToast] = useState(null); // { message, type }

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // SW Registered
    },
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  // Gunakan useEffect agar aman dari infinite render
  useEffect(() => {
    if (offlineReady) {
      setShowToast({ message: t("App siap digunakan offline!"), type: "success" });
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady, t]);

  useEffect(() => {
    if (needRefresh) {
      setShowToast({
        message: t("Versi baru tersedia!"),
        type: "info",
        action: () => {
          updateServiceWorker(true); // Reload + update
          setShowToast(null);
        },
      });
      setNeedRefresh(false); // Biar tidak muncul lagi setelah ditutup
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker, t]);

  return (
    <>
      {showToast && (
        <Toast
          message={
            showToast.action ? (
              <div className="flex items-center gap-4">
                <span>{showToast.message}</span>
                <button
                  onClick={showToast.action}
                  className="px-4 py-1 bg-white text-gray-900 text-sm rounded-full font-medium hover:bg-gray-100 transition"
                >
                  {t("Update sekarang")}
                </button>
              </div>
            ) : (
              showToast.message
            )
          }
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <ApiClientInit /> {/* 🔥 Init API client with Clerk token */}
      <UserProvider>
        <LanguageProvider>
          <App />
          <SWUpdatePrompt />
        </LanguageProvider>
      </UserProvider>
    </ClerkProvider>
  </React.StrictMode>,
);
