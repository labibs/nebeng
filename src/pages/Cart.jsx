import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { ShoppingCart } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import CartHeader from "../components/cart/CartHeader";

export default function Cart() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        async function fetchCart() {
            const { data, error } = await supabase
                .from("warung_cart_items")
                .select(`
                    id,
                    quantity,
                    requested_price,
                    estimated_price,
                    notes,
                    status,
                    product:product_id ( name, image_url, estimated_price ),
                    warung:warung_id ( name, address )
                `)
                .eq("user_id", user.id)
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (error) {
                console.error(error);
            } else {
                setItems(data || []);
            }
            setLoading(false);
        }

        fetchCart();
    }, [user, navigate]);

    if (!user) return null;

    return (
        <>
        <CartHeader />
        <div className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-200 dark:from-slate-900 dark:to-slate-800 p-4">
            

            {loading ? (
                <p className="text-center">Memuat...</p>
            ) : items.length === 0 ? (
                <div className="text-center py-10 text-gray-600 dark:text-gray-400">
                    <ShoppingCart size={64} className="mx-auto mb-4 opacity-50" />
                    <p>Belum ada barang yang kamu nitipkan</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex gap-4"
                        >
                            <img
                                src={item.product?.image_url || "https://via.placeholder.com/80"}
                                alt={item.product?.name}
                                className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <h4 className="font-semibold">{item.product?.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {item.warung?.name} • {item.warung?.address?.substring(0, 40)}...
                                </p>
                                <p className="text-sm mt-1">
                                    Qty: {item.quantity} • Estimasi Rp{" "}
                                    {Number(item.estimated_price || 0).toLocaleString("id-ID")}
                                </p>
                                {item.notes && (
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">
                                        Catatan: {item.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        </>
    );
}