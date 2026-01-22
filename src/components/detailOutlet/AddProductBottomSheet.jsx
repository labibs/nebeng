import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { uploadPostImage } from "../../lib/uploadPostImage";

export default function AddProductBottomSheet({
  open,
  onClose,
  outletId,
  categoryId,
  categories = [],
  onCreated,
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // auto select category aktif
  useEffect(() => {
    if (categoryId) setSelectedCategory(categoryId);
  }, [categoryId]);

  if (!open) return null;

  const handleSave = async () => {
    if (!name || !price || !selectedCategory) return;

    try {
      setLoading(true);

      let imageUrl = null;

      // 1️⃣ upload image jika ada
      if (imageFile) {
        imageUrl = await uploadPostImage(imageFile, {
          folder: "nebeng/products",
        });
      }

      // 2️⃣ insert product
      const { data, error } = await supabase
        .from("warung_products")
        .insert({
          warung_id: outletId,
          category_id: selectedCategory,
          name: name.trim(),
          estimated_price: Number(price),
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;

      onCreated?.(data);
      handleClose();
    } catch (err) {
      console.error(err);
      alert(err.message || "Gagal menambahkan produk");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setPrice("");
    setSelectedCategory("");
    setImageFile(null);
    setPreview(null);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-base-100 rounded-t-3xl">
        <div className="py-3 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-base-300" />
        </div>

        <div className="px-6 pb-6 space-y-4">
          <h3 className="text-lg font-bold text-center">
            Tambah Produk
          </h3>

          {/* Nama */}
          <input
            type="text"
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
            className="select select-lg w-full bg-base-200"
          >
            <option value="" disabled>
              Pilih Etalase
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Harga */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/60">
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

          {/* Preview text */}
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
            onClick={handleClose}
            className="flex-1 btn btn-ghost btn-lg rounded-2xl"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!name || !price || !selectedCategory || loading}
            className="flex-1 btn btn-success btn-lg rounded-2xl text-white font-bold disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </>
  );
}
