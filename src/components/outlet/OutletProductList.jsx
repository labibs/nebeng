import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import OutletProductCard from "./OutletProductCard";

export default function OutletProductList({ outlet, isOwner }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!outlet) {
      setProducts([]);
      return;
    }

    const loadProducts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("warung_products")
        .select("*")
        .eq("warung_id", outlet.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    };

    loadProducts();
  }, [outlet]);

  if (!outlet) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">
        Produk — {outlet.name}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <OutletProductCard key={product.id} product={product} isOwner={isOwner} />
        ))}

        {!loading && products.length === 0 && (
          <div className="col-span-2">
            <p className="text-sm p-4 border rounded-xl text-center opacity-60">
              Belum ada produk di outlet ini, silahkan klik tombol + Tambah Produk
            </p>
          </div>
        )}

        {loading && (
          <div className="col-span-2 text-center text-sm opacity-60">
            Memuat produk...
          </div>
        )}
      </div>
    </div>
  );
}
