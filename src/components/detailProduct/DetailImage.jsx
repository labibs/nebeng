import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import DetailProductHeader from "./DetailProductHeader";
import { motion } from "framer-motion";

export default function DetailImage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchImage() {
            setLoading(true);
            const { data, error } = await supabase
                .from("warung_products")
                .select("image_url")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Error fetching image:", error);
            } else if (data) {
                setImageUrl(data.image_url);
            }
            setLoading(false);
        }

        if (id) {
            fetchImage();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-200
        dark:from-slate-900 dark:to-slate-800
        transition-transform">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            </div>
        );
    }

    if (!imageUrl) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-emerald-200
        dark:from-slate-900 dark:to-slate-800
        transition-transform gap-4">
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
