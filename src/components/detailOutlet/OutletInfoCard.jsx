import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  MessageCircle,
  User,
  UserRoundPlus,
  MapPin,
  Route,
} from "lucide-react";
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
        src={outlet.image_url || "https://placehold.co/600x400?text=Outlet"}
        alt="Outlet Banner"
        className="w-full h-40 object-cover"
      />

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              {outlet.name}
            </p>
            <p className="text-xs text-slate-400 truncate">
              <AddressText address={outlet.address} />
            </p>
          </div>
          {/* Kanan */}
          {!isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setOpenMaps(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 shadow-sm transition-transform active:scale-95"
              >
                <MapPin size={16} />
              </button>
              <button
                onClick={() => setOpenRoute(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 shadow-sm transition-transform active:scale-95"
              >
                <Route size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <p className="text-sm text-slate-600">
            {outlet.description || "Belum ada deskripsi"}
          </p>
        </div>
        <hr className="my-2 border-slate-100" />
        {!isOwner && (
          <div className="p-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
              {outlet?.owner?.avatar_url ? (
                <img
                  src={outlet?.owner?.avatar_url}
                  alt={outlet?.owner?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={16} className="text-[#4e73df]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold text-slate-700 truncate">
                  {outlet?.owner?.name}
                </p>
                <span className="text-[9px] bg-blue-50 text-[#4e73df] px-1.5 py-0.5 rounded-full font-semibold border border-blue-100 shrink-0">
                  Verifikasi
                </span>
              </div>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                Owner Terpercaya
              </p>
            </div>
            <button
              onClick={() => startChatWith(outlet, user)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 shadow-sm transition-transform active:scale-95 shrink-0"
            >
              <MessageCircle size={16} />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 shadow-sm transition-transform active:scale-95 shrink-0">
              <UserRoundPlus size={16} />
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
