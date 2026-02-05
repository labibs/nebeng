import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store } from 'lucide-react'; // atau library icon lain
import CartIconButton from '../cart/CartIconButton';
import { useNavigate } from "react-router-dom";

interface OutletButtonProps {
  owner_avatar?: string | null;
}

export default function OutletButton({ owner_avatar }: OutletButtonProps) {
  const [showAvatar, setShowAvatar] = useState(false);
  const navigate = useNavigate();

  // Optional: auto toggle setiap 4 detik (bisa dihapus kalau tidak mau auto)
  useEffect(() => {
    if (!owner_avatar) return; // tidak perlu animasi kalau tidak ada avatar

    const interval = setInterval(() => {
      setShowAvatar((prev) => !prev);
    }, 4000);

    return () => clearInterval(interval);
  }, [owner_avatar]);

  // Bisa di-trigger manual juga, misal on hover / on click
  // const toggle = () => setShowAvatar((p) => !p);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate("/outlet")}
        className={`
          group relative flex items-center gap-1.5 
          text-xs font-medium 
          px-2 py-1.5 rounded-full 
          bg-primary/10 hover:bg-primary/20 
          text-primary transition-colors
        `}
      >
        Outlet Saya

        {/* Area icon/avatar dengan ukuran tetap */}
        <div className="relative w-6 h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {showAvatar && owner_avatar ? (
              <motion.div
                key="avatar"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-primary/30 bg-white shadow-sm">
                  <img
                    src={owner_avatar}
                    alt="Owner Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="store"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Store size={20} className="text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </button>

      <CartIconButton />
    </div>
  );
}