import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ArrowLeft, Save, Trash2, Camera } from "lucide-react";
import Swal from "sweetalert2";

export default function EditPost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [description, setDescription] = useState("");
  const [fee, setFee] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");

  useEffect(() => {
    async function fetchPost() {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (!error && data) {
        setPost(data);
        setDescription(data.description || "");
        setFee(data.fee || "");
        setFromCity(data.from_city || "");
        setToCity(data.to_city || "");
      }
      setLoading(false);
    }
    fetchPost();
  }, [postId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({
          description,
          fee: parseInt(fee),
          from_city: fromCity,
          to_city: toCity
        })
        .eq("id", postId);

      if (error) throw error;

      Swal.fire({
        title: "Berhasil!",
        text: "Postingan telah diperbarui.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false
      });
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Hapus Postingan?",
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f43f5e",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (!error) {
        navigate("/profile");
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fbff]">
      <div className="w-10 h-10 border-4 border-[#4e73df] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!post) return <div className="p-10 text-center">Postingan tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">Edit Postingan</h1>
        </div>
        <button onClick={handleDelete} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
          <Trash2 size={20} />
        </button>
      </div>

      {/* Image Preview - Full View */}
      <div className="w-full h-64 bg-slate-100 relative overflow-hidden flex items-center justify-center">
        <img
          src={post.item_photo || "https://beritabeta.com/storage/img/2020/06/jastip-ota-ok-17668.jpg"}
          className="w-full h-full object-contain"
          alt="Preview"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="bg-white/90 p-3 rounded-full shadow-lg text-[#4e73df]">
            <Camera size={24} />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#4e73df]/20 outline-none transition-all min-h-[120px]"
              placeholder="Ceritakan tentang postinganmu..."
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Ongkos (Rp)</label>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#4e73df]/20 outline-none transition-all"
              placeholder="Contoh: 10000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Kota Asal</label>
              <input
                type="text"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#4e73df]/20 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Kota Tujuan</label>
              <input
                type="text"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#4e73df]/20 outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-16 rounded-[24px] bg-[#4e73df] text-white font-black text-lg shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {saving ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={20} />}
          Simpan Perubahan
        </button>
      </div>
    </div>
  );
}
