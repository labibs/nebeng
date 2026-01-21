import OutletHeader from "../components/detailOutlet/OutletHeader";
import OutletInfoCard from "../components/detailOutlet/OutletInfoCard";
import CategoryChips from "../components/detailOutlet/CategoryChips";
import ProductGrid from "../components/detailOutlet/ProductGrid";


export default function DetailOutlet() {
    return (
        <div className="min-h-screen bg-base-100">
            <OutletHeader />

            <div className="px-4 space-y-4">
                <OutletInfoCard />
                <CategoryChips />
                <ProductGrid />
            </div>
        </div>
    );
}