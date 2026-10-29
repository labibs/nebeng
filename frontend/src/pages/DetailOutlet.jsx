import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { useUser } from "@clerk/clerk-react";

import OutletHeader from "../components/detailOutlet/OutletHeader";
import OutletInfoCard from "../components/detailOutlet/OutletInfoCard";
import CategoryChips from "../components/detailOutlet/CategoryChips";
import ProductGrid from "../components/detailOutlet/ProductGrid";
import AddProductBottomSheet from "../components/detailOutlet/AddProductBottomSheet";

export default function DetailOutlet() {
  const { id } = useParams();
  const [outlet, setOutlet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [openAddProduct, setOpenAddProduct] = useState(false);

  const { user } = useUser();

  const isOwner = outlet && user && outlet.created_by_clerk_id === user.id;

  async function loadCategories(outletId) {
    setCatLoading(true);

    try {
      const data = await apiFetch('/categories?warung_id=' + outletId);
      setCategories(data || []);
    } catch (error) {
      console.error(error);
      setCategories([]);
    }

    setCatLoading(false);
  }

  function handleCategoryChange(cat) {
    if (cat._delete) {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } else {
      setCategories((prev) => {
        const exists = prev.find((c) => c.id === cat.id);
        return exists
          ? prev.map((c) => (c.id === cat.id ? cat : c))
          : [...prev, cat];
      });
    }
  }

  async function loadOutletById(outletId) {
    setLoading(true);

    try {
      const data = await apiFetch('/warungs/' + outletId);
      setOutlet(data);
    } catch (error) {
      console.error(error);
      setOutlet(null);
    }

    setLoading(false);
  }

  async function loadProducts({ outletId, categoryId = null }) {
    if (!outletId) return;

    setProductLoading(true);

    try {
      let url = '/products?warung_id=' + outletId;
      if (categoryId) {
        url += '&category_id=' + categoryId;
      }

      const data = await apiFetch(url);

      // flatten data to match MarketProductCard expected format
      const mapped = (data || []).map((p) => ({
        ...p,
        warung_name: p.warung?.name,
        warung_status: p.warung?.status,
        warung_category: p.warung?.category,
        owner_avatar: p.warung?.owner?.avatar_url,
        owner_name: p.warung?.owner?.name,
        category_name: p.categories?.name || p.category_name,
      }));

      setProducts(mapped);
    } catch (error) {
      console.error("loadProducts error:", error);
      setProducts([]);
    }

    setProductLoading(false);
  }

  useEffect(() => {
    if (id) loadOutletById(id);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    loadOutletById(id);
    loadCategories(id);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    loadProducts({ outletId: id });
  }, [id]);

  function handleUpdateProduct(updated) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handleDeleteProduct(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <motion.div
        className="min-h-screen bg-[#f0f7ff] pb-24"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "-100%", opacity: 0 }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
      >
        <div className="sticky top-0 z-40 bg-[#f0f7ff] pt-3 px-4 pb-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-full bg-white shadow-sm animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-24 rounded-full bg-[#e4edff] animate-pulse" />
              <div className="h-3 w-16 rounded-full bg-[#edf3ff] animate-pulse" />
            </div>
          </div>
        </div>
        <div className="px-4 pt-4 space-y-4">
          {/* Banner skeleton */}
          <div className="h-40 rounded-2xl bg-[#e4edff] animate-pulse" />
          {/* Info card skeleton */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 animate-pulse">
            <div className="h-4 w-3/4 rounded-full bg-[#edf3ff]" />
            <div className="h-3 w-1/2 rounded-full bg-[#e4edff]" />
            <div className="h-3 w-2/3 rounded-full bg-[#edf3ff]" />
          </div>
          {/* Category chips skeleton */}
          <div className="flex gap-2 overflow-hidden">
            <div className="h-9 w-24 rounded-full bg-[#e4edff] animate-pulse" />
            <div className="h-9 w-20 rounded-full bg-[#edf3ff] animate-pulse" />
            <div className="h-9 w-16 rounded-full bg-[#e4edff] animate-pulse" />
          </div>
          {/* Product grid skeleton */}
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-[#e4edff] animate-pulse"
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }
  if (!outlet) return <div className="p-4">Outlet tidak ditemukan</div>;

  return (
    <motion.div
      className="min-h-screen bg-[#f0f7ff] pb-24"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
    >
      <OutletHeader outlet={outlet} isOwner={isOwner} />

      <div className="px-4 space-y-4 pb-4">
        <OutletInfoCard outlet={outlet} isOwner={isOwner} user={user} />
        <CategoryChips
          isOwner={isOwner}
          outletId={outlet.id}
          categories={categories}
          onSelect={(categoryId) => {
            setActiveCategoryId(categoryId);
            loadProducts({ outletId: outlet.id, categoryId });
          }}
          onCreated={(cat) => {
            setCategories((prev) => [...prev, cat]);
            setActiveCategoryId(cat.id);
            loadProducts({ outletId: outlet.id, categoryId: cat.id });
          }}
          onUpdated={(cat) => {
            setCategories((prev) =>
              prev.map((c) => (c.id === cat.id ? cat : c)),
            );
          }}
          onDeleted={(catId) => {
            setCategories((prev) => prev.filter((c) => c.id !== catId));
            setActiveCategoryId(null);
            loadProducts({ outletId: outlet.id });
          }}
        />

        {productLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-[#e4edff] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <ProductGrid
            products={products}
            outlet={outlet}
            isOwner={isOwner}
            categories={categories}
            onAddProduct={() => setOpenAddProduct(true)}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
        <AddProductBottomSheet
          open={openAddProduct}
          outletId={outlet.id}
          categoryId={activeCategoryId}
          categories={categories}
          onClose={() => setOpenAddProduct(false)}
          onCreated={(product) => {
            setProducts((prev) => [product, ...prev]);
          }}
        />
      </div>
    </motion.div>
  );
}
