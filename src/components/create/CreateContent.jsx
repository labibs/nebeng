import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../../lib/supabaseClient";
import { uploadShortVideo } from "../../lib/uploadShotVideo";

export default function CreateContent({ onBack }) {
  const { user } = useUser();
  const [caption, setCaption] = useState("");
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);

    const { videoUrl, thumbnailUrl } = await uploadShortVideo(video, {
      maxDuration: 30,
      maxWidth: 720,
      format: "mp4",
      quality: "eco",
    });

    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    await supabase.from("posts").insert({
      user_id: userRow.id,
      clerk_user_id: user.id,
      type: "content",
      description: caption,
      item_photo: thumbnailUrl,
      status: "published",
    });

    setLoading(false);
    onBack();
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack}>← Kembali</button>
      <h2 className="text-lg font-bold">Buat Konten</h2>

      <input type="file" accept="video/*" onChange={e => setVideo(e.target.files[0])} />
      <textarea placeholder="Tulis caption..." onChange={e => setCaption(e.target.value)} />

      <button onClick={submit} disabled={loading} className="btn btn-success w-full">
        {loading ? "Mengunggah..." : "Posting"}
      </button>
    </div>
  );
}
