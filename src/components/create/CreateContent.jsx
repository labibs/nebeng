import { useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../../lib/supabaseClient";
import { uploadShortVideo } from "../../lib/uploadShortVideo";

import LocationPicker from "./LocationPicker";
import { ArrowLeft } from "lucide-react";
import SlideToPosting from "./SlideToPosting";

export default function CreateContent({ onBack }) {
  const { user } = useUser();
  const fileRef = useRef(null);

  // ========== STATE ==========

  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    caption: "",
    description: "",
    event_date: "",
  });

  const [location, setLocation] = useState(null);

  // ========== HANDLER VIDEO ==========

  const validateVideo = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);

        if (video.duration > 60) {
          alert("Durasi video maksimal 60 detik ya");
          resolve(false);
        } else {
          resolve(true);
        }
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleVideo = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const ok = await validateVideo(selectedFile);
    if (!ok) return;

    setPreview(URL.createObjectURL(selectedFile));
    setFile(selectedFile);
  };

  // ========== SUBMIT ==========

  const submit = async () => {
    if (!location) {
      alert("Pilih lokasi dulu ya");
      return;
    }

    if (!form.caption) {
      alert("Caption masih kosong");
      return;
    }

    setLoading(true);

    // Upload video dulu
    let videoUrl = null;

    if (file) {
      videoUrl = await uploadShortVideo(file);

      if (!videoUrl) {
        setLoading(false);
        return;
      }
    }

    // Ambil user internal id
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

    // Insert post
    await supabase.from("posts").insert({
      user_id: userRow.id,
      clerk_user_id: user.id,

      type: "content",

      city: location.address,

      caption: form.caption,
      description: form.description,

      event_date: form.event_date || null,

      video: videoUrl,

      status: "open",
    });

    setLoading(false);
    onBack();
  };

  // ========== RENDER ==========

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
              Buat Konten Video
            </h3>

            <p className="text-xs opacity-70">
              Bagikan momen dalam bentuk video pendek.
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-20">

        {/* UPLOAD VIDEO */}
        <div
          className="rounded-2xl border-dashed border-2
                     overflow-hidden
                     hover:bg-emerald-50 dark:hover:bg-white/5 transition"
        >
          <div
            className="relative h-64 cursor-pointer flex items-center justify-center"
            onClick={() => fileRef.current.click()}
          >
            {preview ? (
              <video
                src={preview}
                className="absolute inset-0 w-full h-full object-cover"
                controls
              />
            ) : (
              <span className="text-sm opacity-60 px-6 text-center">
                + Upload video pendek (max 60 detik)
              </span>
            )}
          </div>

          <div className="border-t border-white/10" />

          <textarea
            placeholder="Tulis caption utama..."
            value={form.caption}
            onChange={(e) =>
              setForm({ ...form, caption: e.target.value })
            }
            rows={2}
            className="w-full bg-transparent resize-none
                       px-4 py-3 text-sm font-semibold
                       focus:outline-none placeholder:opacity-60"
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          hidden
          onChange={handleVideo}
        />

        {/* DESKRIPSI */}
        <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
          <p className="text-xs opacity-60 mb-1">
            Cerita lengkap (opsional)
          </p>

          <textarea
            placeholder="Jelasin lebih detail di sini..."
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="w-full bg-transparent resize-none
                       text-sm focus:outline-none"
            rows={3}
          />
        </div>

        {/* LOKASI */}
        <LocationPicker
          label="Lokasi video"
          value={location}
          onSelect={setLocation}
        />

        {/* TANGGAL */}
        <div className="rounded-2xl border bg-white/70 dark:bg-white/5 px-4 py-3">
          <p className="text-xs opacity-60 mb-1">
            Tanggal kejadian (opsional)
          </p>

          <input
            type="date"
            value={form.event_date}
            onChange={(e) =>
              setForm({ ...form, event_date: e.target.value })
            }
            className="w-full bg-transparent text-sm font-semibold focus:outline-none"
          />
        </div>

        {/* ACTION */}
        <SlideToPosting onComplete={submit} />

      </div>
    </div>
  );
}
