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
    <div ref={ref} className="absolute top-5 right-3 z-20">
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded-full bg-white text-slate-700
                   flex items-center justify-center
                   shadow-sm border border-slate-200"
      >
        <MoreVertical size={14} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-36
                     bg-white
                     rounded-xl shadow-xl border border-slate-200
                     overflow-hidden"
        >
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="w-full px-3.5 py-2.5 text-sm flex items-center gap-2.5
                       text-slate-700 hover:bg-slate-50"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100">
              <Pencil size={13} className="text-slate-600" />
            </div>
            Edit
          </button>

          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full px-3.5 py-2.5 text-sm flex items-center gap-2.5
                       text-red-600 hover:bg-red-50 border-t border-slate-100"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-red-50">
              <Trash2 size={13} className="text-red-500" />
            </div>
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}

export default OutletActionMenu;
