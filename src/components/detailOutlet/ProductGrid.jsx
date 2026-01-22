import Outlet from "../../pages/Outlet";
import OutletProductCard from "../outlet/OutletProductCard";

export default function ProductGrid({
  products = [],
  isOwner,
  categories = [],
  onAddProduct,
}) {
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
          <OutletProductCard key={product.id} product={product} isOwner={isOwner} categories={categories} />
        ))}
      </div>
    </div>
  );
}
