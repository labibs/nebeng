// src/components/CartIconButton.jsx
import { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { apiFetch } from "../../lib/apiClient";
import { useUser } from "@clerk/clerk-react";

export default function CartIconButton({ className = "" }) {
    const { user } = useUser();
    const navigate = useNavigate();
    const [count, setCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchCartCount = async () => {
        if (!user) {
            setCount(0);
            setLoading(false);
            return;
        }

        try {
            const items = await apiFetch("/api/cart");
            setCount(Array.isArray(items) ? items.length : 0);
        } catch (err) {
            console.error("Gagal ambil jumlah cart:", err);
            setCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCartCount();

        const handleItemAdded = () => {
            setCount((prev) => prev + 1);
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 800);
        };

        window.addEventListener("cart:item-added", handleItemAdded);

        return () => {
            window.removeEventListener("cart:item-added", handleItemAdded);
        };
    }, [user]);

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`cart:${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "warung_cart_items",
                },
                fetchCartCount,
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const handleClick = () => {
        if (!user) return navigate("/login");
        navigate("/cart");
    };

    return (
        <button
            onClick={handleClick}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 
                       text-gray-700 dark:text-gray-300 active:scale-95 transition-all 
                       relative ${className}`}
            aria-label="Keranjang Nitip"
        >
            <ShoppingCart
                size={20}
                className={`transition-transform duration-300 ${
                    isAnimating ? "animate-fly-to-cart" : ""
                }`}
            />

            {!loading && count > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-500 text-white 
                               text-[10px] font-bold min-w-[18px] h-[18px] 
                               flex items-center justify-center rounded-full px-1 
                               border-2 border-white dark:border-slate-900 shadow-sm transition-all duration-300 ${isAnimating ? "scale-125" : "scale-100"}`}>
                    {count > 99 ? "99+" : count}
                </span>
            )}

            {loading && (
                <span className="absolute -top-1 -right-1 bg-gray-400 text-white 
                               text-[9px] font-bold w-4 h-4 rounded-full animate-pulse" />
            )}
        </button>
    );
}
