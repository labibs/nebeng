import { useState, useEffect } from "react";
import ProductActionMenu from "../detailOutlet/ProductActionMenu";
import ProductForm from "../detailOutlet/ProductForm";
import BottomSheet from "../BottomSheet";
import { useNavigate } from "react-router-dom";

export default function OutletProductCard({
  product,
  isOwner,
  categories = [],
  onUpdate,
  onDelete,
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (product?.category_id) {
      setSelectedCategory(product.category_id);
    }
  }, [product]);

  return (
    <div
      className="relative h-48 rounded-2xl overflow-hidden shadow-md group">
      {/* Image */}
      <img
        src={
          product.image_url ||
          "https://puncatraining.id/wp-content/uploads/2023/06/feate-jajanan-tradisional-768x400.jpeg"
        }
        alt={product.name}
        className="absolute inset-0 w-full h-full object-cover
                   scale-100 group-hover:scale-105
                   transition-transform duration-300"
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Owner Action */}
      {isOwner && (
        <ProductActionMenu
          product={product}
          onEdit={() => setOpenEdit(true)}
          onDelete={() => onDelete(product.id)}
        />
      )}

      {/* Content */}
      <div
        onClick={() => navigate(`/product/${product.id}`)}
        className="absolute bottom-0 z-10 p-3 w-full text-white">
        <h3 className="font-bold text-sm leading-tight line-clamp-2">
          {product.name}
        </h3>

        <p className="font-semibold text-sm mt-1">
          ~ Rp {product.estimated_price?.toLocaleString("id-ID")}
        </p>
      </div>

      {/* Badge */}
      <div className="absolute top-3 left-3 z-10 text-[10px]
                      px-2 py-0.5 rounded-full
                      bg-black/60 text-white backdrop-blur">
        {categories.find((c) => c.id === product.category_id)?.name || "Produk"}
      </div>

      {/* Edit BottomSheet */}
      {openEdit && (
        <BottomSheet open={openEdit} onClose={() => setOpenEdit(false)}>
          <ProductForm
            mode="edit"
            initialData={product}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onSubmit={(payload) =>
              onUpdate(product.id, payload).then(() => {
                setOpenEdit(false);
              })
            }
            onClose={() => setOpenEdit(false)}
          />
        </BottomSheet>
      )}
    </div>
  );
}
