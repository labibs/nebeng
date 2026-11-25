import { useState, useEffect } from "react";
import { Plus, X, Tags } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";
import { useLanguage } from "../../lib/LanguageContext";

const EMOJI_ICONS = [
  "🍩",
  "🍦",
  "🍉",
  "☕",
  "🍔",
  "🍟",
  "🥤",
  "🍜",
  "🍕",
  "🥐",
  "🧃",
  "🧋",
  "🍰",
  "🍪",
  "🥪",
  "🍗",
  "🥗",
  "🍙",
  "🍣",
  "🔥",
];

export default function AddCategoryBottomSheet({
  open,
  onClose,
  outletId,
  mode = "create",
  initialData = null,
  onCreated,
  onUpdated,
}) {
  const { t } = useLanguage();
  const [categoryName, setCategoryName] = useState("");
  const [icon, setIcon] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && mode === "edit" && initialData) {
      setCategoryName(initialData.name);
      setIcon(initialData.icon || "");
    } else if (open && mode === "create") {
      setCategoryName("");
      setIcon("");
    }
  }, [open, mode, initialData]);

  if (!open) return null;

  const handleSave = async () => {
    if (!categoryName.trim()) return;

    setLoading(true);

    try {
      let data;
      if (mode === "edit") {
        data = await apiFetch(`/categories/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: categoryName.trim(),
            icon: icon || null,
          }),
        });
      } else {
        data = await apiFetch('/categories', {
          method: 'POST',
          body: JSON.stringify({
            name: categoryName.trim(),
            icon: icon || null,
            warung_id: outletId,
          }),
        });
      }

      mode === "edit" ? onUpdated?.(data) : onCreated?.(data);
      onClose();
    } catch (error) {
      alert(error.message || t("Gagal menyimpan etalase"));
    } finally {
      setLoading(false);
    }
  };

  const filteredIcons = EMOJI_ICONS.filter((e) => e.includes(search));

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] flex flex-col">
        <div className="py-3 flex justify-center flex-shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        <div className="px-6 pb-2 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Tags size={20} />
            {mode === "edit" ? t("Edit Etalase") : t("Tambah Etalase")}
          </h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* ICON PREVIEW */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-4xl border border-slate-200">
              {icon || "📦"}
            </div>
          </div>

          {/* NAME INPUT */}
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder={t("Contoh: Minuman")}
            className="input input-lg w-full text-xl font-semibold text-center bg-slate-50 rounded-2xl focus:ring-4 focus:ring-[#4e73df]/30"
            autoFocus
          />

          {/* ICON SEARCH */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Cari icon (🍔 ☕ 🔥)")}
            className="input input-md w-full bg-slate-50 rounded-2xl"
          />

          {/* ICON GRID */}
          <div className="grid grid-cols-6 gap-3 max-h-40 overflow-y-auto">
            {filteredIcons.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setIcon(emoji)}
                className={`text-2xl p-2 rounded-xl transition
                  ${
                    icon === emoji
                      ? "bg-[#4e73df] text-white"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* INFO */}
          {categoryName && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-sm text-center text-emerald-700">
                {icon || "📦"} {t("Etalase")} <b>{categoryName}</b>{" "}
                {mode === "edit" ? t("akan diperbarui") : t("akan ditambahkan")}
              </p>
            </div>
          )}
        </div>

        {/* ACTION */}
        <div className="p-4 border-t border-slate-200 flex-shrink-0 bg-white pb-8">
          <button
            onClick={handleSave}
            disabled={!categoryName || loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4e73df] text-white py-3 text-[13px] font-semibold hover:bg-[#3d64c7] transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus size={16} />
            {loading ? t("Menyimpan...") : t("Simpan Etalase")}
          </button>
        </div>
      </div>
    </>
  );
}
