import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";
import {
  LogOut,
  Star,
  Store,
  Phone,
  Video,
  MessageSquare,
  Clock,
  Users,
  Award,
  ChevronLeft,
  Heart,
  ChevronRight,
  MapPin,
  Calendar,
  Navigation,
  Edit2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function ProfileDetail() {
  const { user: currentUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { clerkId } = useParams();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [outlet, setOutlet] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwner =
    isLoaded && currentUser && (clerkId === currentUser.id || !clerkId);
  const targetId = clerkId || currentUser?.id;

  useEffect(() => {
    if (!isLoaded || !targetId) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch Profile
        const profileData = await apiFetch('/users/' + targetId);
        if (profileData) setProfile(profileData);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }

      try {
        // Fetch User Posts
        const postsData = await apiFetch('/posts?user_id=' + targetId);
        if (postsData) setPosts(postsData);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }

      try {
        // Fetch User Outlet
        const countData = await apiFetch('/warungs/count?user_id=' + targetId);
        if (countData && countData.count > 0) {
          const outlets = await apiFetch('/warungs?created_by=' + targetId + '&limit=1');
          if (outlets && outlets.length > 0) {
            setOutlet(outlets[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching outlet:", err);
      }

      setLoading(false);
    };

    fetchData();
  }, [isLoaded, targetId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleOutletAction = () => {
    if (isOwner) {
      navigate("/outlet");
    } else if (outlet) {
      navigate(`/outlet/${outlet.id}`);
    } else {
      alert("User ini belum memiliki outlet");
    }
  };

  const handleChatAction = async () => {
    if (isOwner) return;
    if (!currentUser) {
      alert("Silakan login untuk memulai chat");
      return;
    }

    try {
      const result = await apiFetch("/conversations", {
        method: "POST",
        body: JSON.stringify({ opponent_id: targetId }),
      });

      if (result.conversation_id) {
        navigate(`/chat/${result.conversation_id}`);
      } else {
        alert("Gagal membuka chat");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal membuka chat");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fbff]">
        <div className="w-10 h-10 border-4 border-[#4e73df] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6 text-center">Profile tidak ditemukan</div>;
  }

  const techImageIds = [
    "1518770660439-4636190af475",
    "1550751827-4bd374c3f58b",
    "1451187580459-43490279c0fa",
    "1519389950473-47ba0277781c",
    "1581091226825-a6a2a5aee158",
  ];
  const imageId =
    techImageIds[(profile.clerk_id?.length || 0) % techImageIds.length];
  const randomBg = `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&q=80&w=1000`;

  return (
    <div className="fixed inset-0 z-[100] bg-[#f8fbff] overflow-y-auto animate-in slide-in-from-right duration-500 ease-out pb-24">
      {/* DIGITAL THEMED BACKGROUND */}
      <div className="fixed top-0 left-0 right-0 h-[50vh] z-0 bg-slate-900">
        <img
          src={randomBg}
          alt="digital background"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-[#4e73df]/20 to-[#f8fbff]" />
      </div>

      {/* TOP OVERLAY BUTTONS */}
      <div className="sticky top-6 left-0 right-0 flex justify-between z-50 px-6">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
        <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-rose-400 border border-white/20 active:scale-90 transition-transform shadow-sm">
          <Heart size={18} className={isOwner ? "fill-rose-400" : ""} />
        </button>
      </div>

      {/* MAIN HEADER CONTENT - Aligned Profile & Info */}
      <div className="relative z-20 pt-[12vh] px-8 pb-8">
        <div className="flex items-end justify-between gap-4">
          {/* Left Side: Name and Rating */}
          <div className="flex-1 pb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4e73df]/90 backdrop-blur-md border border-white/20 text-white mb-3 shadow-md">
              <Star size={10} className="fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-bold tracking-widest uppercase">
                Verified Pro
              </span>
            </div>

            <h1 className="text-2xl font-black text-white leading-tight mb-0.5 drop-shadow-lg">
              {profile.name}
            </h1>
            <p className="text-white/90 font-bold text-[9px] uppercase tracking-[0.25em] drop-shadow-md">
              Digital Community Member
            </p>
          </div>

          {/* Right Side: Profile Picture (aligned with text) */}
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/40 backdrop-blur-md overflow-hidden shadow-2xl animate-bounce-slow">
              <img
                src={
                  profile.avatar_url ||
                  "https://img.icons8.com/3d-fluency/300/person-male--v2.png"
                }
                alt="profile avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* GLASS CONTAINER */}
      <div className="relative z-20">
        <div className="bg-white/40 backdrop-blur-3xl rounded-t-[40px] border-t border-white/50 pt-6 pb-10 px-5 shadow-[-4px_-10px_40px_rgba(0,0,0,0.08)]">
          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2.5 mb-6 px-2">
            <button
              onClick={handleOutletAction}
              className="whitespace-nowrap rounded-[26px] bg-[#4e73df] px-6 py-3 text-[12px] font-bold text-white shadow-xl shadow-blue-900/20 transition-all transform active:scale-95 flex items-center gap-2"
            >
              <Store size={14} strokeWidth={2.5} />
              {isOwner ? "Kelola Outlet" : "Kunjungi Outlet"}
            </button>

            {!isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    profile.phone &&
                    (window.location.href = `tel:${profile.phone}`)
                  }
                  className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md border border-white transition-transform active:scale-90"
                >
                  <Phone
                    size={14}
                    strokeWidth={2.5}
                    className="text-[#4e73df]"
                  />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md border border-white transition-transform active:scale-90">
                  <Video
                    size={14}
                    strokeWidth={2.5}
                    className="text-[#4e73df]"
                  />
                </button>
                <button
                  onClick={handleChatAction}
                  className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md border border-white transition-transform active:scale-90"
                >
                  <MessageSquare
                    size={14}
                    strokeWidth={2.5}
                    className="text-[#4e73df]"
                  />
                </button>
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-[24px] py-4 px-5 shadow-[0_10px_25px_rgba(0,0,0,0.04)] border border-white/50 flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#4e73df]" />
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-slate-700 leading-none">
                  2 Tahun
                </span>
                <span className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter text-center">
                  Exp
                </span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#4e73df]" />
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-slate-700 leading-none">
                  {posts.length}
                </span>
                <span className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter text-center">
                  Post
                </span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="flex items-center gap-2">
              <Star size={16} className="text-[#4e73df]" />
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-slate-700 leading-none">
                  1.2k
                </span>
                <span className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter text-center">
                  Review
                </span>
              </div>
            </div>
          </div>

          {/* WHITE CONTENT AREA */}
          <div className="bg-white rounded-[32px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-6">
              <div className="flex justify-between items-end mb-4 px-1">
                <div>
                  <h3 className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em] mb-0.5">
                    Gallery
                  </h3>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">
                    {isOwner
                      ? "Aktivitas Saya"
                      : `Postingan ${profile.name.split(" ")[0]}`}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-[#4e73df]">
                  <span className="text-[10px] font-black">
                    {posts.length} Items
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 px-0.5">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => {
                        if (isOwner) {
                          navigate(`/post/${post.id}/edit`);
                        } else {
                          navigate(`/post/${post.id}`);
                        }
                      }}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-50 cursor-pointer shadow-sm active:scale-95 transition-all"
                    >
                      <img
                        src={
                          post.item_photo ||
                          "https://beritabeta.com/storage/img/2020/06/jastip-ota-ok-17668.jpg"
                        }
                        alt={post.id}
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-1 right-1 bg-black/30 backdrop-blur-sm p-1 rounded-lg text-white">
                        {post.type === "cari_boncengan" ? (
                          <MapPin size={8} />
                        ) : (
                          <Calendar size={8} />
                        )}
                      </div>
                      {isOwner && (
                        <div className="absolute inset-0 bg-[#4e73df]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                          <Edit2 size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 bg-slate-50/50 border border-dashed border-slate-200 rounded-[24px] p-10 flex flex-col items-center justify-center text-slate-400">
                    <p className="text-xs font-bold">Belum ada postingan</p>
                  </div>
                )}
              </div>
            </div>

            {isOwner && (
              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <LogOut size={16} />
                Logout Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
