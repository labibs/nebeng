import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { MessageCircle } from "lucide-react";
import AddressText from "../market/AddressText";

export default function OutletInfoCard({outlet, isOwner, user}) {
  const navigate = useNavigate();
  
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
          <p className="text-sm text-amber-950">{outlet.description}</p>
          <button className="btn btn-xs btn-primary">Get Code</button>
        </div>
      </div>
    </div>
  );
}