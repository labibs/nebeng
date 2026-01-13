import { useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../../lib/supabaseClient";
import { uploadPostImage } from "../../lib/uploadPostImage";
import LocationPicker from "./LocationPicker";

export default function CreateCariBoncengan({ onBack }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    item_description: "",
    price: "",
    fee: "",
  });

  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);

  const handleImage = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setPreview(URL.createObjectURL(selectedFile));
    setFile(selectedFile);
  };

  const submit = async () => {
    if (!fromLocation || !toLocation) {
      alert("Pilih lokasi asal dan tujuan!");
      return;
    }

    if (!form.item_description || !form.price || !form.fee) {
      alert("Lengkapi semua field!");
      return;
    }

    setLoading(true);

    let photoUrl = null;
    if (file) {
      photoUrl = await uploadPostImage(file, {
        format: "webp",
        quality: 0.75,
        width: 1024,
      });
    }

    const { data: userRow, error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    await supabase.from("posts").insert({
      user_id: userRow.id,
      clerk_user_id: user.id,
      type: "nitip_belikan",
      from_city: fromLocation.address,
      to_city: toLocation.address,
      item_description: form.item_description,
      price: Number(form.price),
      fee: Number(form.fee),
      item_photo: photoUrl,
      status: "open",
    });

    setLoading(false);
    onBack();
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack}>← Kembali</button>
      <h2 className="text-lg font-bold">Nitip Belikan</h2>

      <LocationPicker label="Dari" value={fromLocation} onSelect={setFromLocation} />
      <LocationPicker label="Ke" value={toLocation} onSelect={setToLocation} />

      <textarea
        placeholder="Barang apa yang mau dibeli?"
        value={form.item_description}
        onChange={(e) => setForm({ ...form, item_description: e.target.value })}
      />

      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Harga barang"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <input
          type="number"
          placeholder="Ongkos jastip"
          value={form.fee}
          onChange={(e) => setForm({ ...form, fee: e.target.value })}
        />
      </div>

      <div
        onClick={() => fileRef.current.click()}
        className="relative h-40 rounded-2xl border-dashed border-2 flex items-center justify-center cursor-pointer hover:bg-emerald-50 dark:hover:bg-white/5"
      >
        {preview ? (
          <img src={preview} className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
        ) : (
          <span className="text-sm opacity-60">+ Tambah Foto (WebP)</span>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />

      <button
        onClick={submit}
        disabled={loading}
        className="btn btn-success w-full"
      >
        {loading ? "Mencari orang lewat..." : "Cari orang searah"}
      </button>
    </div>
  );
}
