import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && mode === "edit" && initialData) {
      setCategoryName(initialData.name);
    } else if (open && mode === "create") {
      setCategoryName("");
    }
  }, [open, mode, initialData]);

  if (!open) return null;

  const handleSave = async () => {
    if (!categoryName.trim()) return;

    setLoading(true);

    if (mode === "edit") {
      const { data, error } = await supabase
        .from("categories")
        .update({ name: categoryName.trim() })
        .eq("id", initialData.id)
        .select()
        .single();

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      onUpdated?.(data);
      onClose();
    } else {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          warung_id: outletId,
          name: categoryName.trim(),
        })
        .select()
        .single();

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      onCreated?.(data);
      setCategoryName("");
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100 rounded-t-3xl">
        <div className="py-3 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-base-300" />
        </div>

        {/* CONTENT */}
        <div className="px-6 pb-6">
          <h3 className="text-lg font-bold text-center mb-4">
            {mode === "edit" ? "Edit Etalase" : "Tambah Etalase"}
          </h3>

          <div className="relative">
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Contoh: Minuman"
              className="input input-lg w-full text-xl font-semibold text-center
                         bg-base-200 focus:outline-none
                         focus:ring-4 focus:ring-emerald-400/30"
              autoFocus
            />
          </div>

          {categoryName && (
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/30
                            rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-base-content/80 text-center">
                📦 Etalase <b>{categoryName}</b> akan {mode === "edit" ? "diperbarui" : "ditambahkan ke warung ini"}
              </p>
            </div>
          )}
        </div>

        {/* ACTION */}
        <div className="flex gap-3 px-6 pb-8">
          <button
            onClick={onClose}
            className="flex-1 btn btn-ghost btn-lg rounded-2xl"
          >
            Batal
          </button>

          <button
            onClick={handleSave}
            disabled={!categoryName || loading}
            className="flex-1 btn btn-success btn-lg rounded-2xl
                       text-white font-bold shadow-lg disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </>
  );
}
