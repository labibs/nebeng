import ProductCard from "./ProductCard";

const products = [
	{
		id: 1,
		name: "Nike Air Jordan 1 Retro High OG",
		price: 650,
		rating: 3.8,
		image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db",
	},
	{
		id: 2,
		name: "Nike Dunk Low Retro GS",
		price: 360,
		rating: 3.5,
		image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77",
	},
];

export default function ProductGrid() {
	return (
		<div className="space-y-3">
			<div className="flex justify-between items-center">
				<p className="text-sm opacity-60">100+ products</p>
				<button className="text-sm">Sort & filter</button>
			</div>

			<div className="grid grid-cols-2 gap-3">
				{products.map((product) => (
					<ProductCard key={product.id} product={product} />
				))}
			</div>
		</div>
	);
}