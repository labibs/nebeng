import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import OutletActionMenu from "../outlet/OutletActionMenu";
import Swal from "sweetalert2";

export default function OutletHeader({outlet, isOwner}) {
  const navigate = useNavigate();

  const handleDeleteOutlet = async (id) => {
      const result = await Swal.fire({
        title: "Hapus Outlet?",
        text: "Outlet yang dihapus tidak bisa dikembalikan",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, hapus",
        cancelButtonText: "Batal",
        reverseButtons: true,
      });
  
      if (!result.isConfirmed) return;
  
      const { error } = await supabase
        .from("warungs")
        .delete()
        .eq("id", id);
  
      if (error) {
        Swal.fire({
          title: "Gagal",
          text: error.message || "Outlet gagal dihapus",
          icon: "error",
        });
        return;
      }
  
      await Swal.fire({
        title: "Berhasil",
        text: "Outlet berhasil dihapus",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
  
      onBack(); // balik ke halaman sebelumnya
    };

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
        {isOwner && (
        <OutletActionMenu
          onEdit={() => navigate(`/outlet/${outlet.id}/edit`)}
          onDelete={() => handleDeleteOutlet(outlet.id)}
        />
      )}
      </div>
    </div>
  );
}
