import { supabase } from "../../lib/supabaseClient";
import { useState } from "react";
import { uploadPostImage } from "../../lib/uploadPostImage";
import swal from "sweetalert2";
import OutletProductCard from "../outlet/OutletProductCard";

export default function ProductGrid({
  products = [],
  isOwner,
  categories = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) {
  //const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleUpdateProduct(productId, payload) {
    let imageUrl = payload.image_url;

    if (payload.imageFile) {
      imageUrl = await uploadPostImage(payload.imageFile, {
        folder: "warung/products",
      });
    }

    const { data, error } = await supabase
      .from("warung_products")
      .update({
        name: payload.name,
        estimated_price: payload.estimated_price,
        category_id: payload.category_id,
        image_url: imageUrl,
      })
      .eq("id", productId)
      .select()
      .single();

    if (error) throw error;

    // 🔥 kasih tahu parent
    onUpdateProduct?.(data);
  }

  async function handleDeleteProduct(productId) {
    const result = await swal.fire({
      title: "Hapus Produk?",
      text: "Produk yang dihapus tidak bisa dikembalikan",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    await supabase
      .from("warung_products")
      .delete()
      .eq("id", productId);

    // 🔥 kasih tahu parent
    onDeleteProduct?.(productId);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm opacity-60">
          {products.length}+ produk
        </p>

        {isOwner && (
          <button
            onClick={onAddProduct}
            className="btn btn-sm btn-outline rounded-full"
          >
            + Produk
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <OutletProductCard 
            key={product.id} 
            product={product} 
            isOwner={isOwner} 
            categories={categories}
            onUpdate={handleUpdateProduct}
            onDelete={handleDeleteProduct}
          />
        ))}
      </div>
    </div>
  );
}
