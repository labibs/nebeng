import {
  format,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import LazyImage from "./LazyImage";
import { Bike, Car, Bus, Train, X } from "lucide-react";

// Fix icon marker
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function PostCard({ post }) {
  const navigate = useNavigate();
  const { user: clerkUser, isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const currentUserId = clerkUser?.id;
  const poster = post.users || {};
  const username =
    poster.name || (post.type === "titip" ? "Titipers" : "Traveler");
  const userAvatar =
    poster.avatar_url ||
    "https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg";

  const postTypeConfig = {
    nitip_bawakan: {
      label: "nitip bawain",
      text: "mau nitip bawa barang",
      color: "bg-blue-500/30",
      icon: "🧳",
    },
    nitip_belikan: {
      label: "nitip beliin",
      text: "minta dibeliin barang",
      color: "bg-purple-500/30",
      icon: "🛍️",
    },
    cari_boncengan: {
      label: "cari boncengan",
      text: "nyari boncengan searah",
      color: "bg-green-500/30",
      icon: "🛵",
    },
    tukang: {
      label: "cari tukang",
      text: "nyari tukang/service",
      color: "bg-orange-500/30",
      icon: "👷",
    },
    perjalanan: {
      label: "dalam perjalanan",
      text: "bisa bawa/bonceng",
      color: "bg-teal-500/30",
      icon: "🚚",
    },
    keliling: {
      label: "jualan keliling",
      text: "jualan keliling rute",
      color: "bg-yellow-500/30",
      icon: "🛺",
    },
    content: {
      label: "konten",
      text: "video pendek",
      color: "bg-red-500/30",
      icon: "🎥",
    },
    warung: {
      label: "outlet",
      text: "outlet/warung",
      color: "bg-indigo-500/30",
      icon: "🏪",
    },
  };

  const defaultConfig = {
    label: "post",
    text: "post",
    color: "bg-gray-500/30",
    icon: "📝",
  };
  const config = postTypeConfig[post.type] || defaultConfig;
  const isTitip =
    post.type === "titip" ||
    post.type === "nitip_bawakan" ||
    post.type === "nitip_belikan";

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "EEEE, d MMM yyyy", {
        locale: localeId,
      });
    } catch {
      return "";
    }
  };

  const formatSmartDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const minutes = differenceInMinutes(now, date);
      if (minutes < 1) return "baru saja";
      if (minutes < 60) return `${minutes} menit yang lalu`;
      const hours = differenceInHours(now, date);
      if (hours < 24) return `${hours} jam yang lalu`;
      const days = differenceInDays(now, date);
      if (days < 5) return `${days} hari yang lalu`;
      return format(date, "EEEE, d MMM yyyy", { locale: localeId });
    } catch {
      return "";
    }
  };

  const displayDate = post.travel_date ? formatDate(post.travel_date) : "";
  const createDate = post.created_at ? formatSmartDate(post.created_at) : "";
  const itemPhoto =
    post.item_photo ||
    "https://beritabeta.com/storage/img/2020/06/jastip-ota-ok-17668.jpg";

  const handleChatDeal = async () => {
    if (!isSignedIn) {
      alert("Kamu harus login dulu untuk chat!");
      return;
    }
    const posterClerkId = post.clerk_user_id || null;
    if (!posterClerkId) {
      alert("Data user tidak lengkap!");
      return;
    }
    if (currentUserId === posterClerkId) {
      alert("Gak bisa chat sama diri sendiri dong 😅");
      return;
    }
    setLoadingChat(true);
    try {
      const { data: myConvs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);
      const myConvIds = (myConvs || []).map((r) => r.conversation_id);
      const { data: sharedConv } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", posterClerkId)
        .in("conversation_id", myConvIds)
        .limit(1)
        .maybeSingle();
      let conversationId;
      if (sharedConv) {
        conversationId = sharedConv.conversation_id;
        const { data: existingMessage } = await supabase
          .from("messages")
          .select("id")
          .eq("conversation_id", conversationId)
          .eq("post_id", post.id)
          .eq("message_type", "post_card")
          .limit(1)
          .maybeSingle();
        if (!existingMessage) {
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            content: "Saya tertarik dengan penawaran ini.",
            message_type: "post_card",
            sender_id: currentUserId,
            post_id: post.id,
          });
        }
      } else {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ post_id: post.id })
          .select("id")
          .single();
        conversationId = newConv.id;
        await supabase.from("conversation_participants").insert([
          { conversation_id: conversationId, user_id: currentUserId },
          { conversation_id: conversationId, user_id: posterClerkId },
        ]);
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          content: null,
          message_type: "post_card",
          sender_id: currentUserId,
          post_id: post.id,
        });
      }
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Error membuka chat:", error);
      alert("Gagal membuka chat. Coba lagi ya!");
    } finally {
      setLoadingChat(false);
    }
  };

  const icons = { motor: Bike, mobil: Car, bus: Bus, kereta: Train };
  const ArmadaIcon = ({ type }) => {
    const Icon = icons[type] ?? Bike;
    return <Icon className="w-5 h-5 text-white" />;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <LazyImage
        src={itemPhoto}
        alt="Item"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Main Info Card */}
      <div className="absolute inset-x-0 bottom-20 z-20">
        <div className="px-4 pb-3">
          <div className="flex items-start gap-3 mb-2">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full ring-2 ring-white/40 overflow-hidden">
                <img
                  src={userAvatar}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">{username}</h3>
              <span className="text-xs text-white/60">{createDate}</span>
            </div>
          </div>

          {post.description && (
            <p className="text-sm text-white/90 leading-snug mb-3 line-clamp-2">
              {post.description}
            </p>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition"
          >
            <span className="text-base">{config.icon}</span>
            <span className="text-xs font-medium text-white capitalize">
              {config.label}
            </span>
            <svg
              className={`w-3 h-3 text-white/70 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible Detail */}
      <div
        className={`transition-all duration-500 overflow-hidden ${open ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="absolute inset-x-0 bottom-20 z-30 px-4 pb-3">
          <div className="rounded-2xl backdrop-blur-xl bg-black/60 border border-white/20 p-4 space-y-3">
            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content Post - Description only */}
            {post.type === "content" && post.description && (
              <div className="rounded-xl bg-white/10 p-4 border border-white/15">
                <p className="text-sm text-white/90 leading-relaxed">
                  {post.description}
                </p>
              </div>
            )}

            {/* Route Card - Non content */}
            {post.type !== "content" && (
              <div className="rounded-xl bg-gradient-to-br from-sky-500/90 to-blue-600/90 p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 text-xs">Ongkos</span>
                    <span className="text-white font-bold text-base">
                      Rp{post.fee?.toLocaleString("id-ID") || "0"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-white/80" />
                      <p className="text-xs text-white/70">Dari</p>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">
                      {post.from_city || "—"}
                    </p>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <div className="mb-1">
                      <ArmadaIcon type={post.armada} />
                    </div>
                    <div className="w-12 h-0.5 bg-white/40 rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-2 mb-1 justify-end">
                      <p className="text-xs text-white/70">Ke</p>
                      <div className="w-2 h-2 rounded-full bg-white/80" />
                    </div>
                    <p className="text-sm font-semibold text-white truncate">
                      {post.to_city || "—"}
                    </p>
                  </div>
                </div>
                {displayDate && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs text-white/80 text-center">
                      Berangkat: {displayDate}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Info Cards - Horizontal Scroll */}
            {post.type !== "content" && (
              <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent snap-x snap-mandatory pb-1">
                {post.description && (
                  <div className="flex-shrink-0 w-64 snap-start rounded-xl bg-white/10 p-3 border border-white/15">
                    <p className="text-xs text-white/60 mb-1.5">Deskripsi</p>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {post.description}
                    </p>
                  </div>
                )}
                {post.item_description && (
                  <div className="flex-shrink-0 w-64 snap-start rounded-xl bg-white/10 p-3 border border-white/15">
                    <p className="text-xs text-white/60 mb-1.5">
                      {post.type === "nitip_bawakan" ||
                      post.type === "nitip_belikan"
                        ? "Barang yang dititipkan"
                        : "Info tambahan"}
                    </p>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {post.item_description}
                    </p>
                  </div>
                )}
                {post.price && (
                  <div className="flex-shrink-0 w-48 snap-start rounded-xl bg-white/10 p-3 border border-white/15">
                    <p className="text-xs text-white/60 mb-1.5">
                      {isTitip
                        ? "Perkiraan harga barang"
                        : "Harga barang maksimal"}
                    </p>
                    <p className="text-base font-bold text-white">
                      Rp{post.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                )}
                {post.armada && (
                  <div className="flex-shrink-0 w-36 snap-start rounded-xl bg-white/10 p-3 border border-white/15">
                    <p className="text-xs text-white/60 mb-1.5">Armada</p>
                    <div className="flex items-center gap-2">
                      <ArmadaIcon type={post.armada} />
                      <p className="text-sm font-semibold text-white capitalize">
                        {post.armada}
                      </p>
                    </div>
                  </div>
                )}
                {post.location && post.location.lat && post.location.lng && (
                  <div className="flex-shrink-0 w-56 snap-start rounded-xl bg-white/10 p-3 border border-white/15">
                    <p className="text-xs text-white/60 mb-1.5">Lokasi</p>
                    <p className="text-sm font-semibold text-white mb-1">
                      {post.location.name || "Lokasi"}
                    </p>
                    {post.location.address && (
                      <p className="text-xs text-white/70 mb-2">
                        {post.location.address.length > 40
                          ? `${post.location.address.substring(0, 40)}...`
                          : post.location.address}
                      </p>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${post.location.lat},${post.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-sky-300 hover:text-sky-200 underline"
                    >
                      Buka maps →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {post.type !== "content" && (
              <div className="flex items-center justify-around pt-3 border-t border-white/20">
                <button
                  className="flex flex-col items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-1.164 0-2.097.943-2.097 2.095v2.81M7 20H4a2 2 0 01-2-2v-9a2 2 0 012-2h3"
                      />
                    </svg>
                  </div>
                  <span className="text-xs text-white/80">Like</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs text-white/80">Komentar</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChatDeal();
                  }}
                  disabled={loadingChat}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs text-white/80">Chat</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-emerald-300">
                    Deal
                  </span>
                </button>
                <button
                  className="flex flex-col items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 1l4 4-4 4M3 11v-2a6 6 0 016-6h8M7 23l-4-4 4-4m14-2v2a6 6 0 01-6 6H7"
                      />
                    </svg>
                  </div>
                  <span className="text-xs text-white/80">Repost</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs text-white/80">Simpan</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2.5 bg-white/15 rounded-full hover:bg-white/25 transition">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs text-white/80">Share</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
