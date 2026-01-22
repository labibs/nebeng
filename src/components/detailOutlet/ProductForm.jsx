import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ProductForm({
  mode = "create", // create | edit
  initialData = {},
  categories = [],
  onSubmit,
  onClose,
}) {
  const [name, setName] = useState(initialData.name || "");
  const [price, setPrice] = useState(initialData.estimated_price || "");
  const [categoryId, setCategoryId] = useState(initialData.category_id || "");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    await onSubmit({
      name,
      estimated_price: price,
      category_id: categoryId,
      imageFile,
    });
    setLoading(false);
  }

  return (
    <>
      <div className="px-6 pb-6 space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama produk"
          className="input input-bordered w-full"
        />

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Harga estimasi"
          className="input input-bordered w-full"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="select select-bordered w-full"
        >
          <option value="">Pilih kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          className="file-input file-input-bordered w-full"
        />
      </div>

      <div className="flex gap-3 px-6 pb-8">
        <button onClick={onClose} className="flex-1 btn btn-ghost btn-lg">
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 btn btn-success btn-lg text-white"
        >
          {mode === "edit" ? "Simpan" : "Tambah"}
        </button>
      </div>
    </>
  );
}
