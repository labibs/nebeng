import { useState, useEffect } from "react";
import { X, Package } from "lucide-react";
import { uploadPostImage } from "../../lib/uploadPostImage";
import { useLanguage } from "../../lib/LanguageContext";

export default function ItemModal({
  isOpen,
  onClose,
  onSend,
  initialData = {},
}) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 pb-2 flex items-center justify-between flex-shrink-0">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Package size={20} />
              {t("Detail Barang Titipan")}
            </h3>
            <button
              onClick={onClose}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <ItemForm
            initialData={initialData}
            t={t}
            onSend={onSend}
            onClose={onClose}
          />
        </div>
      </div>
    </>
  );
}

// Form terpisah agar lebih rapi
function ItemForm({ initialData, onSend, onClose, t }) {
  const [description, setDescription] = useState(initialData.description || "");
  const [weight, setWeight] = useState(initialData.weight || "");
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState(initialData.photos || []);
  const [uploading, setUploading] = useState(false);

  // Reset form when modal opens with new initial data
  useEffect(() => {
    setDescription(initialData.description || "");
    setWeight(initialData.weight || "");
    setPreviewUrls(initialData.photos || []);
    setFiles([]);
  }, [initialData]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Limit to 3 files
    const limitedFiles = selectedFiles.slice(0, 3 - files.length);

    setFiles((prev) => [...prev, ...limitedFiles]);

    // Create preview URLs
    const newPreviewUrls = limitedFiles.map((file) =>
      URL.createObjectURL(file),
    );
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      // Revoke the URL to free memory if it's a blob URL
      if (prev[index].startsWith("blob:")) {
        URL.revokeObjectURL(prev[index]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setUploading(true);

      let photoUrls = [...previewUrls]; // Keep existing photos

      // Upload only new files
      for (const file of files) {
        const photoUrl = await uploadPostImage(file);
        photoUrls.push(photoUrl);
      }

      // Format message with item details and photos
      const message = `[deal_barang_titipan]\n📦 Detail barang: ${description}\n⚖️ Ukuran & berat: ${weight}\n📸 Foto barang: ${photoUrls.join(", ")}`;

      onSend(message);
      handleClose();
    } catch (err) {
      console.error("Error uploading item photos:", err);
      alert(t("Gagal upload foto barang"));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    previewUrls.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
    setFiles([]);
    setPreviewUrls([]);
    setDescription("");
    setWeight("");
    onClose();
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-600">
            {t("Detail Barang")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("Jelaskan detail barang (merk, warna, kondisi, dll)")}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 resize-none"
            rows={3}
            required
          />
        </div>

        {/* Weight/Size */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-600">
            {t("Ukuran & Berat")}
          </label>
          <input
            type="text"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={t("Contoh: 30x20x10 cm, 2kg")}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
            required
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-600">
            {t("Foto Barang")} ({previewUrls.length}/3)
          </label>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={previewUrls.length >= 3}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 file:rounded-lg file:px-3 file:py-1 file:border-0 file:bg-blue-50 file:text-[#4e73df]"
          />

          {/* Preview Images */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Message */}
        {description && weight && (
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <p className="text-sm text-orange-700 whitespace-pre-wrap">
              📦 Detail barang: {description}
              {"\n"}
              ⚖️ Ukuran & berat: {weight}
              {"\n"}
              📸 Foto barang:{" "}
              {previewUrls.length > 0
                ? `${previewUrls.length} foto`
                : t("Tidak ada foto")}
            </p>
          </div>
        )}
      </form>

      <div className="p-4 border-t border-slate-200 flex-shrink-0 bg-white pb-8">
        <button
          onClick={handleSubmit}
          disabled={uploading || !description.trim() || !weight.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4e73df] text-white py-3 text-[13px] font-semibold hover:bg-[#3d64c7] transition-colors shadow-sm disabled:opacity-50"
        >
          {uploading ? t("Mengupload...") : t("Kirim Detail")}
        </button>
      </div>
    </>
  );
}
