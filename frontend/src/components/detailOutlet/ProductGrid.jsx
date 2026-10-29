import MarketProductCard from "../market/MarketProductCard";

export default function ProductGrid({
  products = [],
  outlet,
  isOwner,
  categories = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm opacity-60">{products.length}+ produk</p>

        {isOwner && (
          <button
            onClick={onAddProduct}
            className="btn btn-sm btn-outline rounded-full"
          >
            + Produk
          </button>
        )}
      </div>

      <div className="space-y-4">
        {products.map((product) => (
          <MarketProductCard
            key={product.id}
            product={product}
            isOwner={isOwner}
            categories={categories}
          />
        ))}
      </div>
    </div>
  );
}
