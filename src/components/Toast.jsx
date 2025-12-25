import { useState, useEffect } from 'react';

// Komponen Toast
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Hilang setelah 4 detik

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 min-w-max">
        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

// Di komponen utama kamu
export default function App() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (offlineReady) {
      setShowToast(true);
      setOfflineReady(false);
    }
  }, [offlineReady]);

  return (
    <>
      {/* Konten aplikasi kamu */}

      {showToast && (
        <Toast
          message="App siap digunakan offline!"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}