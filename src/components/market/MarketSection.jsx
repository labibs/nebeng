import MarketProductCard from "./MarketProductCard";

export default function MarketSection({ title, products = [] }) {
  if (!products.length) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-lg">{title}</h2>
        <button className="text-sm text-success">See all</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <MarketProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </div>
  );
}
