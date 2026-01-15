import { useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../../lib/supabaseClient";
import { uploadPostImage } from "../../lib/uploadPostImage";

import { ArrowLeft, MapPin } from "lucide-react";
import SlideToPosting from "./SlideToPosting";
import LocationPicker from "./LocationPicker";

export default function CreateWarung({ onBack }) {
  const { user } = useUser();
  const fileRef = useRef(null);

  // ===== STATE =====

  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    visibility: "public",
  });

  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    address: "",
  });

  // ===== HANDLER IMAGE =====

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // ===== VALIDASI =====

  const validate = () => {
    if (!form.name) {
      alert("Nama warung wajib diisi");
      return false;
    }

    if (!location.latitude) {
      alert("Tentukan lokasi warung dulu");
      return false;
    }

    return true;
  };

  // ===== SUBMIT =====

  const submit = async () => {
    if (!validate()) return;

    setLoading(true);

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

      // 🔥 FIELD BARU
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
    });

    setLoading(false);
    onBack();
  };

  // ===== RENDER =====

  return (
    <div className="fixed inset-0 flex flex-col mb-2 pt-6 px-4 pb-2">

      {/* HEADER */}
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
              Tambah Outlet
            </h3>

            <p className="text-xs opacity-70">
              Daftarkan lokasi & identitas outlet — bisa milik sendiri atau kontribusi menambahkan outlet langgananamu
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-20">

        {/* UPLOAD IMAGE */}
        <div
          className="rounded-2xl border-dashed border-2
                     overflow-hidden
                     hover:bg-emerald-50 dark:hover:bg-white/5 transition"
        >
          <div
            className="relative h-56 cursor-pointer flex items-center justify-center"
            onClick={() => fileRef.current.click()}
          >
            {preview ? (
              <img
                src={preview}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm opacity-60 px-6 text-center">
                + Upload foto outlet / etalase utama
              </span>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImage}
        />

        {/* NAMA WARUNG */}
        <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
          <p className="text-xs opacity-60 mb-1">
            Nama Outlet
          </p>

          <input
            placeholder="Contoh: Warung Bu Siti"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full bg-transparent text-sm font-semibold focus:outline-none"
          />
        </div>

        {/* KATEGORI */}
        <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
          <p className="text-xs opacity-60 mb-1">
            Kategori
          </p>

          <input
            placeholder="kopi, jajan, sembako, dll"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
            className="w-full bg-transparent text-sm font-semibold focus:outline-none"
          />
        </div>

        {/* 📍 LOCATION PICKER */}
        <div className="rounded-2xl border bg-white/70 dark:bg-white/5 p-3">

          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="opacity-60" />
            <span className="text-xs opacity-70">
              Lokasi Warung
            </span>
          </div>

          <LocationPicker
            value={location}
            onChange={setLocation}
          />

          {location.address && (
            <p className="text-xs mt-2 opacity-70">
              {location.address}
            </p>
          )}
        </div>

        {/* VISIBILITY */}
        <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
          <p className="text-xs opacity-60 mb-2">
            Visibilitas
          </p>

          <select
            value={form.visibility}
            onChange={(e) =>
              setForm({ ...form, visibility: e.target.value })
            }
            className="w-full bg-transparent text-sm font-semibold focus:outline-none"
          >
            <option value="public">Publik</option>
            <option value="private">Pribadi</option>
          </select>
        </div>

        {/* ACTION */}
        <SlideToPosting
          loading={loading}
          onComplete={submit}
        />

      </div>
    </div>
  );
}
