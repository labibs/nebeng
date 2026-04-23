import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import OutletActionMenu from "../outlet/OutletActionMenu";
import Swal from "sweetalert2";

export default function OutletHeader({ outlet, isOwner }) {
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

    const { error } = await supabase.from("warungs").delete().eq("id", id);

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
    <div className="sticky top-0 z-40 shrink-0 bg-[#f0f7ff] pt-[calc(env(safe-area-inset-top)+0.75rem)] px-4 pb-0">
      <div className="flex items-start gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_12px_28px_rgba(82,109,181,0.15)] transition-transform active:scale-95"
        >
          <ArrowLeft size={20} className="text-slate-700" />
        </button>

        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-base font-semibold leading-tight text-slate-900 truncate">
            Detail Outlet {outlet.name}
          </h3>

          <p className="text-xs text-slate-400 mt-0.5">
            {isOwner
              ? "Kelola produk dan outletmu"
              : "Pilih produk yang ingin dibeli"}
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
