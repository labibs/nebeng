import { useState } from "react";
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import AddCategoryBottomSheet from "./AddCategorryBottomSheet";
import swal from "sweetalert2";

export default function CategoryChips({
  isOwner,
  outletId,
  categories = [],
  loading,
  onSelect,
  onCreated,
  onUpdated,
  onDeleted,
}) {
  const [activeId, setActiveId] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null);

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
            Etalase
          </button>
        )}

        {categories.map((cat) => (
          <div key={cat.id} className="relative group">
            <button
              onClick={() => {
                setActiveId(cat.id);
                onSelect?.(cat.id);
              }}
              className={`px-4 py-2 rounded-full text-sm border flex items-center gap-2
                ${
                  activeId === cat.id
                    ? "bg-black text-white border-black"
                    : "bg-base-100 hover:bg-base-200"
                }`}
            >
              {cat.name}

              {isOwner && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(cat);
                    setOpenEdit(true);
                  }}
                  className="opacity-0 group-hover:opacity-100"
                >
                  ⋮
                </span>
              )}
            </button>
          </div>
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
        open={openAdd || openEdit}
        mode={openEdit ? "edit" : "create"}
        outletId={outletId}
        initialData={editing}
        onClose={() => {
          setOpenAdd(false);
          setOpenEdit(false);
          setEditing(null);
        }}
        onCreated={(cat) => {
          onCreated?.(cat);
          setActiveId(cat.id);
          onSelect?.(cat.id);
        }}
        onUpdated={(cat) => {
          onUpdated?.(cat);
          setActiveId(cat.id);
          onSelect?.(cat.id);
        }}
        onDeleted={(catId) => {
          onDeleted?.(catId);
          setActiveId(null);
        }}
      />

    </>
  );
}