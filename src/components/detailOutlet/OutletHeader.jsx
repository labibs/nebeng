import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OutletHeader({outlet, isOwner}) {
  const navigate = useNavigate();

  console.log(isOwner);

  return (
    
    <div className="shrink-0 mb-0 pt-6 px-4 pb-0">
      <div className="pointer-events-auto flex items-start gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="bg-white rounded-full p-3 shadow-lg text-black"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex flex-col">
          <h3 className="text-base font-semibold leading-tight">
            Detail Outlet {outlet.name}
          </h3>
          
          <p className="text-xs opacity-70">
            {isOwner ? 'Disini kamu bisa mengedit tampilan, menghapus dan menambahkan produk yang kamu jual di outletmu' : 'Pilih produk yang ingin kamu beli di outlet ini'}
          </p>
        </div>
      </div>
    </div>
  );
}
