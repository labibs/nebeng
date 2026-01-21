import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUser } from "@clerk/clerk-react";

import OutletHeader from "../components/detailOutlet/OutletHeader";
import OutletInfoCard from "../components/detailOutlet/OutletInfoCard";
import CategoryChips from "../components/detailOutlet/CategoryChips";
import ProductGrid from "../components/detailOutlet/ProductGrid";

export default function DetailOutlet() {
  const { id } = useParams();
  const [outlet, setOutlet] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const isOwner = outlet && user && outlet.created_by_clerk_id === user.id;

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

  useEffect(() => {
    if (id) loadOutletById(id);
  }, [id]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!outlet) return <div className="p-4">Outlet tidak ditemukan</div>;
  
  return (
    <motion.div
      className="min-h-screen bg-base-100 pb-24"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
    >
      <OutletHeader outlet={outlet} isOwner={isOwner}/>

      <div className="px-4 space-y-4">
        <OutletInfoCard outlet={outlet} isOwner={isOwner} user={user} />
        <CategoryChips outletId={outlet.id} />
        <ProductGrid outletId={outlet.id} />
      </div>
    </motion.div>
  );
}
