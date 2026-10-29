import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/apiClient";
import DetailProductHeader from "./DetailProductHeader";
import { motion } from "framer-motion";
import LoadingLogo from "../LoadingLogo";

export default function DetailImage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImage() {
      setLoading(true);
      try {
        const data = await apiFetch(`/products/${id}`);
        if (data) {
          setImageUrl(data.image_url);
        }
      } catch (error) {
        console.error("Error fetching image:", error);
      }
      setLoading(false);
    }

    if (id) {
      fetchImage();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7ff]">
        <LoadingLogo size="w-20 h-20" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-emerald-200
        dark:from-slate-900 dark:to-slate-800
        transition-transform gap-4"
      >
        <p className="text-gray-500">Gambar tidak ditemukan</p>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:underline"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 500 }}
      className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-200
        dark:from-slate-900 dark:to-slate-800
        transition-transform flex flex-col"
    >
      <div className="bg-white">
        <DetailProductHeader title="Detail Image" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <img
          src={imageUrl}
          alt="Product Detail"
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
      </div>
    </motion.div>
  );
}
