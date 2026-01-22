import { motion, AnimatePresence } from "framer-motion";

export default function BottomSheet({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50
                       bg-base-100 rounded-t-3xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3">
              <div className="w-12 h-1.5 rounded-full bg-base-300" />
            </div>

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
