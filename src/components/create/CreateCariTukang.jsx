import { useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../../lib/supabaseClient";
import { uploadPostImage } from "../../lib/uploadPostImage";
import LocationPicker from "./LocationPicker";
import { ArrowLeft } from "lucide-react";
import SlideToPosting from "./SlideToPosting";

export default function CreateCariTukang({ onBack }) {
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

  const formatRupiah = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID").format(value);
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
      type: "tukang",
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

  return (
    <>
      <div className="fixed inset-0 mb-2 flex flex-col px-4 pb-2 pt-6">
        <div className="shrink-0">
          <div className="pointer-events-auto mb-5 flex items-start gap-3">
            <button
              onClick={onBack}
              className="rounded-full bg-white p-3 text-black shadow-lg"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex flex-col">
              <h3 className="text-base font-semibold leading-tight">
                Nyari Tukang
              </h3>
              <p className="text-xs opacity-70">
                Tulis kebutuhanmu, cari tukang yang bisa mampir dan bantu di
                lokasi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pb-20">
          <div className="overflow-hidden rounded-2xl border-2 border-dashed transition hover:bg-emerald-50 dark:hover:bg-white/5">
            <div
              className="relative flex h-40 cursor-pointer items-center justify-center"
              onClick={() => fileRef.current.click()}
            >
              {preview ? (
                <img
                  src={preview}
                  className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                />
              ) : (
                <span className="px-6 text-center text-sm opacity-60">
                  + Upload foto kebutuhan atau lokasi kerja
                </span>
              )}
            </div>

            <div className="border-t border-white/10" />

            <textarea
              placeholder="Jelaskan kebutuhanmu secara singkat..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              className="w-full resize-none bg-transparent px-4 py-3 text-sm focus:outline-none placeholder:opacity-60"
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
            label="Mau dicariin tukang di mana?"
            value={fromLocation}
            onSelect={setFromLocation}
          />
          <LocationPicker
            label="Hasil kerja / tujuan akhirnya di mana?"
            value={toLocation}
            onSelect={setToLocation}
          />

          <div className="rounded-2xl border bg-white/70 px-4 py-3 dark:bg-white/5">
            <p className="mb-1 text-xs opacity-60">Butuh tukang buat apa?</p>
            <textarea
              placeholder="Contoh: Pasang kanopi kecil, servis pompa air, tambal bocor"
              value={form.item_description}
              onChange={(e) =>
                setForm({ ...form, item_description: e.target.value })
              }
              className="w-full resize-none bg-transparent text-sm font-semibold placeholder:font-normal focus:outline-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-white/70 px-4 py-3 dark:bg-white/5">
              <p className="mb-1 text-xs opacity-60">
                Budget kerja kisaran berapa?
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm opacity-60">Rp</span>
                <input
                  type="text"
                  placeholder="150.000"
                  value={formatRupiah(form.price)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setForm({ ...form, price: raw });
                  }}
                  className="w-full bg-transparent text-sm font-semibold placeholder:font-normal focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-2xl border bg-white/70 px-4 py-3 dark:bg-white/5">
              <p className="mb-1 text-xs opacity-60">
                Ongkos panggil / tambahan
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm opacity-60">Rp</span>
                <input
                  type="text"
                  placeholder="25.000"
                  value={formatRupiah(form.fee)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setForm({ ...form, fee: raw });
                  }}
                  className="w-full bg-transparent text-sm font-semibold placeholder:font-normal focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-white/70 px-4 py-3 dark:bg-white/5">
              <p className="mb-1 text-xs opacity-60">Butuh kapan?</p>
              <input
                type="date"
                value={form.travel_date}
                onChange={(e) =>
                  setForm({ ...form, travel_date: e.target.value })
                }
                className="w-full bg-transparent text-sm font-semibold focus:outline-none"
              />
            </div>

            <div className="rounded-2xl border bg-white/70 px-4 py-3 dark:bg-white/5">
              <p className="mb-1 text-xs opacity-60">Mobilitas tukang</p>
              <select
                value={form.armada}
                onChange={(e) => setForm({ ...form, armada: e.target.value })}
                className="w-full bg-transparent text-sm font-semibold focus:outline-none"
              >
                <option value="motor">Motor</option>
                <option value="mobil">Mobil</option>
                <option value="pickup">Pickup</option>
              </select>
            </div>
          </div>

          <SlideToPosting onComplete={submit} loading={loading} />
        </div>
      </div>
    </>
  );
}
