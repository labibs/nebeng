import { useState } from 'react'
import CreateActionPicker from '../components/create/CreateActionPicker';
import CreateNitipBawakan from '../components/create/CreateNitipBawakan';
import CreateNitipBelikan from '../components/create/CreateNitipBelikan';
import CreateCariBoncengan from '../components/create/CreateCariBoncengan';
import CreatePerjalanan from '../components/create/CreatePerjalanan';
import CreateWarung from '../components/create/CreateWarung';
import CreateContent from '../components/create/CreateContent';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreatePost() {

  const [action, setAction] = useState(null);
  const slideLeft = {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },   // balik lagi ke kanan saat close
  };

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-to-br from-[#e8f5e9] to-[#d7efe3] dark:from-[#020617] dark:to-[#020617] overflow-hidden">

      {/* MENU AWAL */}
      {!action && (
        <>
          <h1 className="text-xl font-bold mb-4 text-center">
            Mau ngapain hari ini?
          </h1>
          <CreateActionPicker onSelect={setAction} />
        </>
      )}

      {/* LAYER SLIDE */}
      <AnimatePresence>
        {action && (
          <motion.div
            className="fixed inset-0 bg-white dark:bg-[#020617] z-50"
            variants={slideLeft}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {action === "nitip_bawakan" && (
              <CreateNitipBawakan onBack={() => setAction(null)} />
            )}

            {action === "nitip_belikan" && (
              <CreateNitipBelikan onBack={() => setAction(null)} />
            )}

            {action === "cari_boncengan" && (
              <CreateCariBoncengan onBack={() => setAction(null)} />
            )}

            {action === "perjalanan" && (
              <CreatePerjalanan onBack={() => setAction(null)} />
            )}

            {action === "content" && (
              <CreateContent onBack={() => setAction(null)} />
            )}

            {action === "warung" && (
              <CreateWarung onBack={() => setAction(null)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
