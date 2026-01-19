import { useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../../lib/supabaseClient";
import { uploadPostImage } from "../../lib/uploadPostImage";

import { ArrowLeft, MapPin } from "lucide-react";
import SlideToPosting from "./SlideToPosting";
import LocationPicker from "./LocationPicker";
import SlideToCreate from "./SlideToCreate";

export default function CreateWarung({ onBack }) {
  const { user } = useUser();
  const fileRef = useRef(null);
  const docRef = useRef(null);

  // ===== STATE =====

  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);

  const categories = [
    "Makanan",
    "Obat",
    "Sembako",
    "Pakaian",
    "Perkakas",
    "Material",
    "Jasa"
  ];

  const [form, setForm] = useState({
    name: "",
    category: "Makanan",
    visibility: "public",
    status: "milik",

    // data khusus pemilik
    owner_phone: "",
    owner_note: "",
  });


  // ===== HANDLER IMAGE =====

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDoc = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      alert("Dokumen harus berupa foto");
      return;
    }

    setDocFile(f);
    setDocPreview(URL.createObjectURL(f));
  };

  // ===== VALIDASI =====

  const validate = () => {
    if (!form.name) {
      alert("Nama warung wajib diisi");
      return false;
    }

    return true;
  };

  // ===== SUBMIT =====

  const submit = async () => {
    if (!validate()) return;

    setLoading(true);

    let imageUrl = null;
    let dokumenUrl = null;

    if (file) {
      imageUrl = await uploadPostImage(file, {
        format: "webp",
        quality: 0.7,
        width: 800,
      });
    }

    // dokumen kepemilikan
    if (form.status === "milik" && docFile) {
      dokumenUrl = await uploadPostImage(docFile, {
        format: "webp",
        quality: 0.8,
        width: 1000,
      });
    }

    await supabase.from("warungs").insert({
      created_by_clerk_id: user.id,

      name: form.name,
      category: form.category,
      status: form.status,

      image_url: imageUrl,
      dokumen_url: dokumenUrl,

      visibility: form.visibility,

      latitude: location?.lat || null,
      longitude: location?.lng || null,
      address: location?.address || null,

      // kalau bukan milik → simpan rute
      from_lat: fromLocation?.lat || null,
      from_lng: fromLocation?.lng || null,

      to_lat: toLocation?.lat || null,
      to_lng: toLocation?.lng || null,
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
            Namanya apa ?
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
          <LocationPicker
            label="Lokasi dimana ?"
            value={location}
            onSelect={setLocation}
          />
        <div className="grid grid-cols-2 gap-3">
          {/* Tanggal jemput */}
          <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
            <p className="text-xs opacity-60 mb-1">Kategori</p>

            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              className="w-full bg-transparent
                        text-sm font-semibold
                        focus:outline-none"
            >
              
              {categories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Armada */}
          <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
            <p className="text-xs opacity-60 mb-1">Visibilitas</p>

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
        </div>

        <div className="grid grid-cols-1 gap-3">

          {/* STATUS SELECT */}
          <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
            <p className="text-xs opacity-60 mb-1">Status</p>

            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
              className="w-full bg-transparent text-sm font-semibold focus:outline-none"
            >
              <option value="milik">Milik Saya</option>
              <option value="kurir">Bisa nitip ke saya</option>
              <option value="pembeli">Beliin / Anterin ke outlet ini</option>
            </select>
          </div>

          {/* ====== JIKA MILIK SAYA ====== */}
          {form.status === "milik" && (
            <>
              <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
                <p className="text-xs opacity-60 mb-1">
                  Nomor Pemilik (opsional)
                </p>

                <input
                  placeholder="Contoh: 0812xxxx"
                  value={form.owner_phone}
                  onChange={(e) =>
                    setForm({ ...form, owner_phone: e.target.value })
                  }
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                />
              </div>

              <div
                className="rounded-2xl border-dashed border-2
                          overflow-hidden
                          hover:bg-emerald-50 dark:hover:bg-white/5 transition"
              >
                <p className="text-xs opacity-60 mb-1 py-3 px-4">
                  Dokumen Kepemilikan (opsional)
                </p>
                <div
                  className="relative h-56 cursor-pointer flex items-center justify-center"
                  onClick={() => docRef.current.click()}
                >
                  {docPreview ? (
                    <img
                      src={docPreview}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm opacity-60 px-6 text-center">
                      + Upload dokumen kepemilikan (foto)
                    </span>
                  )}
                </div>
              </div>

              <input
                ref={docRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleDoc}
              />

            </>
          )}


          {/* ====== JIKA BUKAN MILIK ====== */}
          {form.status !== "milik" && (
            <>
              <LocationPicker
                label="Dari mana ?"
                value={fromLocation}
                onSelect={setFromLocation}
              />

              <LocationPicker
                label="Ke mana ?"
                value={toLocation}
                onSelect={setToLocation}
              />
            </>
          )}

        </div>

        {/* ACTION */}
        <SlideToCreate
          loading={loading}
          onComplete={submit}
        />

      </div>
    </div>
  );
}
