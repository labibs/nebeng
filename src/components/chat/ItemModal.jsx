import { useState, useEffect } from 'react';
import { uploadPostImage } from '../../lib/uploadPostImage';

export default function ItemModal({ isOpen, onClose, onSend, initialData = {} }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="bg-base-100 rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-base-300 rounded-full" />
          </div>

          <div className="px-6 pt-2 pb-4 text-center">
            <h3 className="text-xl font-bold">Detail Barang Titipan</h3>
            <p className="text-sm text-base-content/70 mt-1">Kirim detail dan foto barang yang akan dititipkan</p>
          </div>

          <ItemForm initialData={initialData} onSend={onSend} onClose={onClose} />
        </div>
      </div>
    </>
  );
}

// Form terpisah agar lebih rapi
function ItemForm({ initialData, onSend, onClose }) {
  const [description, setDescription] = useState(initialData.description || '');
  const [weight, setWeight] = useState(initialData.weight || '');
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState(initialData.photos || []);
  const [uploading, setUploading] = useState(false);

  // Reset form when modal opens with new initial data
  useEffect(() => {
    setDescription(initialData.description || '');
    setWeight(initialData.weight || '');
    setPreviewUrls(initialData.photos || []);
    setFiles([]);
  }, [initialData]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Limit to 3 files
    const limitedFiles = selectedFiles.slice(0, 3 - files.length);
    
    setFiles(prev => [...prev, ...limitedFiles]);
    
    // Create preview URLs
    const newPreviewUrls = limitedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      // Revoke the URL to free memory if it's a blob URL
      if (prev[index].startsWith('blob:')) {
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
      const message = `[deal_barang_titipan]\n📦 Detail barang: ${description}\n⚖️ Ukuran & berat: ${weight}\n📸 Foto barang: ${photoUrls.join(', ')}`;
      
      onSend(message);
      handleClose();
      
    } catch (err) {
      console.error('Error uploading item photos:', err);
      alert('Gagal upload foto barang');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    previewUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setFiles([]);
    setPreviewUrls([]);
    setDescription('');
    setWeight('');
    onClose();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Detail Barang
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan detail barang (merk, warna, kondisi, dll)"
            className="w-full px-3 py-2 border border-base-300 rounded-xl bg-base-100 resize-none"
            rows={3}
            required
          />
        </div>

        {/* Weight/Size */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Ukuran & Berat
          </label>
          <input
            type="text"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Contoh: 30x20x10 cm, 2kg"
            className="w-full px-3 py-2 border border-base-300 rounded-xl bg-base-100"
            required
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Foto Barang ({previewUrls.length}/3)
          </label>
          
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={previewUrls.length >= 3}
            className="w-full px-3 py-2 border border-base-300 rounded-xl bg-base-100 file:rounded-lg file:px-3 file:py-1 file:border-0 file:bg-orange-100 file:text-orange-900"
          />
          
          {/* Preview Images */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-base-300"
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
          <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-2xl border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-base-content/80 whitespace-pre-wrap">
              📦 Detail barang: {description}{'\n'}
              ⚖️ Ukuran & berat: {weight}{'\n'}
              📸 Foto barang: {previewUrls.length > 0 ? `${previewUrls.length} foto` : 'Tidak ada foto'}
            </p>
          </div>
        )}
      </form>

      <div className="flex gap-3 px-6 pb-8">
        <button onClick={handleClose} className="flex-1 btn btn-ghost btn-lg rounded-2xl">
          Batal
        </button>
        <button
          onClick={handleSubmit}
          disabled={uploading || !description.trim() || !weight.trim()}
          className="flex-1 btn btn-primary btn-lg rounded-2xl text-white font-bold shadow-lg disabled:opacity-50"
        >
          {uploading ? 'Mengupload...' : 'Kirim Detail'}
        </button>
      </div>
    </>
  );
}