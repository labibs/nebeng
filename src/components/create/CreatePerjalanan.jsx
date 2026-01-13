import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../../lib/supabaseClient";


export default function CreatePerjalanan({ onBack }) {
  const { user } = useUser();
  const [form, setForm] = useState({
    from_city: "",
    to_city: "",
    travel_date: "",
    armada: "motor",
    description: "",
  });

  const submit = async () => {
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    await supabase.from("posts").insert({
      user_id: userRow.id,
      clerk_user_id: user.id,
      type: "bawa_titipan",
      from_city: form.from_city,
      to_city: form.to_city,
      travel_date: form.travel_date,
      armada: form.armada,
      item_description: "Siap menerima titipan",
      description: form.description,
      status: "open",
    });

    onBack();
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack}>← Kembali</button>
      <h2 className="text-lg font-bold">Bawa Titipan</h2>

      <input placeholder="Dari" onChange={e => setForm({ ...form, from_city: e.target.value })} />
      <input placeholder="Ke" onChange={e => setForm({ ...form, to_city: e.target.value })} />
      <input type="date" onChange={e => setForm({ ...form, travel_date: e.target.value })} />

      <select onChange={e => setForm({ ...form, armada: e.target.value })}>
        <option value="motor">Motor</option>
        <option value="mobil">Mobil</option>
        <option value="bus">Bus</option>
        <option value="kereta">Kereta</option>
      </select>

      <textarea placeholder="Catatan (opsional)" onChange={e => setForm({ ...form, description: e.target.value })} />

      <button onClick={submit} className="btn btn-success w-full">
        Umumkan Perjalanan
      </button>
    </div>
  );
}
