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
    <div className="flex items-center gap-2.5">
      <button
        onClick={() => navigate("/outlet")}
        className="group inline-flex items-center gap-2.5 rounded-full bg-transparent text-left"
      >
        <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-50 bg-white shadow-[0_12px_28px_rgba(82,109,181,0.15)]">
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
                <Store size={18} strokeWidth={2} className="text-[#4e73df]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div>
          <p className="text-[10px] text-slate-400">Outlet saya</p>
          <p className="text-[13px] font-semibold text-[#20336b]">
            {owner_name || "Kelola outlet"}
          </p>
        </div>
      </button>
    </div>
  );
}
