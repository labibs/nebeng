import { motion } from "framer-motion";
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import OutletHeader from "../components/outlet/OutletHeader";
import OutletList from "../components/outlet/OutletList";
import OutletProductList from "../components/outlet/OutletProductList";
import AddProductButton from "../components/outlet/AddProductButton";

export default function Outlet() {
  const { user } = useUser();
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  return (
    <motion.div
        className="min-h-screen bg-base-100 pb-24"
        initial={{ x: "-100%", opacity: 0 }} // masuk dari kanan
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}   // keluar ke kiri
        transition={{
            type: "tween",
            ease: "easeOut",
            duration: 0.35,
        }}
        >

      <OutletHeader />

      <div className="px-4 space-y-4">
        <OutletList
          clerkId={user.id}
          onSelectOutlet={setSelectedOutlet}
          selectedOutletId={selectedOutlet?.id}
        />
       

        <OutletProductList outlet={selectedOutlet} />
      </div>

      {selectedOutlet && <AddProductButton outlet={selectedOutlet} />}
    </motion.div>
  );
}
