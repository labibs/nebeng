import { useState, useEffect } from "react";
import { Plus, X, Package } from "lucide-react";

export default function ProductForm({
  mode = "create",
  initialData = {},
  categories = [],
  selectedCategory,
  setSelectedCategory,
  onSubmit,
  onClose,
}) {
  const [name, setName] = useState(initialData.name || "");
  const [price, setPrice] = useState(initialData.estimated_price || "");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // autofill saat edit
  useEffect(() => {
    if (mode === "edit") {
      setSelectedCategory(
        initialData.category_id ? String(initialData.category_id) : "",
      );
      if (initialData.image_url) {
        setPreview(initialData.image_url);
      }
    }
  }, [mode, initialData, setSelectedCategory]);

  async function handleSubmit() {
    setLoading(true);
    await onSubmit({
      name,
      estimated_price: price,
      category_id: selectedCategory,
      imageFile,
      image_url: initialData.image_url,
    });
    setLoading(false);
  }

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
            <Package size={20} />
            {mode === "edit" ? "Edit Produk" : "Tambah Produk"}
          </h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Nama */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama produk"
            className="input input-lg w-full bg-slate-50 text-center font-semibold rounded-2xl"
            autoFocus
          />

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select select-lg w-full bg-slate-50 rounded-2xl text-center"
          >
            <option value="" disabled>
              Pilih Kategori
            </option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Harga */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              Rp
            </span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
              placeholder="10000"
              className="input input-lg w-full pl-12 text-center text-xl font-bold bg-slate-50 rounded-2xl"
            />
          </div>

          {/* Upload Image */}
          <label className="block">
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                setImageFile(file);
                setPreview(URL.createObjectURL(file));
              }}
            />
            <div className="h-32 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="h-full w-full object-cover rounded-2xl"
                />
              ) : (
                <span className="text-sm text-slate-400">
                  📷 Upload foto produk
                </span>
              )}
            </div>
          </label>

          {/* Preview */}
          {name && price && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <p className="text-sm text-center text-emerald-700">
                🧺 <b>{name}</b>
                <br />~ Rp {Number(price).toLocaleString("id-ID")}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-200 flex-shrink-0 bg-white pb-8">
          <button
            onClick={handleSubmit}
            disabled={
              !name ||
              !price ||
              !selectedCategory ||
              (mode === "create" && !imageFile) ||
              loading
            }
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4e73df] text-white py-3 text-[13px] font-semibold hover:bg-[#3d64c7] transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus size={16} />
            {loading ? "Menyimpan..." : "Simpan Produk"}
          </button>
        </div>
      </div>
    </>
  );
}
