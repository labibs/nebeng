export async function uploadShortVideo(file) {
  if (!file) throw new Error("No video file");

  // Validasi durasi (client side hint)
  const video = document.createElement("video");
  video.preload = "metadata";
  video.src = URL.createObjectURL(file);

  await new Promise(resolve => (video.onloadedmetadata = resolve));

  if (video.duration > 30) {
    throw new Error("Video maksimal 30 detik");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_VIDEO_PRESET);
  formData.append("folder", "nebeng/videos");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload`,
    { method: "POST", body: formData }
  );

  const data = await res.json();

  // Cloudinary auto compress & transcode
  const videoUrl = data.secure_url.replace(
    "/upload/",
    "/upload/f_mp4,q_auto:eco,w_720/"
  );

  // Generate thumbnail
  const thumbnailUrl = data.secure_url.replace(
    "/upload/",
    "/upload/so_0,f_webp,q_auto,w_480/"
  );

  return {
    videoUrl,
    thumbnailUrl,
  };
}
