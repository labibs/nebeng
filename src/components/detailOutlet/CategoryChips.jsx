import { useState } from "react";
import { Plus } from "lucide-react";
import AddCategoryBottomSheet from "./AddCategorryBottomSheet";

export default function CategoryChips({ isOwner, outletId, categories = [], loading, onCreated }) {
  const [activeId, setActiveId] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);

  if (loading) {
    return (
      <div className="flex gap-2">
        <div className="h-9 w-24 bg-base-200 rounded-full animate-pulse" />
        <div className="h-9 w-20 bg-base-200 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.length === 0 && isOwner && (
          <button
            onClick={() => setOpenAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full
                       border border-dashed text-sm
                       bg-base-100 hover:bg-base-200"
          >
            <Plus size={14} />
            Tambah Etalase
          </button>
        )}

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveId(cat.id)}
            className={`px-4 py-2 rounded-full text-sm border
              ${
                activeId === cat.id
                  ? "bg-black text-white border-black"
                  : "bg-base-100 hover:bg-base-200"
              }`}
          >
            {cat.name}
          </button>
        ))}

        {categories.length > 0 && isOwner && (
          <button
            onClick={() => setOpenAdd(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-full
                       border border-dashed text-sm
                       bg-base-100 hover:bg-base-200"
          >
            <Plus size={14} />
            Tambah
          </button>
        )}
      </div>

      <AddCategoryBottomSheet
        open={openAdd}
        outletId={outletId}
        onClose={() => setOpenAdd(false)}
        onCreated={(cat) => {
          onCreated?.(cat);
          setActiveId(cat.id);
        }}
      />
    </>
  );
}