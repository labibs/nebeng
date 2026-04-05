import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OutletButtonProps {
  owner_avatar?: string | null;
  owner_name?: string | null;
}

export default function OutletButton({
  owner_avatar,
  owner_name,
}: OutletButtonProps) {
  const [showAvatar, setShowAvatar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!owner_avatar) return;

    const interval = setInterval(() => {
      setShowAvatar((prev) => !prev);
    }, 4000);

    return () => clearInterval(interval);
  }, [owner_avatar]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate("/outlet")}
        className="group inline-flex items-center gap-3 rounded-full bg-transparent text-left"
      >
        <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_14px_30px_rgba(82,109,181,0.16)]">
          <AnimatePresence mode="wait">
            {showAvatar && owner_avatar ? (
              <motion.div
                key="avatar"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <img
                  src={owner_avatar}
                  alt="Owner Avatar"
                  className="h-full w-full object-cover"
                />
              </motion.div>
            ) : (
              <motion.div
                key="store"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Store size={22} strokeWidth={2.5} className="text-[#4e73df]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Outlet Saya</p>
          <p className="text-sm font-semibold text-[#20336b]">
            {owner_name || "Kelola outlet"}
          </p>
        </div>
      </button>
    </div>
  );
}
