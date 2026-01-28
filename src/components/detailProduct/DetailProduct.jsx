import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import DetailProductHeader from "./DetailProductHeader";
import { motion } from "framer-motion";
import { MessageCircle, ShoppingCart } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

export default function DetailProduct() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    async function startChatWith(targetClerkId) {
        if (!user) {
            navigate("/login");
            return;
        }

        if (!targetClerkId) {
            console.error("No target user found");
            return;
        }

        if (user.id === targetClerkId) {
            alert("Anda tidak bisa chat dengan diri sendiri");
            return;
        }

        try {
            // 1. Check existing conversation
            const { data: myConvs } = await supabase
                .from("conversation_participants")
                .select("conversation_id")
                .eq("user_id", user.id);

            const conversationIds = myConvs?.map(c => c.conversation_id) || [];

            if (conversationIds.length > 0) {
                const { data: existing } = await supabase
                    .from("conversation_participants")
                    .select("conversation_id")
                    .eq("user_id", targetClerkId)
                    .in("conversation_id", conversationIds)
                    .maybeSingle();

                if (existing) {
                    navigate(`/chat/${existing.conversation_id}`);
                    return;
                }
            }

            // 2. Create new conversation if not exists
            const { data: newConv, error: createError } = await supabase
                .from("conversations")
                .insert({ is_group: false })
                .select()
                .single();

            if (createError) throw createError;

            // 3. Add participants
            await supabase
                .from("conversation_participants")
                .insert([
                    { conversation_id: newConv.id, user_id: user.id },
                    { conversation_id: newConv.id, user_id: targetClerkId }
                ]);

            navigate(`/chat/${newConv.id}`);

        } catch (error) {
            console.error("Error starting chat:", error);
            alert("Gagal memulai chat");
        }
    }

    useEffect(() => {
        async function fetchProduct() {
            setLoading(true);
            const { data, error } = await supabase
                .from("warung_products")
                .select(`
                    *,
                    categories:category_id ( name ),
                    warung:warungs ( name, address, created_by_clerk_id )
                `)
                .eq("id", id)
                .single();

            if (error) {
                console.error("Error fetching product:", error);
                setLoading(false);
                return;
            }

            if (data) {
                setProduct({
                    ...data,
                    category_name: data.categories?.name || "Produk",
                    warung_name: data.warung?.name || "-",
                    warung_address: data.warung?.address || "-",
                    owner_id: data.warung?.created_by_clerk_id || data.created_by_clerk_id
                });
            }
            setLoading(false);
        }

        if (id) {
            fetchProduct();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
                <p className="text-gray-500">Produk tidak ditemukan</p>
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
            className="pb-24 bg-white min-h-screen"
        >

            {/* HEADER */}
            <DetailProductHeader />

            {/* HERO IMAGE */}
            <div
                className="relative h-72 w-full cursor-pointer"
                onClick={() => navigate(`/product/${id}/image`)}
            >
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                {/* Category */}
                <div className="absolute top-4 left-4 text-xs px-3 py-1 rounded-full
                        bg-black/60 text-white backdrop-blur-sm">
                    {product.category_name}
                </div>

                {/* Title */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h1 className="text-xl font-bold leading-tight">
                        {product.name}
                    </h1>
                    <p className="text-xs opacity-80 mt-1 flex items-center gap-1">
                        ⭐ {product.rating || 0} · Transaksi {product.transaction_count || 0}
                    </p>
                </div>
            </div>

            {/* CONTENT */}
            <div className="p-4 space-y-6">

                {/* Price */}
                <div className="border-b pb-4">
                    <p className="text-xs text-gray-500 mb-1">Estimasi Harga</p>
                    <p className="text-2xl font-bold text-green-600">
                        Rp {Number(product.estimated_price || 0).toLocaleString("id-ID")}
                    </p>
                    {product.is_estimated && (
                        <p className="text-[10px] text-orange-500 mt-1 bg-orange-50 inline-block px-2 py-0.5 rounded">
                            *Harga ini adalah estimasi
                        </p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <h3 className="font-semibold mb-2 text-gray-900">Deskripsi</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {product.description || "Belum ada deskripsi produk ini."}
                    </p>
                </div>

                {/* Writer/Seller Info */}
                <div>
                    <h3 className="font-semibold mb-3 text-gray-900">Penjual / Warung</h3>
                    <div
                        onClick={() => navigate(`/outlet/${product.warung_id}`)}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm border
                              flex items-center justify-center text-2xl">
                            🛵
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">
                                {product.warung?.name || (product.created_by_clerk_id ? "User Pribadi" : "Warung Tetangga")}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {product.warung_address}
                            </p>
                        </div>
                        {/* <button className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-medium">
                            Kunjungi
                        </button> */}
                    </div>
                </div>
            </div>

            {/* BOTTOM ACTION */}
            <div className="fixed bottom-0 left-0 right-0 bg-white
                       px-4 py-3 flex gap-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">

                {/* Chat */}
                <button
                    onClick={() => startChatWith(product.owner_id)}
                    className="w-12 h-12 border border-gray-200 rounded-xl
                           flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">
                    <MessageCircle size={24} />
                </button>

                {/* Add to Cart */}
                <button className="flex-1 border border-gray-200 rounded-xl
                           flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">
                    <ShoppingCart size={18} />
                    <span>Simpan dulu</span>
                </button>

                {/* Buy Now */}
                <button className="flex-1 rounded-xl bg-[#6366F1] text-white
                           py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-all">
                    Nitip Ini
                </button>
            </div>
        </motion.div>
    );
}
