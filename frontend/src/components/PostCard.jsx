import {
  format,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from "date-fns";
import { id as localeId, enUS as localeEn } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import L from "leaflet";
import { apiFetch } from "../lib/apiClient";
import { createOrReuseDealForPost } from "../lib/dealFlow";
import LazyImage from "./LazyImage";
import {
  Bike,
  Car,
  Bus,
  Train,
  CalendarClock,
  X,
  Navigation,
  MapPin,
  Heart,
  ArrowLeft,
  MessageSquare,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share2,
  Handshake,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import OutletRouteViewer from "./market/OutletRouteViewer";
import GoogleMapsEmbedViewer from "./GoogleMapsViewer";

// Fix icon marker
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (map && points && points.length > 1) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [30, 30] });
      } catch (err) {
        console.warn("FitBounds error:", err);
      }
    }
  }, [points, map]);

  return null;
}

export default function PostCard({ post }) {
  const { t, language } = useLanguage();
  const dateLocale = language === "en" ? localeEn : localeId;
  const numberLocale = language === "en" ? "en-US" : "id-ID";
  const navigate = useNavigate();
  const { user: clerkUser, isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [route, setRoute] = useState(null);
  const [routeViewerOpen, setRouteViewerOpen] = useState(false);
  const [fromMapOpen, setFromMapOpen] = useState(false);
  const [toMapOpen, setToMapOpen] = useState(false);
  const [fromExpanded, setFromExpanded] = useState(false);
  const [toExpanded, setToExpanded] = useState(false);
  const [fullImageOpen, setFullImageOpen] = useState(false);
  const [inlineMapMode, setInlineMapMode] = useState(null); // null, 'dari', 'ke', 'rute'
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creatingDeal, setCreatingDeal] = useState(false);

  const currentUserId = clerkUser?.id;
  const poster = post.user || {};
  const posterClerkId = post.clerk_user_id || post.user_id || null;
  const username =
    poster.name || (post.type === "titip" ? t("Titipers") : t("Orang Searah"));
  const userAvatar =
    poster.avatar_url ||
    "https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg";

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return num.toString();
  };

  const formatRupiah = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "0";
    return new Intl.NumberFormat(numberLocale, {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.trunc(amount));
  };

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
      const date = new Date(dateString);
      return format(date, "EEEE, d MMM yyyy • HH:mm", {
        locale: dateLocale,
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
      if (minutes < 1) return t("baru saja");
      if (minutes < 60) return language === "en" ? `${minutes} min ago` : `${minutes} menit yang lalu`;
      const hours = differenceInHours(now, date);
      if (hours < 24) return language === "en" ? `${hours} hr ago` : `${hours} jam yang lalu`;
      const days = differenceInDays(now, date);
      if (days < 5) return language === "en" ? `${days} days ago` : `${days} hari yang lalu`;
      return format(date, "EEEE, d MMM yyyy", { locale: dateLocale });
    } catch {
      return "";
    }
  };

  const displayDate = post.travel_date ? formatDate(post.travel_date) : "";
  const createDate = post.created_at ? formatSmartDate(post.created_at) : "";
  const itemPhoto =
    post.item_photo ||
    "https://beritabeta.com/storage/img/2020/06/jastip-ota-ok-17668.jpg";

  const savedPostsStorageKey = "numpak:saved-posts";

  const formatDateTimeLocal = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000,
    );
    return localDate.toISOString().slice(0, 16);
  };

  const buildLocation = (lat, lng, address) => {
    if (lat == null || lng == null) return null;
    return {
      lat: Number(lat),
      lng: Number(lng),
      address: address || "",
      name: address || "",
    };
  };

  const repostActionTypeMap = {
    nitip_bawakan: "nitip_bawakan",
    nitip_belikan: "nitip_belikan",
    cari_boncengan: "cari_boncengan",
    tukang: "tukang",
    perjalanan: "perjalanan",
    content: "content",
    warung: "warung",
    keliling: "keliling",
  };

  const repostInitialData = {
    photoUrl: post.item_photo || null,
    caption: post.description || "",
    description: post.description || "",
    item_description: post.item_description || post.description || "",
    price: post.price != null ? String(post.price) : "",
    fee: post.fee != null ? String(post.fee) : "",
    travel_date: formatDateTimeLocal(post.travel_date),
    event_date: formatDateTimeLocal(post.travel_date),
    armada: post.armada || "motor",
    fromLocation: buildLocation(post.from_lat, post.from_lng, post.from_city),
    toLocation: buildLocation(post.to_lat, post.to_lng, post.to_city),
    location:
      typeof post.location === "object" && post.location
        ? post.location
        : typeof post.location === "string"
          ? {
              address: post.location,
              name: post.location,
            }
          : null,
    name: post.name || "",
    category: post.category || "Makanan",
    visibility: post.visibility || "public",
    status: post.status || "milik",
    owner_phone: post.owner_phone || "",
    owner_note: post.owner_note || "",
    route_description: post.description || "",
  };

  // Fetch route dari OSRM
  useEffect(() => {
    if (!post.from_lat || !post.to_lat || !open) return;
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${post.from_lng},${post.from_lat};${post.to_lng},${post.to_lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.routes?.length > 0) {
          const coords = json.routes[0].geometry.coordinates.map((c) => [
            c[1],
            c[0],
          ]);
          setRoute(coords);
        }
      } catch (e) {
        console.error("Gagal ambil rute:", e);
      }
    };
    fetchRoute();
  }, [post.from_lat, post.from_lng, post.to_lat, post.to_lng, open]);

  // Fetch like status on mount
  useEffect(() => {
    if (!post.id) return;
    apiFetch(`/posts/${post.id}/likes`)
      .then((data) => {
        if (data) {
          setLiked(data.user_liked || false);
          setLikesCount(data.likes_count || 0);
        }
      })
      .catch(() => {});
  }, [post.id]);

  useEffect(() => {
    if (!post.id || typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(savedPostsStorageKey);
      const savedPosts = raw ? JSON.parse(raw) : [];
      setSaved(Array.isArray(savedPosts) && savedPosts.includes(String(post.id)));
    } catch {
      setSaved(false);
    }
  }, [post.id]);

  const persistSavedPost = (nextSaved) => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(savedPostsStorageKey);
      const savedPosts = raw ? JSON.parse(raw) : [];
      const current = Array.isArray(savedPosts)
        ? savedPosts.map((id) => String(id))
        : [];
      const next = nextSaved
        ? Array.from(new Set([...current, String(post.id)]))
        : current.filter((id) => id !== String(post.id));

      window.localStorage.setItem(savedPostsStorageKey, JSON.stringify(next));
      setSaved(nextSaved);
    } catch (error) {
      console.error("Gagal menyimpan post:", error);
    }
  };

  const handleToggleSave = (e) => {
    e.stopPropagation();

    if (!isSignedIn) {
      alert(t("Kamu harus login dulu untuk menyimpan post!"));
      return;
    }

    persistSavedPost(!saved);
  };

  const handleRepost = (e) => {
    e.stopPropagation();

    if (!isSignedIn) {
      alert(t("Kamu harus login dulu untuk repost!"));
      return;
    }

    const actionType = repostActionTypeMap[post.type] || "content";
    navigate("/create", {
      state: {
        actionType,
        initialData: repostInitialData,
      },
    });
  };

  const handleShare = async (e) => {
    e.stopPropagation();

    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/post/${post.id}`
        : `/post/${post.id}`;
    const title = post.item_description || post.description || t("Numpak post");
    const text =
      post.description || post.item_description || t("Lihat postingan ini.");

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert(t("Link post disalin"));
        return;
      }

      alert(url);
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Gagal share post:", error);
      }
    }
  };

  const handleDirectDeal = async (e) => {
    e.stopPropagation();

    if (!isSignedIn) {
      alert(t("Kamu harus login dulu untuk deal!"));
      return;
    }

    if (currentUserId === posterClerkId) {
      alert(t("Kamu tidak bisa deal dengan postingan sendiri."));
      return;
    }

    if (creatingDeal) return;

    setCreatingDeal(true);
    try {
      console.log("[PostCard] direct deal start", {
        postId: post?.id,
        postType: post?.type,
        currentUserId,
        posterClerkId,
      });

      const deal = await createOrReuseDealForPost(apiFetch, post, currentUserId);
      const dealId = deal?.id || deal?.deal_id;

      console.log("[PostCard] direct deal result", {
        postId: post?.id,
        deal,
        dealId,
      });

      if (!dealId) {
        alert(t("Gagal memulai deal."));
        return;
      }

      navigate(`/deal?deal=${dealId}`);
    } catch (error) {
      console.error("Gagal memulai deal langsung:", {
        message: error?.message,
        status: error?.status,
        data: error?.data,
        postId: post?.id,
        postType: post?.type,
        currentUserId,
        posterClerkId,
      });
      alert(t("Gagal memulai deal."));
    } finally {
      setCreatingDeal(false);
    }
  };

  const handleToggleLike = async (e) => {
    e.stopPropagation();
    if (!isSignedIn) {
      alert(t("Kamu harus login dulu untuk like!"));
      return;
    }
    if (liking) return;

    // Optimistic update
    setLiked((prev) => !prev);
    setLikesCount(liked ? Math.max(0, likesCount - 1) : likesCount + 1);

    setLiking(true);
    try {
      const data = await apiFetch(`/posts/${post.id}/likes`, { method: "POST" });
      if (data) {
        setLiked(data.liked);
        setLikesCount(
          data.liked ? likesCount + 1 : Math.max(0, likesCount - 1),
        );
      }
    } catch {
      // Revert on error
      setLiked((prev) => !prev);
      setLikesCount(liked ? likesCount + 1 : Math.max(0, likesCount - 1));
    } finally {
      setLiking(false);
    }
  };

  const handleChatDeal = async () => {
    if (!isSignedIn) {
      alert(t("Kamu harus login dulu untuk chat!"));
      return;
    }
    if (!posterClerkId) {
      alert(t("Data user tidak lengkap!"));
      return;
    }
    if (currentUserId === posterClerkId) {
      alert(t("Gak bisa chat sama diri sendiri dong 😅"));
      return;
    }
    setLoadingChat(true);
    try {
      // Start or find conversation via backend
      const convData = await apiFetch('/conversations', {
        method: 'POST',
        body: JSON.stringify({ opponent_id: posterClerkId, post_id: post.id }),
      });

      const conversationId = convData.id || convData.conversation_id;

      // Send post_card message if conversation already existed
      if (convData.already_existed) {
        try {
          await apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify({
              conversation_id: conversationId,
              content: t("Saya tertarik dengan penawaran ini."),
              message_type: 'post_card',
              post_id: post.id,
            }),
          });
        } catch {
          // message may already exist, ignore
        }
      }

      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Error membuka chat:", error);
      alert(t("Gagal membuka chat. Coba lagi ya!"));
    } finally {
      setLoadingChat(false);
    }
  };

  const icons = { motor: Bike, mobil: Car, bus: Bus, kereta: Train };
  const ArmadaIcon = ({ type, className = "w-5 h-5 text-white" }) => {
    const Icon = icons[type] ?? Bike;
    return <Icon className={className} />;
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      <div
        className="absolute inset-0 w-full h-full cursor-pointer"
        onClick={() => navigate(`/post/${post.id}`)}
      >
        <LazyImage
          src={itemPhoto}
          alt={t("Foto item")}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Info Card */}
      <div className="absolute inset-x-0 bottom-20 z-20">
        <div className="px-4 pb-3">
          <div className="flex items-start gap-3 mb-2">
            {/* Avatar */}
            <div
              className="flex-shrink-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/detail/${posterClerkId}`);
              }}
            >
              <div className="w-10 h-10 rounded-full ring-2 ring-white/40 overflow-hidden">
                <img
                  src={userAvatar}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/detail/${posterClerkId}`);
              }}
            >
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
              {t(config.label)}
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
          <div className="rounded-2xl backdrop-blur-xl bg-black/60 border border-white/20 p-4 space-y-4">
            {/* Close Button + Profile Info */}
            <div className="flex items-center justify-between">
              {/* Profile Info */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full ring-1 ring-white/30 overflow-hidden">
                  <img
                    src={userAvatar}
                    alt={username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-white">{username}</p>
                  <span className="text-xs text-white/40">·</span>
                  <span className="text-xs text-white/50">{createDate}</span>
                </div>
              </div>

              {/* Close Button */}
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

            {/* Content Post */}
            {post.type === "content" && post.description && (
              <div className="rounded-2xl bg-white/10 p-4 border border-white/15">
                <p className="text-sm text-white/90 leading-relaxed">
                  {post.description}
                </p>
              </div>
            )}

            {/* Route Card - Refined layout with vertical actions */}
            {post.type !== "content" && (
              <div className="relative mt-8">
                {/* Floating Illustration - MOVED OUTSIDE overflow-hidden */}
                <div
                  className={`absolute -top-10 left-12 w-36 h-36 pointer-events-none z-30 drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)] transition-opacity duration-300 ${inlineMapMode ? "opacity-0 invisible" : "opacity-100 visible"}`}
                >
                  <div className="transform -rotate-6 scale-100">
                    <img
                      src={
                        post.armada === "motor"
                          ? "https://img.icons8.com/3d-fluency/200/motorcycle.png"
                          : post.armada === "mobil"
                            ? "https://img.icons8.com/3d-fluency/200/car.png"
                            : post.armada === "bus"
                              ? "https://img.icons8.com/3d-fluency/200/bus.png"
                              : post.armada === "kereta"
                                ? "https://img.icons8.com/3d-fluency/200/train.png"
                                : post.armada === "pesawat"
                                  ? "https://img.icons8.com/3d-fluency/200/airplane-mode-on.png"
                                  : "https://img.icons8.com/3d-fluency/200/bicycle.png"
                      }
                      alt={post.armada}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src =
                          "https://img.icons8.com/3d-fluency/200/bicycle.png";
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-[#4e73df] shadow-2xl relative overflow-hidden text-white transition-all duration-300 min-h-[160px]">
                  {/* Decoration Circles */}
                  <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                  <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-white/5 rounded-full blur-2xl" />

                  {/* INLINE MAP VIEW */}
                  {inlineMapMode ? (
                    <div className="relative h-64 w-full animate-in fade-in zoom-in duration-300">
                      {/* Map Header */}
                      <div className="absolute top-3 left-3 right-3 z-[401] flex items-center justify-between pointer-events-none">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineMapMode(null);
                          }}
                          className="pointer-events-auto bg-white/90 backdrop-blur shadow-lg px-3 py-1.5 rounded-full text-black font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
                        >
                          <ArrowLeft size={14} strokeWidth={3} />
                          {t("Kembali")}
                        </button>
                        <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {inlineMapMode === "dari"
                            ? t("Lokasi Asal")
                            : inlineMapMode === "ke"
                              ? t("Lokasi Tujuan")
                              : t("Rute Perjalanan")}
                        </div>
                      </div>

                      <MapContainer
                        center={
                          inlineMapMode === "dari"
                            ? [post.from_lat, post.from_lng]
                            : inlineMapMode === "ke"
                              ? [post.to_lat, post.to_lng]
                              : [post.from_lat, post.from_lng]
                        }
                        zoom={14}
                        className="w-full h-full"
                        zoomControl={false}
                        attributionControl={false}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {inlineMapMode === "dari" && (
                          <Marker position={[post.from_lat, post.from_lng]} />
                        )}
                        {inlineMapMode === "ke" && (
                          <Marker position={[post.to_lat, post.to_lng]} />
                        )}
                        {inlineMapMode === "rute" && (
                          <>
                            <Marker position={[post.from_lat, post.from_lng]} />
                            <Marker position={[post.to_lat, post.to_lng]} />
                            {route && (
                              <Polyline
                                positions={route}
                                pathOptions={{
                                  color: "white",
                                  weight: 4,
                                  opacity: 1,
                                  dashArray: "1, 10",
                                }}
                              />
                            )}
                            {route && <FitBounds points={route} />}
                          </>
                        )}
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="relative z-10 flex gap-4 p-4">
                      {/* Left Column: Main Details */}
                      <div className="flex-1 flex flex-col justify-end min-w-0 pt-14">
                        <div className="space-y-1 mb-3">
                          {/* Title & Date */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-base">{config.icon}</span>
                              <h3 className="font-bold text-base truncate leading-tight">
                                {t(config.label).charAt(0).toUpperCase() +
                                  t(config.label).slice(1)}
                              </h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-white/80">
                              <CalendarClock size={12} className="shrink-0" />
                              <p className="text-xs font-medium leading-tight">
                                {displayDate || t("Waktu fleksibel")}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Ongkos (Bottom of Left Column) */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-white/60">
                            {t("Ongkos")}
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold">Rp</span>
                            <span className="text-2xl font-black leading-none">
                              {formatRupiah(post.fee)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Vertical Actions (Dari, Ke, Rute) */}
                      <div className="flex flex-col gap-2 shrink-0 border-l border-white/10 pl-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineMapMode("dari");
                          }}
                          className="w-12 h-12 bg-white/15 rounded-lg flex flex-col items-center justify-center hover:bg-white/25 transition border border-white/10 group shadow-sm"
                        >
                          <span className="text-[9px] font-bold text-white/60 mb-0.5 leading-none">
                            {t("Dari")}
                          </span>
                          <MapPin size={14} className="text-white" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineMapMode("ke");
                          }}
                          className="w-12 h-12 bg-white/15 rounded-lg flex flex-col items-center justify-center hover:bg-white/25 transition border border-white/10 group shadow-sm"
                        >
                          <span className="text-[9px] font-bold text-white/60 mb-0.5 leading-none">
                            {t("Ke")}
                          </span>
                          <MapPin size={14} className="text-white" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineMapMode("rute");
                          }}
                          className="w-12 h-12 bg-white/20 rounded-lg flex flex-col items-center justify-center hover:bg-white/30 transition border border-white/10 group shadow-sm"
                        >
                          <span className="text-[9px] font-bold text-white/60 mb-0.5 leading-none">
                            {t("Rute")}
                          </span>
                          <Navigation size={14} className="text-white" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Cards - Horizontal Scroll */}
            {post.type !== "content" && (
              <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent snap-x snap-mandatory pb-1">
                {/* Dari Card */}
                {post.from_city && (
                  <div className="flex-shrink-0 w-72 snap-start rounded-2xl bg-white/10 p-4 border border-white/15 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                        {t("Asal")}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {fromExpanded
                        ? post.from_city
                        : post.from_city.length > 50
                          ? `${post.from_city.substring(0, 50)}...`
                          : post.from_city}
                      {post.from_city.length > 50 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFromExpanded(!fromExpanded);
                          }}
                          className="ml-1 text-sky-400 font-bold hover:text-sky-300"
                        >
                          {fromExpanded ? t("Tutup") : t("Selengkapnya")}
                        </button>
                      )}
                    </p>
                  </div>
                )}

                {/* Ke Card */}
                {post.to_city && (
                  <div className="flex-shrink-0 w-72 snap-start rounded-2xl bg-white/10 p-4 border border-white/15 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                        {t("Tujuan")}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {toExpanded
                        ? post.to_city
                        : post.to_city.length > 50
                          ? `${post.to_city.substring(0, 50)}...`
                          : post.to_city}
                      {post.to_city.length > 50 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setToExpanded(!toExpanded);
                          }}
                          className="ml-1 text-sky-400 font-bold hover:text-sky-300"
                        >
                          {toExpanded ? t("Tutup") : t("Selengkapnya")}
                        </button>
                      )}
                    </p>
                  </div>
                )}

                {post.description && (
                  <div className="flex-shrink-0 w-72 snap-start rounded-2xl bg-white/10 p-4 border border-white/15 shadow-sm">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
                      {t("Deskripsi")}
                    </p>
                    <p className="text-sm text-white/90 leading-relaxed line-clamp-4">
                      {post.description}
                    </p>
                  </div>
                )}
                {post.item_description && (
                  <div className="flex-shrink-0 w-72 snap-start rounded-2xl bg-white/10 p-4 border border-white/15 shadow-sm">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
                      {post.type === "nitip_bawakan" ||
                      post.type === "nitip_belikan"
                        ? t("Barang yang dititipkan")
                        : t("Info tambahan")}
                    </p>
                    <p className="text-sm text-white/90 leading-relaxed line-clamp-4">
                      {post.item_description}
                    </p>
                  </div>
                )}
                {post.price && (
                  <div className="flex-shrink-0 w-72 snap-start rounded-2xl bg-white/10 p-4 border border-white/15 shadow-sm">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
                      {isTitip
                        ? t("Perkiraan harga barang")
                        : t("Harga barang maksimal")}
                    </p>
                    <p className="text-base font-bold text-white">
                      Rp{formatRupiah(post.price)}
                    </p>
                  </div>
                )}
                {post.armada && (
                  <div className="flex-shrink-0 w-72 snap-start rounded-2xl bg-white/10 p-4 border border-white/15 shadow-sm">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
                      {t("Armada")}
                    </p>
                    <div className="flex items-center gap-2">
                      <ArmadaIcon type={post.armada} />
                      <p className="text-sm font-semibold text-white capitalize">
                        {post.armada}
                      </p>
                    </div>
                  </div>
                )}
                {post.location && post.location.lat && post.location.lng && (
                  <div className="flex-shrink-0 w-72 snap-start rounded-2xl bg-white/10 p-4 border border-white/15 shadow-sm">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
                      {t("Lokasi")}
                    </p>
                    <p className="text-sm font-semibold text-white mb-1">
                      {post.location.name || t("Lokasi")}
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
                      {t("Buka maps")} →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {post.type !== "content" && (
              <div className="flex items-center justify-between pt-4 border-t border-white/10 px-1">
                <button
                  aria-label={t("Suka")}
                  className="flex flex-col items-center gap-1 group"
                  onClick={handleToggleLike}
                  disabled={liking}
                >
                  <div className="p-2.5 rounded-full hover:bg-white/10 transition-colors">
                    <Heart
                      size={20}
                      className={`transition-transform group-active:scale-125 ${liked ? "text-red-500 fill-red-500" : "text-white"}`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white/60 tracking-tight">
                    {formatNumber(likesCount)}
                  </span>
                </button>

                <button
                  aria-label={t("Komentar")}
                  className="flex flex-col items-center gap-1 group"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/post/${post.id}`);
                  }}
                >
                  <div className="p-2.5 rounded-full hover:bg-white/10 transition-colors">
                    <MessageSquare
                      size={20}
                      className="text-white group-active:scale-125 transition-transform"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white/60 tracking-tight">
                    {formatNumber(post.post_comments?.[0]?.count || 0)}
                  </span>
                </button>

                <button
                  aria-label={t("Chat dengan pemilik")}
                  className="flex flex-col items-center gap-1 group"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChatDeal();
                  }}
                  disabled={loadingChat}
                >
                  <div className="p-2.5 rounded-full hover:bg-white/10 transition-colors">
                    <MessageCircle
                      size={20}
                      className="text-white group-active:scale-125 transition-transform"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white/60 tracking-tight">
                    {t("Chat")}
                  </span>
                </button>

                {/* CENTER PIECE: DEAL */}
                <button
                  aria-label={t("Ajukan deal")}
                  className="flex flex-col items-center gap-1.5 -mt-2 group"
                  onClick={handleDirectDeal}
                  disabled={creatingDeal}
                >
                  <div className="p-3.5 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full shadow-[0_8px_20px_rgba(52,211,153,0.3)] group-active:scale-90 transition-transform">
                    <Handshake
                      size={24}
                      strokeWidth={2.5}
                      className="text-white"
                    />
                  </div>
                  <span className="text-[11px] font-black text-emerald-400 tracking-wider uppercase">
                    {creatingDeal ? t("Memproses") : t("Deal")}
                  </span>
                </button>

                <button
                  aria-label={t("Bagikan ulang post")}
                  className="flex flex-col items-center gap-1 group"
                  onClick={handleRepost}
                >
                  <div className="p-2.5 rounded-full hover:bg-white/10 transition-colors">
                    <Repeat2
                      size={20}
                      className="text-white group-active:scale-125 transition-transform"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white/60 tracking-tight">
                    {t("Repost")}
                  </span>
                </button>

                <button
                  aria-label={saved ? t("Hapus dari tersimpan") : t("Simpan post")}
                  className="flex flex-col items-center gap-1 group"
                  onClick={handleToggleSave}
                >
                  <div className="p-2.5 rounded-full hover:bg-white/10 transition-colors">
                    <Bookmark
                      size={20}
                      className={`group-active:scale-125 transition-transform ${saved ? "fill-amber-300 text-amber-300" : "text-white"}`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white/60 tracking-tight">
                    {saved ? t("Tersimpan") : t("Simpan")}
                  </span>
                </button>

                <button
                  aria-label={t("Bagikan post")}
                  className="flex flex-col items-center gap-1 group"
                  onClick={handleShare}
                >
                  <div className="p-2.5 rounded-full hover:bg-white/10 transition-colors">
                    <Share2
                      size={20}
                      className="text-white group-active:scale-125 transition-transform"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white/60 tracking-tight">
                    {t("Bagikan")}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS - Moved to root level so they work regardless of detail card state */}
      {/* Route Viewer Modal */}
      <OutletRouteViewer
        open={routeViewerOpen}
        setOpen={setRouteViewerOpen}
        outletId={null}
        customRoute={{
          from_lat: post.from_lat,
          from_lng: post.from_lng,
          to_lat: post.to_lat,
          to_lng: post.to_lng,
          from_city: post.from_city,
          to_city: post.to_city,
        }}
      />

      {/* Dari Map Modal */}
      <GoogleMapsEmbedViewer
        open={fromMapOpen}
        setOpen={setFromMapOpen}
        latitude={post.from_lat}
        longitude={post.from_lng}
        address={post.from_city}
        title={t("Lokasi Penjemputan")}
      />

      {/* Ke Map Modal */}
      <GoogleMapsEmbedViewer
        open={toMapOpen}
        setOpen={setToMapOpen}
        latitude={post.to_lat}
        longitude={post.to_lng}
        address={post.to_city}
        title={t("Lokasi Tujuan")}
      />

      {/* Full Screen Image Viewer Modal */}
      <div
        className={`fixed inset-0 z-[10000] bg-black transition-all duration-300 flex items-center justify-center ${
          fullImageOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setFullImageOpen(false)}
      >
        {/* Close Button */}
        <button
          className="absolute top-10 right-6 z-[10001] bg-white/20 hover:bg-white/30 p-2.5 rounded-full backdrop-blur-md transition-colors border border-white/20"
          aria-label={t("Tutup")}
          onClick={(e) => {
            e.stopPropagation();
            setFullImageOpen(false);
          }}
        >
          <X size={24} className="text-white" />
        </button>

        <div className="w-full h-full p-4 flex items-center justify-center">
          <img
            src={itemPhoto}
            alt={t("Tampilan penuh")}
            className={`max-w-full max-h-full object-contain transition-transform duration-500 ${
              fullImageOpen ? "scale-100" : "scale-90"
            }`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Tips */}
        <div className="absolute bottom-10 left-0 right-0 text-center">
          <p className="text-white/40 text-xs font-medium tracking-wide uppercase">
            {t("Ketuk di mana saja untuk kembali")}
          </p>
        </div>
      </div>
    </div>
  );
}
