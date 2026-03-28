import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../../lib/supabaseClient";
import { uploadPostImage } from "../../lib/uploadPostImage";

import { ArrowLeft } from "lucide-react";
import LocationPicker from "../create/LocationPicker";
import SlideToCreate from "../create/SlideToCreate";
import { useNavigate } from "react-router-dom";

export default function EditOutlet() {
  const { id } = useParams();
  const { user } = useUser();

  const fileRef = useRef(null);
  const docRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);

  const [location, setLocation] = useState(null);
  const [fromLocation, setFromLocation] = useState(null);
  const [toLocation, setToLocation] = useState(null);
  const navigate = useNavigate();
  const onBack = () => navigate(-1);
  
  const categories = [
    "Makanan",
    "Obat",
    "Sembako",
    "Pakaian",
    "Perkakas",
    "Material",
    "Jasa",
  ];

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Makanan",
    visibility: "public",
    status: "milik",
    owner_phone: "",
    owner_note: "",
  });

  // ================= FETCH DATA =================
  useEffect(() => {
    async function loadOutlet() {
      const { data, error } = await supabase
        .from("warungs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      // prefill form
      setForm({
        name: data.name || "",
        description: data.description || "",
        category: data.category || "Makanan",
        visibility: data.visibility || "public",
        status: data.status || "milik",
        owner_phone: data.owner_phone || "",
        owner_note: data.owner_note || "",
      });

      // image preview
      if (data.image_url) setPreview(data.image_url);
      if (data.dokumen_url) setDocPreview(data.dokumen_url);

      // lokasi
      if (data.latitude && data.longitude) {
        setLocation({
          lat: data.latitude,
          lng: data.longitude,
          address: data.address,
        });
      }

      if (data.from_lat && data.from_lng) {
        setFromLocation({
          lat: data.from_lat,
          lng: data.from_lng,
        });
      }

      if (data.to_lat && data.to_lng) {
        setToLocation({
          lat: data.to_lat,
          lng: data.to_lng,
        });
      }

      setFetching(false);
    }

    loadOutlet();
  }, [id]);

  // ================= HANDLER =================
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

  // ================= SUBMIT =================
  const submit = async () => {
    setLoading(true);

    let imageUrl = preview;
    let dokumenUrl = docPreview;

    if (file) {
      imageUrl = await uploadPostImage(file, {
        format: "webp",
        quality: 0.7,
        width: 800,
      });
    }

    if (form.status === "milik" && docFile) {
      dokumenUrl = await uploadPostImage(docFile, {
        format: "webp",
        quality: 0.8,
        width: 1000,
      });
    }

    await supabase
      .from("warungs")
      .update({
        name: form.name,
        description: form.description,
        category: form.category,
        status: form.status,
        visibility: form.visibility,

        image_url: imageUrl,
        dokumen_url: dokumenUrl,

        latitude: location?.lat || null,
        longitude: location?.lng || null,
        address: location?.address || null,

        from_lat: fromLocation?.lat || null,
        from_lng: fromLocation?.lng || null,
        to_lat: toLocation?.lat || null,
        to_lng: toLocation?.lng || null,
      })
      .eq("id", id)
      .eq("created_by_clerk_id", user.id);

    setLoading(false);
    onBack();
  };

  // ================= RENDER =================
  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm opacity-60">
        Memuat data outlet...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col pt-6 px-4 pb-2">
      {/* HEADER */}
      <div className="flex items-start gap-3 mb-5">
        <button
          onClick={onBack}
          className="bg-white rounded-full p-3 shadow-lg text-black"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h3 className="text-base font-semibold">Edit Outlet</h3>
          <p className="text-xs opacity-70">
            Perbarui informasi outlet kamu
          </p>
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
             <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
              <p className="text-xs opacity-60 mb-1">
                  Penjelasan
              </p>

              <input
                  placeholder="Contoh: Bisa dititipkan ke orang yang sedang menuju ke tempatmu."
                  value={form.description}
                  onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
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
