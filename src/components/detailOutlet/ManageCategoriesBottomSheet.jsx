import { useState } from "react";
import { Plus, Pencil, Trash2, X, Settings } from "lucide-react";
import AddCategoryBottomSheet from "./AddCategorryBottomSheet";
import { supabase } from "../../lib/supabaseClient";
import swal from "sweetalert2";

export default function ManageCategoriesBottomSheet({
  open,
  onClose,
  categories = [],
  outletId,
  onCreated,
  onUpdated,
  onDeleted,
}) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  if (!open) return null;

  const handleDelete = async (cat) => {
    const result = await swal.fire({
      title: "Hapus Etalase?",
      text: `Etalase "${cat.name}" akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", cat.id);

      if (error) {
        swal.fire("Error", error.message, "error");
      } else {
        swal.fire("Terhapus!", "Etalase telah dihapus.", "success");
        onDeleted?.(cat.id);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100 rounded-t-3xl max-h-[85vh] flex flex-col">
        <div className="py-3 flex justify-center flex-shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-base-300" />
        </div>

        <div className="px-6 pb-2 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Settings size={20} />
            Atur Etalase
          </h3>
          <button onClick={onClose} className="btn btn-circle btn-sm btn-ghost">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {categories.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              Belum ada etalase
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100"
              >
                <span className="font-medium text-slate-700 truncate mr-2">
                  {cat.name}
                </span>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingCategory(cat)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 flex-shrink-0 bg-white pb-8">
          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4e73df] text-white py-3 text-[13px] font-semibold hover:bg-[#3d64c7] transition-colors shadow-sm"
          >
            <Plus size={16} />
            Tambah Etalase Baru
          </button>
        </div>
      </div>

      <AddCategoryBottomSheet
        open={isAddOpen || !!editingCategory}
        onClose={() => {
          setIsAddOpen(false);
          setEditingCategory(null);
        }}
        outletId={outletId}
        mode={editingCategory ? "edit" : "create"}
        initialData={editingCategory}
        onCreated={(data) => {
          onCreated?.(data);
          // Keep manage sheet open, Add sheet closes automatically via internal onClose or we ensure it here
          setIsAddOpen(false);
        }}
        onUpdated={(data) => {
          onUpdated?.(data);
          setEditingCategory(null);
        }}
      />
    </>
  );
}
