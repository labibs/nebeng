import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../../lib/supabaseClient";
import { uploadPostImage } from "../../lib/uploadPostImage";

export default function CreateNitipBawakan({ onBack }) {
  const { user } = useUser();

  const [form, setForm] = useState({
    from_city: "",
    to_city: "",
    travel_date: "",
    item_description: "",
    fee: "",
    armada: "motor",
  });

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);

    let photoUrl = null;
    if (file) photoUrl = await uploadPostImage(file, { format: "webp", quality: 0.75 });

    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    await supabase.from("posts").insert({
      user_id: userRow.id,
      clerk_user_id: user.id,
      type: "nitip_bawakan",
      from_city: form.from_city,
      to_city: form.to_city,
      travel_date: form.travel_date,
      armada: form.armada,
      item_description: form.item_description,
      fee: Number(form.fee),
      price: null,
      item_photo: photoUrl,
      status: "open",
    });

    setLoading(false);
    onBack();
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm opacity-70">← Kembali</button>

      <h2 className="text-lg font-bold">Nitip Bawakan Paket</h2>

      <input placeholder="Dari mana?" onChange={e => setForm({ ...form, from_city: e.target.value })} />
      <input placeholder="Ke mana?" onChange={e => setForm({ ...form, to_city: e.target.value })} />
      <input type="date" onChange={e => setForm({ ...form, travel_date: e.target.value })} />

      <textarea placeholder="Isi paket" onChange={e => setForm({ ...form, item_description: e.target.value })} />

      <input type="number" placeholder="Ongkos (Rp)" onChange={e => setForm({ ...form, fee: e.target.value })} />

      <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />

      <button
        onClick={submit}
        disabled={loading}
        className="btn btn-success w-full"
      >
        {loading ? "Mencari carrier..." : "Cari orang searah"}
      </button>
    </div>
  );
}
