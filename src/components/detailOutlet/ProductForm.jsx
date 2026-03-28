import { useState, useEffect } from "react";

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
      setSelectedCategory(initialData.category_id ? String(initialData.category_id) : "");
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
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100 rounded-t-3xl">
        <div className="py-3 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-base-300" />
        </div>

        <div className="px-6 pb-6 space-y-4">
          <h3 className="text-lg font-bold text-center">
            {mode === "edit" ? "Edit Produk" : "Tambah Produk"}
          </h3>

          {/* Nama */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama produk"
            className="input input-lg w-full bg-base-200 text-center font-semibold"
            autoFocus
          />

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select select-lg w-full bg-base-200 text-center"
          >
            <option value="" disabled>Pilih Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Harga */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60">
              Rp
            </span>
            <input
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value.replace(/\D/g, ""))
              }
              placeholder="10000"
              className="input input-lg w-full pl-12 text-center text-xl font-bold bg-base-200"
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
            <div className="h-32 rounded-2xl border border-dashed flex items-center justify-center bg-base-200 cursor-pointer">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="h-full w-full object-cover rounded-2xl"
                />
              ) : (
                <span className="text-sm opacity-60">
                  📷 Upload foto produk
                </span>
              )}
            </div>
          </label>

          {/* Preview */}
          {name && price && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border">
              <p className="text-sm text-center">
                🧺 <b>{name}</b>
                <br />
                ~ Rp {Number(price).toLocaleString("id-ID")}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-8">
          <button
            onClick={onClose}
            className="flex-1 btn btn-ghost btn-lg rounded-2xl"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name || !price || !selectedCategory || (mode === "create" && !imageFile) || loading}
            className="flex-1 btn btn-success btn-lg rounded-2xl text-white font-bold disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </>
  );
}
