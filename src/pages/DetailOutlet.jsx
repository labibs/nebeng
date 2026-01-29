import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
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

  async function loadOutletById(outletId) {
    setLoading(true);

    const { data, error } = await supabase
      .from("warungs")
      .select(`
            *,
            owner:users!warungs_created_by_clerk_id_fkey (
            avatar_url,
            name
            )
        `)
      .eq("id", outletId)
      .single();

    if (error) {
      console.error(error);
      setOutlet(null);
    } else {
      setOutlet(data);
    }

    setLoading(false);
  }

  async function loadProducts({ outletId, categoryId = null }) {
    if (!outletId) return;

    setProductLoading(true);

    let query = supabase
      .from("warung_products")
      .select(`
        id,
        name,
        estimated_price,
        image_url,
        rating,
        category_id,
        is_estimated,
        created_by_clerk_id,
        created_at,
        warung:warungs (
          name,
          category,
          status
        )
      `)
      .eq("warung_id", outletId)
      .order("created_at", { ascending: false });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("loadProducts error:", error);
      setProducts([]);
    } else {
      // flatten lokasi biar enak dipakai di card
      const mapped = (data || []).map((p) => ({
        ...p,
        city: p.warung?.city,
        district: p.warung?.district,
      }));

      setProducts(mapped);
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
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  }

  function handleDeleteProduct(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) return <div className="p-4">Loading...</div>;
  if (!outlet) return <div className="p-4">Outlet tidak ditemukan</div>;

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
      <OutletHeader outlet={outlet} isOwner={isOwner} />

      <div className="px-4 space-y-4">
        <OutletInfoCard outlet={outlet} isOwner={isOwner} user={user} />
        <CategoryChips
          isOwner={isOwner}
          outletId={outlet.id}
          categories={categories}
          onSelect={(categoryId) => {
            setActiveCategoryId(categoryId);
            loadProducts({
              outletId: outlet.id,
              categoryId,
            });
          }}
          onCreated={(cat) => {
            setCategories((prev) => [...prev, cat]);
            setActiveCategoryId(cat.id);
            loadProducts({
              outletId: outlet.id,
              categoryId: cat.id,
            });
          }}
        />

        {productLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-base-200 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <ProductGrid
            products={products}
            outletId={outlet.id}
            isOwner={isOwner}
            categories={categories}
            onAddProduct={() => setOpenAddProduct(true)}
            onUpdateProduct={handleUpdateProduct}
            onDelete={handleDeleteProduct}
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
