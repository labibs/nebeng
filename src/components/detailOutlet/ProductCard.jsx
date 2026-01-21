import { Star } from "lucide-react";

export default function ProductCard({ product }) {
  return (
    <div className="border rounded-2xl p-3 space-y-2">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-32 object-cover rounded-xl"
      />

      <p className="text-sm font-medium line-clamp-2">{product.name}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs">
          <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
          {product.rating}
        </div>
        <p className="font-semibold text-sm">${product.price}</p>
      </div>
    </div>
  );
}