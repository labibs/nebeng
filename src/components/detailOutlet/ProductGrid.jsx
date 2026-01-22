import MarketProductCard from "../market/MarketProductCard";

export default function ProductGrid({
  products = [],
  isOwner,
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
          <MarketProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
