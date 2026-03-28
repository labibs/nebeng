import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import AddCategoryBottomSheet from "./AddCategorryBottomSheet";
import ManageCategoriesBottomSheet from "./ManageCategoriesBottomSheet";

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
  const [openManage, setOpenManage] = useState(false);

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
      <div className="flex items-center w-full">
        <div className="flex-1 flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center pr-2">
          {categories.length === 0 && isOwner && (
            <button
              onClick={() => setOpenAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full
                         border border-dashed text-sm flex-shrink-0
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
                className={`px-4 py-2 rounded-full text-sm border flex items-center gap-2 whitespace-nowrap transition-all
                  ${activeId === cat.id
                    ? "bg-black text-white border-black"
                    : "bg-base-100 hover:bg-base-200"
                  }`}
              >
                {cat.icon && (
                  <span className="text-md">{cat.icon}</span>
                )}
                {cat.name}
              </button>
            </div>
          ))}

          {categories.length > 0 && isOwner && (
            <button
              onClick={() => setOpenAdd(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-full
                         border border-dashed text-sm flex-shrink-0
                         bg-base-100 hover:bg-base-200"
            >
              <Plus size={14} />
              Tambah
            </button>
          )}
        </div>

        {isOwner && (
          <div className="pl-2 border-l border-base-200 bg-base-100 sticky right-0 z-10 py-1">
            <button
              onClick={() => setOpenManage(true)}
              className="btn btn-circle btn-sm btn-ghost bg-base-200 hover:bg-base-300 border border-base-300"
            >
              <Settings size={16} />
            </button>
          </div>
        )}
      </div>

      <AddCategoryBottomSheet
        open={openAdd}
        mode="create"
        outletId={outletId}
        onClose={() => setOpenAdd(false)}
        onCreated={(cat) => {
          onCreated?.(cat);
          setActiveId(cat.id);
          onSelect?.(cat.id);
        }}
      />

      <ManageCategoriesBottomSheet
        open={openManage}
        onClose={() => setOpenManage(false)}
        categories={categories}
        outletId={outletId}
        onCreated={(cat) => {
          onCreated?.(cat);
        }}
        onUpdated={(cat) => {
          onUpdated?.(cat);
        }}
        onDeleted={(catId) => {
          onDeleted?.(catId);
          if (activeId === catId) setActiveId(null);
        }}
      />
    </>
  );
}
