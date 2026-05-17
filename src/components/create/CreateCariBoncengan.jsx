import { useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../../lib/supabaseClient";
import { uploadPostImage } from "../../lib/uploadPostImage";
import LocationPicker from "./LocationPicker";
import { ArrowLeft } from "lucide-react";
import SlideToPosting from "./SlideToPosting";

export default function CreateCariBoncengan({ onBack }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    item_description: "",
    description: "",
    price: "",
    fee: "",
    travel_date: "",
    armada: "motor",
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
      type: "cari_boncengan",
      from_city: fromLocation.address,
      from_lat: fromLocation.lat,
      from_lng: fromLocation.lng,
      to_lat: toLocation.lat,
      to_lng: toLocation.lng,
      to_city: toLocation.address,
      travel_date: form.travel_date,
      armada: form.armada,
      item_description: form.item_description,
      price: Number(form.price),
      fee: Number(form.fee),
      item_photo: photoUrl,
      description: form.description,
      status: "open",
    });

    setLoading(false);
    onBack();
  };

  const formatRupiah = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID").format(value);
  };

  return (
    <>
      <div className="fixed inset-0 flex flex-col mb-2 pt-6 px-4 pb-2">
        <div className="shrink-0">
          <div className="pointer-events-auto flex items-start gap-3 mb-5">
            <button
              onClick={onBack}
              className="bg-white rounded-full p-3 shadow-lg text-black"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex flex-col">
              <h3 className="text-base font-semibold leading-tight">
                Cari Boncengan
              </h3>
              <p className="text-xs opacity-70">
                Tulis tujuanmu, cari orang yang searah buat nyamperin kamu.
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pb-20">
          <div
            className="rounded-2xl border-dashed border-2
                          overflow-hidden
                          hover:bg-emerald-50 dark:hover:bg-white/5 transition"
          >
            {/* AREA FOTO */}
            <div
              className="relative h-40 cursor-pointer flex items-center justify-center"
              onClick={() => fileRef.current.click()}
            >
              {preview ? (
                <img
                  src={preview}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <span className="text-sm opacity-60 px-6 text-center">
                  + Upload foto yang mau ditampilkan di beranda
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* TEXTAREA (AMAN) */}
            <textarea
              placeholder="Utarakan maksudmu di sini..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              className="w-full bg-transparent resize-none
                            px-4 py-3 text-sm
                            focus:outline-none placeholder:opacity-60"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImage}
          />
          <LocationPicker
            label="Mau di samper dimana ?"
            value={fromLocation}
            onSelect={setFromLocation}
          />
          <LocationPicker
            label="Mau turun diamana ?"
            value={toLocation}
            onSelect={setToLocation}
          />

          {/* Bawain apa */}
          <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
            <p className="text-xs opacity-60 mb-1">Kamu bawa barang ngga ?</p>
            <textarea
              placeholder="Contoh: Bawa, Koper medium 1"
              value={form.item_description}
              onChange={(e) =>
                setForm({ ...form, item_description: e.target.value })
              }
              className="w-full bg-transparent resize-none
                            text-sm font-semibold placeholder:font-normal
                            focus:outline-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Harga barang */}
            <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
              <p className="text-xs opacity-60 mb-1">
                Harga barangnya kisaran berapa ?
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm opacity-60">Rp</span>
                <input
                  type="text"
                  placeholder="10.000"
                  value={formatRupiah(form.price)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setForm({ ...form, price: raw });
                  }}
                  className="w-full bg-transparent
                                text-sm font-semibold
                                placeholder:font-normal
                                focus:outline-none"
                />
              </div>
            </div>

            {/* Ongkos jastip */}
            <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
              <p className="text-xs opacity-60 mb-1">
                Mau ngasi ongkos berapa ?
              </p>

              <div className="flex items-center gap-1">
                <span className="text-sm opacity-60">Rp</span>
                <input
                  type="text"
                  placeholder="10.000"
                  value={formatRupiah(form.fee)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setForm({ ...form, fee: raw });
                  }}
                  className="w-full bg-transparent
                                text-sm font-semibold
                                placeholder:font-normal
                                focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Tanggal jemput */}
            <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
              <p className="text-xs opacity-60 mb-1">Berangkat kapan?</p>

              <input
                type="datetime-local"
                value={form.travel_date}
                onChange={(e) =>
                  setForm({ ...form, travel_date: e.target.value })
                }
                className="w-full bg-transparent
                                text-sm font-semibold
                                focus:outline-none"
              />
            </div>

            {/* Armada */}
            <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
              <p className="text-xs opacity-60 mb-1">Maunya naik apa?</p>

              <select
                value={form.armada}
                onChange={(e) => setForm({ ...form, armada: e.target.value })}
                className="w-full bg-transparent
                                text-sm font-semibold
                                focus:outline-none"
              >
                <option value="motor">Motor</option>
                <option value="mobil">Mobil</option>
                {/* <option value="bus">Bus</option>
                      <option value="kereta">Kereta</option> */}
              </select>
            </div>
          </div>
          <SlideToPosting onComplete={submit} />
        </div>
      </div>
    </>
  );
}
