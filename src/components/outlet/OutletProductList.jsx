import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import MarketProductCard from "../market/MarketProductCard";

export default function OutletProductList({ outlet, isOwner }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  async function loadCategories(outletId) {
    setCatLoading(true);

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("warung_id", outletId)
      .order("created_at");

    if (error) {
      console.error(error);
      setCategories([]);
    } else {
      setCategories(data || []);
    }

    setCatLoading(false);
  }

  useEffect(() => {
    if (!outlet) {
      setProducts([]);
      setCategories([]);
      return;
    }

    // Load Categories
    loadCategories(outlet.id);

    // Load Products
    const loadProducts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("warung_products")
        .select(`
          id,
          name,
          estimated_price,
          image_url,
          rating,
          is_estimated,
          created_at,
          categories:category_id ( name ),
          warung:warungs!inner ( name, category, status )
        `)
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
          <MarketProductCard key={product.id} product={product} isOwner={isOwner} categories={categories} />
        ))}

        {!loading && products.length === 0 && (
          <div className="col-span-2">
            <p className="text-sm p-4 border rounded-xl text-center opacity-60">
              Belum ada produk di outlet ini
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
