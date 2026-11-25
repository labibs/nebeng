import { useState } from "react";
import { Plus, Settings } from "lucide-react";
import AddCategoryBottomSheet from "./AddCategorryBottomSheet";
import ManageCategoriesBottomSheet from "./ManageCategoriesBottomSheet";
import { useLanguage } from "../../lib/LanguageContext";

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
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openManage, setOpenManage] = useState(false);

  if (loading) {
    return (
      <div className="flex gap-2">
        <div className="h-9 w-24 bg-[#e4edff] rounded-full animate-pulse" />
        <div className="h-9 w-20 bg-[#edf3ff] rounded-full animate-pulse" />
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
              {t("Etalase")}
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
                  ${
                    activeId === cat.id
                      ? "bg-[#4e73df] text-white border-[#4e73df]"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
              >
                {cat.icon && <span className="text-md">{cat.icon}</span>}
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
              {t("Tambah")}
            </button>
          )}
        </div>

        {isOwner && (
          <button
            onClick={() => setOpenManage(true)}
            className="flex items-center justify-center h-9 w-9 rounded-full
                       bg-white text-slate-600 hover:bg-slate-50 border border-slate-200
                       transition-colors shadow-sm"
          >
            <Settings size={14} />
          </button>
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
