import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const EMOJI_ICONS = [
  "🍩", "🍦", "🍉", "☕", "🍔", "🍟", "🥤", "🍜", "🍕", "🥐",
  "🧃", "🧋", "🍰", "🍪", "🥪", "🍗", "🥗", "🍙", "🍣", "🔥",
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

    const payload = {
      name: categoryName.trim(),
      icon: icon || null,
    };

    const query =
      mode === "edit"
        ? supabase.from("categories").update(payload).eq("id", initialData.id)
        : supabase.from("categories").insert({
          ...payload,
          warung_id: outletId,
        });

    const { data, error } = await query.select().single();
    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    mode === "edit" ? onUpdated?.(data) : onCreated?.(data);
    onClose();
  };

  const filteredIcons = EMOJI_ICONS.filter((e) =>
    e.includes(search)
  );

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100 rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <div className="py-3 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-base-300" />
        </div>

        <div className="px-6 pb-6">
          <h3 className="text-lg font-bold text-center mb-4">
            {mode === "edit" ? "Edit Etalase" : "Tambah Etalase"}
          </h3>

          {/* ICON PREVIEW */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-base-200 flex items-center justify-center text-4xl">
              {icon || "📦"}
            </div>
          </div>

          {/* NAME INPUT */}
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Contoh: Minuman"
            className="input input-lg w-full text-xl font-semibold text-center
                       bg-base-200 focus:ring-4 focus:ring-emerald-400/30"
            autoFocus
          />

          {/* ICON SEARCH */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari icon (🍔 ☕ 🔥)"
            className="input input-md w-full mt-4 bg-base-200"
          />

          {/* ICON GRID */}
          <div className="grid grid-cols-6 gap-3 mt-4 max-h-40 overflow-y-auto">
            {filteredIcons.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setIcon(emoji)}
                className={`text-2xl p-2 rounded-xl transition
                  ${icon === emoji
                    ? "bg-emerald-500 text-white"
                    : "bg-base-200 hover:bg-base-300"
                  }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* INFO */}
          {categoryName && (
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/30
                            rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-center">
                {icon || "📦"} Etalase <b>{categoryName}</b>{" "}
                {mode === "edit" ? "akan diperbarui" : "akan ditambahkan"}
              </p>
            </div>
          )}
        </div>

        {/* ACTION */}
        <div className="flex gap-3 px-6 pb-8">
          <button onClick={onClose} className="flex-1 btn btn-ghost btn-lg rounded-2xl">
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!categoryName || loading}
            className="flex-1 btn btn-success btn-lg rounded-2xl text-white font-bold"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </>
  );
}