import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { MessageCircle, User, UserRoundPlus, MapPin, Route } from "lucide-react";
import AddressText from "../market/AddressText";
import GoogleMapsPointViewer from "../GoogleMapsViewer";
import OutletRouteViewer from "../market/OutletRouteViewer";

export default function OutletInfoCard({ outlet, isOwner, user }) {
  const navigate = useNavigate();
  const [openMaps, setOpenMaps] = useState(false);
  const [openRoute, setOpenRoute] = useState(false);

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
          <div className="flex-1">
            <p className="font-semibold">{outlet.name}</p>
            <p className="text-xs opacity-60"><AddressText address={outlet.address} /></p>
          </div>
          {/* Kanan */}
          {!isOwner && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpenMaps(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
              >
                <MapPin size={22} />
              </button>
              <button
                onClick={() => setOpenRoute(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
              >
                <Route size={22} />
              </button>
            </div>
          )}

        </div>

        <div className="flex items-center justify-between bg-green-100 rounded-xl p-3 text-center">
          <p className="text-sm text-amber-950">{outlet.description || "Belum ada deskripsi"}</p>
        </div>
        <hr className="my-2 " />
        {!isOwner && (
          <div className="p-0 flex items-center gap-3 ">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
              {outlet?.owner?.avatar_url ? (
                <img src={outlet?.owner?.avatar_url} alt={outlet?.owner?.name} className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-indigo-300 dark:text-indigo-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{outlet?.owner?.name}</p>
                <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold">Verifikasi</span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Owner Terpercaya</p>
            </div>
            <button
              onClick={() => startChatWith(outlet, user)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 active:scale-95 transition-all">
              <MessageCircle size={22} />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 active:scale-95 transition-all">
              <UserRoundPlus size={22} />
            </button>
          </div>
        )}
      </div>
      <OutletRouteViewer
        open={openRoute}
        setOpen={setOpenRoute}
        outletId={outlet.id}
      />
      <GoogleMapsPointViewer
        open={openMaps}
        setOpen={setOpenMaps}
        latitude={outlet.latitude}
        longitude={outlet.longitude}
        address={outlet.address}
        title={outlet.name}
      />
    </div>
  );
}
