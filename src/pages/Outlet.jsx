import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../lib/supabaseClient";

import OutletHeader from "../components/outlet/OutletHeader";
import OutletList from "../components/outlet/OutletList";
import OutletProductList from "../components/outlet/OutletProductList";
import AddProductButton from "../components/outlet/AddProductButton";

export default function Outlet() {
  const { user } = useUser();
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  const isOwner = selectedOutlet && user && selectedOutlet.created_by_clerk_id === user.id;

  useEffect(() => {
    if (!user) return;

    const loadOutlets = async () => {
      const { data, error } = await supabase
        .from("warungs")
        .select("*")
        .eq("created_by_clerk_id", user.id)
        .order("id", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setOutlets(data || []);

      // ✅ auto select outlet terakhir
      if (data && data.length > 0) {
        setSelectedOutlet(data[0]);
      }
    };

    loadOutlets();
  }, [user]);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-200
        dark:from-slate-900 dark:to-slate-800
        transition-transform pb-24"
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
    >
      <OutletHeader />

      <div className="px-4 space-y-4">
        <OutletList
          clerkId={user?.id}
          outlets={outlets}
          selectedOutletId={selectedOutlet?.id}
          onSelectOutlet={setSelectedOutlet}
        />

        <OutletProductList outlet={selectedOutlet} isOwner={isOwner} />
      </div>

      {selectedOutlet && <AddProductButton outlet={selectedOutlet} />}
    </motion.div>
  );
}



