export async function uploadPostImage(
  file,
  {
    maxWidth = 1024,
    quality = 0.75,
    folder = "numpak/images",
  } = {}
) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // 🔹 1. Convert & compress image di browser
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(maxWidth / bitmap.width, 1);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, "image/webp", quality)
  );

  // 🔹 2. Upload ke Cloudinary
  const formData = new FormData();
  formData.append("file", blob, "image.webp");
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!data.secure_url) {
    throw new Error("Upload ke Cloudinary gagal");
  }

  return data.secure_url; // ✅ webp + compressed
}
