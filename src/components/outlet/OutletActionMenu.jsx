import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

function OutletActionMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close kalau klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="absolute top-3 right-3 z-20">
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded-full bg-black/60 text-white
                   flex items-center justify-center
                   backdrop-blur"
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-32
                     bg-white dark:bg-zinc-900
                     rounded-xl shadow-lg border
                     overflow-hidden"
        >
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full px-3 py-2 text-sm flex items-center gap-2
                       hover:bg-zinc-100 dark:hover:bg-white/10"
          >
            <Pencil size={14} />
            Edit
          </button>

          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full px-3 py-2 text-sm flex items-center gap-2
                       text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <Trash2 size={14} />
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}

export default OutletActionMenu;
