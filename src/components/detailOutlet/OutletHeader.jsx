import { ArrowLeft } from "lucide-react";


export default function OutletHeader() {
    return (
        <div className="sticky top-0 z-10 bg-base-100 px-4 py-3 flex items-center gap-3">
            <ArrowLeft className="w-5 h-5" />
            <h1 className="font-semibold text-lg">Nike</h1>
        </div>
    );
}