import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";
import MarketProductCard from "../market/MarketProductCard";

export default function OutletProductList({ outlet, isOwner }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  async function loadCategories(outletId) {
    setCatLoading(true);

    try {
      const data = await apiFetch(`/categories?warung_id=${outletId}`);
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setCategories([]);
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

      try {
        const data = await apiFetch(`/products?warung_id=${outlet.id}`);

        const flattened = (Array.isArray(data) ? data : []).map((item) => ({
          ...item,
          warung_name: item.warung?.name || item.warung_name,
          warung_status: item.warung?.status || item.warung_status,
          warung_category: item.warung?.category || item.warung_category,
          owner_avatar: item.warung?.owner?.avatar_url || item.owner_avatar,
          owner_name: item.warung?.owner?.name || item.owner_name,
          category_name: item.categories?.name || item.category_name,
        }));
        setProducts(flattened);
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    };

    loadProducts();
  }, [outlet]);

  if (!outlet) return null;

  return (
    <div className="space-y-3">
      <button
        onClick={() => navigate(`/outlet/${outlet.id}`)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#4e73df] text-white py-3 text-[13px] font-semibold hover:bg-[#3d64c7] transition-colors shadow-sm"
      >
        Kelola {outlet.name}
        <ArrowRight size={14} />
      </button>

      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-[18px] font-bold tracking-tight text-slate-900">
            Daftar Item
          </h2>
          {/* <p className="mt-1 text-[12px] font-medium text-slate-400">
            Produk dari {outlet.name}
          </p>*/}
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-1.5 shadow-sm border border-slate-50">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4e73df] animate-pulse"></span>
          <span className="text-[11px] font-semibold text-slate-500">
            {products.length} item
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {products.map((product) => (
          <MarketProductCard
            key={product.id}
            product={product}
            isOwner={isOwner}
            categories={categories}
          />
        ))}

        {!loading && products.length === 0 && (
          <div>
            <p className="text-sm p-4 border rounded-xl text-center opacity-60">
              Belum ada produk di outlet ini
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center text-sm opacity-60">Memuat produk...</div>
        )}
      </div>
    </div>
  );
}
