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
      className={`group relative flex items-center justify-center p-2 rounded-full transition-all active:scale-90 ${className}`}
      aria-label="Keranjang Nitip"
    >
      <div className="relative">
        <ShoppingCart
          size={24}
          strokeWidth={2.5}
          className={`transition-all duration-300 group-hover:scale-110 ${
            isAnimating ? "animate-bounce text-emerald-500" : ""
          }`}
        />

        {!loading && count > 0 && (
          <span
            className={`absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-[0_4px_10px_rgba(239,68,68,0.4)] ring-2 ring-white transition-all duration-300 ${isAnimating ? "scale-125 rotate-12" : "scale-100"}`}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </div>

      {loading && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
        </span>
      )}
    </button>
  );
}
