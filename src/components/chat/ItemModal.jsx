import { useState } from 'react';
import { uploadPostImage } from '../../lib/uploadPostImage';

export default function ItemModal({ isOpen, onClose, onSend }) {
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

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
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      let photoUrls = [];
      
      // Upload all images
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
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviewUrls([]);
    setDescription('');
    setWeight('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="p-6 border-b border-base-300">
            <h2 className="text-xl font-bold text-center">Detail Barang Titipan</h2>
            <p className="text-sm text-center opacity-70 mt-1">
              Kirim detail dan foto barang yang akan dititipkan
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
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
                Foto Barang ({files.length}/3)
              </label>
              
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={files.length >= 3}
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

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 btn btn-outline"
                disabled={uploading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 btn btn-primary"
                disabled={uploading || !description.trim() || !weight.trim()}
              >
                {uploading ? 'Mengupload...' : 'Kirim Detail'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}