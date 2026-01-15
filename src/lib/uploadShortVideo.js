import { supabase } from "./supabaseClient";

export const uploadShortVideo = async (file, options = {}) => {
  try {
    const ext = file.name.split(".").pop();
    const fileName = `short_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("posts")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from("posts")
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;

  } catch (err) {
    console.error("Upload video error:", err);
    alert("G	trigger gagal upload video");
    return null;
  }
};