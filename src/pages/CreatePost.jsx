import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import CreateActionPicker from "../components/create/CreateActionPicker";
import CreateNitipBawakan from "../components/create/CreateNitipBawakan";
import CreateNitipBelikan from "../components/create/CreateNitipBelikan";
import CreateCariBoncengan from "../components/create/CreateCariBoncengan";
import CreateCariTukang from "../components/create/CreateCariTukang";
import CreatePerjalanan from "../components/create/CreatePerjalanan";
import CreateWarung from "../components/create/CreateWarung";
import CreateContent from "../components/create/CreateContent";
import CreateJualanKeliling from "../components/create/CreateJualanKeliling";

export default function CreatePost() {
  const location = useLocation();
  const [action, setAction] = useState(null);

  useEffect(() => {
    if (location.state?.requestCourier) {
      setAction(location.state.actionType || "nitip_bawakan");
    }
  }, [location.state]);

  const slideLeft = {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f0f7ff] px-4 py-6">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-200/45 blur-3xl" />
      <div className="absolute -right-16 top-48 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/20 to-transparent" />

      <div className="relative z-10">
        {!action && (
          <>
            <h1 className="mb-4 text-center text-xl font-bold">
              Mau ngapain hari ini?
            </h1>
            <CreateActionPicker onSelect={setAction} />
          </>
        )}
      </div>

      <AnimatePresence>
        {action && (
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden bg-[#f0f7ff]"
            variants={slideLeft}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-200/45 blur-3xl" />
            <div className="absolute -right-16 top-48 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/20 to-transparent" />

            <div className="relative z-10 h-full">
              {action === "nitip_bawakan" && (
                <CreateNitipBawakan
                  onBack={() => setAction(null)}
                  initialData={location.state?.initialData}
                />
              )}
              {action === "nitip_belikan" && (
                <CreateNitipBelikan
                  onBack={() => setAction(null)}
                  initialData={location.state?.initialData}
                />
              )}

              {action === "cari_boncengan" && (
                <CreateCariBoncengan onBack={() => setAction(null)} />
              )}

              {action === "tukang" && (
                <CreateCariTukang onBack={() => setAction(null)} />
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

              {action === "keliling" && (
                <CreateJualanKeliling onBack={() => setAction(null)} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
