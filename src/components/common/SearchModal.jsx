import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchModal({
  isOpen,
  onClose,
  value,
  onChange,
  placeholder = "Cari...",
  children,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-lg rounded-[32px] bg-white p-3 shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
          >
            <div className="flex items-center gap-3 rounded-[24px] bg-[#f5f7ff] px-4 py-3.5 shadow-inner">
              <Search size={20} className="shrink-0 text-[#4e73df]" />
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full min-w-0 bg-transparent text-[16px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
              />
              {value ? (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300"
                >
                  <X size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {children}

            {/* Quick Suggestions or info can go here */}
            {value === "" && !children && (
              <div className="px-4 py-3 text-center">
                <p className="text-[12px] font-medium text-slate-400">
                  Ketik sesuatu untuk mulai mencari...
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
