import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import DetailProductHeader from "./DetailProductHeader";
import { motion } from "framer-motion";
import { ArrowRightLeft, MessageCircle, Route, ShoppingCart, MapPin, User, ChevronRight, UserRoundPlus, SquareCheckBig } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import OutletRouteViewer from "../market/OutletRouteViewer";
import GoogleMapsPointViewer from "../GoogleMapsViewer";

export default function DetailProduct() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openRoute, setOpenRoute] = useState(false);
    const [openMaps, setOpenMaps] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [cartMessage, setCartMessage] = useState(null); // untuk toast / alert sementara

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

    async function handleAddToCart() {
        if (!user) {
            navigate("/login");
            return;
        }

        if (user.id === product.owner_id) {
            alert("Ini produk dari outlet kamu sendiri");
            return;
        }

        setIsAddingToCart(true);
        setCartMessage(null);

        try {
            // Cek apakah item ini sudah ada di cart (pending)
            const { data: existing, error: fetchErr } = await supabase
                .from("warung_cart_items")
                .select("*")
                .eq("user_id", user.id)
                .eq("product_id", product.id)
                .eq("status", "pending")
                .maybeSingle();

            if (fetchErr) throw fetchErr;

            if (existing) {
                // Jika sudah ada, tambahkan quantity saja
                const newQty = Number(existing.quantity || 0) + 1;
                const { data: updated, error: updateErr } = await supabase
                    .from("warung_cart_items")
                    .update({
                        quantity: newQty,
                        // update harga estimasi jika perlu, gunakan nilai produk terbaru jika tersedia
                        requested_price: product.estimated_price || existing.requested_price,
                        estimated_price: product.estimated_price || existing.estimated_price
                    })
                    .eq("id", existing.id)
                    .select()
                    .single();

                if (updateErr) throw updateErr;

                setCartMessage("Jumlah produk berhasil ditambahkan di keranjang");
                // Jangan dispatch 'cart:item-added' karena ini bukan item baru (agar badge tidak bertambah)
                // Tetapi dispatch event khusus jika ingin trigger animasi/feedback
                const evt = new CustomEvent('cart:item-updated', { detail: { productId: product.id, action: 'increment' } });
                window.dispatchEvent(evt);
            } else {
                // Jika belum ada, insert baru
                const { data, error } = await supabase
                    .from("warung_cart_items")
                    .insert({
                        user_id: user.id,
                        warung_id: product.warung_id,
                        product_id: product.id,
                        quantity: 1,
                        requested_price: product.estimated_price || null,
                        estimated_price: product.estimated_price || null,
                        notes: null,
                        status: "pending"
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Sukses insert
                setCartMessage("Produk berhasil disimpan ke daftar nitip!");

                // Dispatch event agar CartIconButton di header langsung update badge + animasi
                const event = new CustomEvent('cart:item-added', {
                    detail: { productId: product.id } // optional, bisa dipakai untuk log atau validasi nanti
                });
                window.dispatchEvent(event);
            }

        } catch (err) {
            console.error("Gagal menambahkan ke cart:", err);
            setCartMessage("Gagal menyimpan. Coba lagi nanti.");
            alert("Gagal menyimpan nitip: " + (err.message || "Unknown error"));
        } finally {
            setIsAddingToCart(false);
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
                    warung:warungs ( 
                        *,
                        owner:users!warungs_created_by_clerk_id_fkey (
                            avatar_url,
                            name
                        )
                    )
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
                    warung_id: data.warung?.id,
                    warung_name: data.warung?.name || "-",
                    warung_address: data.warung?.address || "-",
                    warung_description: data.warung?.description || "-",
                    warung_category: data.warung?.category || "-",
                    warung_latitude: data.warung?.latitude || "-",
                    warung_longitude: data.warung?.longitude || "-",
                    warung_image_url: data.warung?.image_url || "-",
                    warung_from_lat: data.warung?.from_lat || "-",
                    warung_from_lng: data.warung?.from_lng || "-",
                    warung_to_lat: data.warung?.to_lat || "-",
                    warung_to_lng: data.warung?.to_lng || "-",
                    warung_status: data.warung?.status || "-",
                    owner_id: data.warung?.created_by_clerk_id || data.created_by_clerk_id,
                    owner_name: data.warung?.owner?.name || "-",
                    owner_avatar_url: data.warung?.owner?.avatar_url
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-200
        dark:from-slate-900 dark:to-slate-800
        transition-transform">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 bg-gradient-to-br from-green-100 to-emerald-200
        dark:from-slate-900 dark:to-slate-800
        transition-transform gap-4">
                <p className="text-gray-500 dark:text-gray-400">Produk tidak ditemukan</p>
                <button
                    onClick={() => navigate(-1)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                    Kembali
                </button>
            </div>
        );
    }

    const iconByStatus = () => {
        if (product.warung_status === "kurir") return "🛵";
        if (product.warung_status === "pembeli") return "🧺";
        return "🛒";
    };

    const keteranganByStatus = () => {
        if (product.warung_status === "kurir") return "Mau Nitip";
        if (product.warung_status === "pembeli" && product.category === "Jasa") return "Anterin Kesini";
        if (product.warung_status === "pembeli" && product.category !== "Jasa") return "Beliin Kesini";
        return "Nitip Sekarang";
    };

    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-200
        dark:from-slate-900 dark:to-slate-800
        transition-transform pb-24"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
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
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-base-100 dark:from-slate-900 to-transparent backdrop-blur-[1px]" />
            {/* PRODUCT TITLE SECTION */}
            <div className="px-4 pt-4 pb-2">
                {/* Category */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <span className="font-medium">{product.category_name}</span>

                    {/* Price */}
                    <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                            Rp {Number(product.estimated_price || 0).toLocaleString("id-ID")}
                        </p>
                        {product.is_estimated && (
                            <p className="text-[10px] text-orange-500 italic mt-0.5">
                                *Harga ini adalah estimasi
                            </p>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
                    {product.name}
                </h1>

                {/* Stats & Price Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Rating Pill */}
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border dark:border-slate-700 shadow-sm">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{product.rating || "New"}</span>
                        </div>

                        {/* Reviews Pill */}
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-full text-gray-600 dark:text-gray-300 border dark:border-slate-700 shadow-sm">
                            <ArrowRightLeft size={14} className="fill-gray-600 dark:fill-gray-400" />
                            <span className="text-sm font-medium">{product.review_count || 0} Transaksi</span>
                        </div>
                    </div>

                    {/* ===== BUTTON MAPS ===== */}
                    <div className="text-right">
                        {product.warung_status !== 'milik' && (
                            <button onClick={() => setOpenRoute(true)}
                                className="flex items-center gap-1 bg-green-50 dark:bg-slate-800 text-green-600 px-3 py-2 rounded-full hover:bg-green-100 transition-colors border dark:border-slate-700 shadow-sm">
                                <Route size={14} className="stroke-green-600" />
                                <span className="text-sm font-semibold">Cek Rute</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="p-4 space-y-6">


                {/* Description */}
                <div>
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Deskripsi</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                        {product.warung_description || "Belum ada deskripsi produk ini."}
                    </p>
                </div>

                {/* REVIEWS */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Ulasan Pelanggan
                        </h3>
                        <button className="text-xs text-green-600/70 dark:text-green-600/70 font-medium flex items-center gap-0.5">
                            Lihat semua <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Rating Summary */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {product.rating || 5}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            <div>⭐⭐⭐⭐⭐</div>
                            <div>{product.review_count || 2} ulasan</div>
                        </div>
                    </div>

                    {/* Review List */}
                    <div className="space-y-3">
                        {[1, 2].map((_, i) => (
                            <div key={i} className="border rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 rounded-full bg-gray-200" />
                                    <p className="text-xs font-medium">Pembeli</p>
                                    <span className="text-[10px] text-gray-400">⭐ 5</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Barang sesuai, cepat dikirim 👍
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Outlet Section */}

                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="font-bold text-gray-900 dark:text-white">Outlet {user?.id !== product.owner_id && (`& Owner`)}</h3>
                        <button
                            onClick={() => navigate(`/outlet/${product.warung_id}`)}
                            className="text-xs text-green-600/70 dark:text-green-600/70 font-semibold flex items-center gap-0.5"
                        >
                            Kunjungi Outlet <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="bg-green-100 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Outlet Info */}
                        <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                                {product.warung_image_url ? (
                                    <img src={product.warung_image_url} alt={product.warung_name} className="w-full h-full object-cover" />
                                ) : (
                                    "🏪"
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{product.warung_name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{product.warung_address}</p>
                            </div>
                            <button
                                onClick={() => setOpenMaps(true)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
                            >
                                <MapPin size={24} />
                            </button>
                        </div>
                        {user?.id !== product.owner_id && (
                            <div className="p-4 flex items-center gap-3 border-b border-gray-50 dark:border-slate-800">
                                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                                    {product.owner_avatar_url ? (
                                        <img src={product.owner_avatar_url} alt={product.owner_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={28} className="text-indigo-300 dark:text-indigo-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{product.owner_name}</p>
                                        <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold">Verifikasi</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Owner Terpercaya</p>
                                </div>
                                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 active:scale-95 transition-all">
                                    <UserRoundPlus size={24} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BOTTOM ACTION */}
            {user?.id !== product.owner_id && (
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900
                           px-4 py-3 flex gap-3 z-50 shadow-sm dark:border-slate-800">

                    {/* Chat */}
                    <button
                        onClick={() => startChatWith(product.owner_id)}
                        className="w-12 h-12 border border-gray-200 dark:border-slate-700 rounded-xl
                               flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 transition-all">
                        <MessageCircle size={24} />
                    </button>

                    {/* Add to Cart */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                        className={`flex-1 border border-gray-200 dark:border-slate-700 rounded-xl
                                flex items-center justify-center gap-2 text-sm font-semibold
                                ${isAddingToCart 
                                    ? "text-gray-400 cursor-not-allowed" 
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95"}
                                transition-all`}
                    >
                        <ShoppingCart size={18} />
                        <span>
                            {isAddingToCart ? "Menyimpan..." : "Simpan dulu"}
                        </span>
                    </button>

                    {/* Buy Now */}
                    <button className="flex-1 rounded-xl bg-green-600/70 text-white
                               py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 active:scale-95 transition-all">
                        <SquareCheckBig size={18} />
                        <span className="text-white">
                            {keteranganByStatus()}
                        </span>
                    </button>
                </div>
            )}

            {product.warung_id && (
                <OutletRouteViewer
                    open={openRoute}
                    setOpen={setOpenRoute}
                    outletId={product.warung_id}
                />
            )}

            {product.warung_id && (
                <GoogleMapsPointViewer
                    open={openMaps}
                    setOpen={setOpenMaps}
                    latitude={product.warung_latitude}
                    longitude={product.warung_longitude}
                    address={product.warung_address}
                    title={product.warung_name}
                />
            )}
        </motion.div>
    );
}
