import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../lib/supabaseClient";

import OutletHeader from "../components/outlet/OutletHeader";
import OutletList from "../components/outlet/OutletList";
import OutletProductList from "../components/outlet/OutletProductList";

export default function Outlet() {
  const { user } = useUser();
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  const isOwner =
    selectedOutlet && user && selectedOutlet.created_by_clerk_id === user.id;

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
      className="min-h-screen bg-[#f0f7ff]"
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.35 }}
    >
      <div className="relative min-h-screen overflow-hidden bg-[#f0f7ff] pb-24 text-slate-900">
        {/* Animated Background blobs for extra visual polish */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute -right-20 top-60 h-[400px] w-[400px] rounded-full bg-blue-100/50 blur-3xl" />

        <OutletHeader />

        <div className="relative z-10 px-4 space-y-4">
          <OutletList
            clerkId={user?.id}
            outlets={outlets}
            selectedOutletId={selectedOutlet?.id}
            onSelectOutlet={setSelectedOutlet}
          />

          <OutletProductList outlet={selectedOutlet} isOwner={isOwner} />
        </div>
      </div>
    </motion.div>
  );
}
