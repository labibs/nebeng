import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { MessageCircle } from "lucide-react";
import AddressText from "../market/AddressText";
import OutletActionMenu from "../outlet/OutletActionMenu";
import Swal from "sweetalert2";

export default function OutletInfoCard({outlet, isOwner, user}) {
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

  const startChatWith = async (selectedUser) => {
    const currentUserId = user.id;
    const currentClerkId = outlet.created_by_clerk_id;
    let conversationId;

    // cek apakah sudah ada conversation berdua
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .in("user_id", [currentClerkId, selectedUser.clerk_id]);

    if (participants && participants.length >= 2) {
      conversationId = participants[0].conversation_id;
    } else {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({})
        .select("id")
        .single();

      conversationId = newConv.id;

      await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: currentUserId },
        { conversation_id: conversationId, user_id: selectedUser.clerk_id },
      ]);
    }

    navigate(`/chat/${conversationId}`);
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg">
      <img
        src={
          outlet.image_url ||
          "https://placehold.co/600x400?text=Outlet"
        }
        alt="Outlet Banner"
        className="w-full h-40 object-cover"
      />
      {isOwner && (
        <OutletActionMenu
          onEdit={() => navigate(`/outlet/${outlet.id}/edit`)}
          onDelete={() => handleDeleteOutlet(outlet.id)}
        />
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div
              onClick={() => navigate(`/outlet/${id}`)}
              className="
                w-9 h-9
                rounded-full
                bg-black/60
                text-white
                backdrop-blur
                flex items-center justify-center
                font-bold
                overflow-hidden
                cursor-pointer
                active:scale-95
                transition
              "
            >
              {outlet?.owner?.avatar_url ? (
                <img
                  src={outlet?.owner?.avatar_url}
                  alt="Avatar Pemilik"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="capitalize">
                  {outlet?.owner?.name?.charAt(0) || "?"}
                </span>
              )}
            </div>
          <div className="flex-1">
            <p className="font-semibold">{outlet.name}</p>
            <p className="text-xs opacity-60"><AddressText address={outlet.address} /></p>
          </div>
          {/* Kanan */}
          {!isOwner && (
            <button
              onClick={() => startChatWith(outlet, user)}
              title="Chat Pemilik Toko"
              className="
                flex items-center gap-2
                px-4 py-2
                rounded-full
                text-emerald-600
                border border-emerald-200
                bg-white
                transition-all

                hover:bg-emerald-50 hover:border-emerald-300
                active:bg-emerald-100 active:scale-95
              "
            >
              <MessageCircle size={20} />
              
            </button>
          )}

        </div>

        <div className="flex items-center justify-between bg-green-100 rounded-xl p-3">
          <p className="text-sm text-amber-950">Free shipping for members on orders $50+</p>
          <button className="btn btn-xs btn-primary">Get Code</button>
        </div>
      </div>
    </div>
  );
}