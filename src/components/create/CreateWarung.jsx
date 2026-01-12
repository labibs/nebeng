import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../../lib/supabaseClient";
import { uploadPostImage } from "../../lib/uploadPostImage";

export default function CreateWarung({ onBack }) {
  const { user } = useUser();
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    visibility: "public",
  });

  const submit = async () => {
    let imageUrl = null;
    if (file) {
      imageUrl = await uploadPostImage(file, {
        format: "webp",
        quality: 0.7,
        width: 800,
      });
    }

    await supabase.from("warungs").insert({
      owner_clerk_id: user.id,
      name: form.name,
      category: form.category,
      image_url: imageUrl,
      visibility: form.visibility,
    });

    onBack();
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack}>← Kembali</button>
      <h2 className="text-lg font-bold">Tambah Warung</h2>

      <input placeholder="Nama warung" onChange={e => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Kategori (kopi, jajan, dll)" onChange={e => setForm({ ...form, category: e.target.value })} />

      <select onChange={e => setForm({ ...form, visibility: e.target.value })}>
        <option value="public">Publik</option>
        <option value="private">Pribadi</option>
      </select>

      <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />

      <button onClick={submit} className="btn btn-success w-full">
        Simpan Warung
      </button>
    </div>
  );
}
