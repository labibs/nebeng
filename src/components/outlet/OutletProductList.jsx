import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import OutletProductCard from "./OutletProductCard";

export default function OutletProductList({ outlet }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!outlet) return;

    const loadProducts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("warung_products")
        .select("*")
        .eq("warung_id", outlet.id)
        .order("created_at", { ascending: false });

      if (!error) setProducts(data || []);
      setLoading(false);
    };

    loadProducts();
  }, [outlet]);

  if (!outlet) {
    return (
      <div className="text-sm opacity-60 text-center">
        Pilih outlet untuk melihat dan menambah produk
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">
        Produk — {outlet.name}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* produk */}
        {products.map((product) => (
          <OutletProductCard key={product.id} product={product} />
        ))}

        {/* outlet dipilih tapi belum ada produk */}
        {!loading && products.length === 0 && (
          <div className="col-span-2 text-center space-y-2">
            <p className="text-sm opacity-60">
              Belum ada produk di outlet ini, silahkan klik tombol +
            </p>
            
          </div>
        )}
      </div>
    </div>
  );
}
