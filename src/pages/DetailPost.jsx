import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../lib/supabaseClient";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  MessageSquare,
  Send,
  Trash2,
  MoreHorizontal,
  Heart,
  ThumbsUp,
  Eye,
  Smile,
  Image,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function DetailPost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const emojis = [
    "😊",
    "😂",
    "🥰",
    "😎",
    "👍",
    "🙏",
    "👌",
    "📦",
    "🛵",
    "🤝",
    "📍",
    "💰",
  ];

  const formatTime = (value) =>
    format(new Date(value), "HH:mm", {
      locale: localeId,
    });

  const formatPostAge = (value) => {
    const createdAt = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;

    return format(createdAt, "d MMM", { locale: localeId });
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: postData } = await supabase
        .from("posts")
        .select("*, users(*)")
        .eq("id", postId)
        .single();

      if (postData) setPost(postData);

      const { data: commentData, error } = await supabase
        .from("post_comments")
        .select("*, users(*)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (!error) setComments(commentData || []);

      setLoading(false);
    }
    fetchData();
  }, [postId]);

  const handleSendComment = async (content = newComment, type = "text") => {
    if (!content.trim() || sending) return;
    if (!currentUser) {
      alert("Silakan login untuk berkomentar");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content: content.trim(),
          comment_type: type,
        })
        .select("*, users(*)")
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setNewComment("");
      setShowEmojiPicker(false);
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim komentar.");
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadPostImage(file, { folder: "nebeng/comments" });
      await handleSendComment(url, "image");
    } catch (err) {
      console.error(err);
      alert("Gagal upload gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Hapus komentar ini?")) return;

    try {
      const { error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus komentar");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7ff]">
        <div className="w-10 h-10 border-4 border-[#4e73df] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!post)
    return <div className="p-10 text-center">Postingan tidak ditemukan</div>;

  const leadComment = comments[0] || null;
  const threadComments = comments.slice(1);
  const threadPreviewUsers = threadComments.slice(0, 4);

  const CommentBody = ({ comment }) => {
    const isImage =
      comment.content.startsWith("http") &&
      (comment.content.includes("cloudinary") ||
        comment.content.match(/\.(jpeg|jpg|gif|png|webp)$/) != null);

    if (isImage) {
      return (
        <div className="mt-2 rounded-xl overflow-hidden border border-slate-100 max-w-[200px] shadow-sm">
          <img
            src={comment.content}
            alt="Comment Image"
            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(comment.content, "_blank")}
          />
        </div>
      );
    }
    return (
      <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
        {comment.content}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-[#f0f7ff] flex flex-col overflow-hidden">
      {/* 1. Header (Static) */}
      <div className="shrink-0 z-50 bg-white border-b border-slate-100 px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)] flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-100 text-slate-600 shadow-sm active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-[17px] text-slate-800">
          Detail & Diskusi
        </h1>
      </div>

      {/* 2. Fixed Top Content (Image + Description) */}
      <div className="shrink-0 flex flex-col bg-white border-b border-slate-100 shadow-sm z-10">
        {/* Hero Image */}
        <div className="h-[30vh] bg-slate-900 flex items-center justify-center overflow-hidden">
          <img
            src={
              post.item_photo ||
              "https://beritabeta.com/storage/img/2020/06/jastip-ota-ok-17668.jpg"
            }
            alt="Post"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Post Description Section (Fixed) */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <img
              src={post.users?.avatar_url}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-50"
              alt="Avatar"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="text-[15px] font-bold text-slate-900 leading-none truncate">
                      {post.users?.name}
                    </h2>
                    <span className="text-[11px] font-medium text-slate-400">
                      • {formatPostAge(post.created_at)}
                    </span>
                  </div>
                  <p className="mt-2.5 whitespace-pre-line text-[14px] leading-relaxed text-slate-600 line-clamp-2">
                    {post.description}
                  </p>
                </div>
                <button className="rounded-full p-2 text-slate-300 transition-colors hover:bg-slate-50">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50/50 border border-blue-100 px-3 py-1.5 text-[11px] font-semibold text-[#4e73df]">
                  <MapPin size={11} />
                  {post.to_city?.split(",")[0] || "Lokasi"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50/50 border border-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-600">
                  <DollarSign size={11} />
                  Rp{post.fee?.toLocaleString("id-ID") || "0"}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-50 pt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                  <Heart size={10} fill="currentColor" />2
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                  <Eye size={10} />
                  {Math.max(comments.length, 1)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#4e73df]">
                  <ThumbsUp size={10} />6
                </span>
                <div className="ml-auto flex -space-x-1.5">
                  {threadPreviewUsers.map((comment) => (
                    <img
                      key={comment.id}
                      src={comment.users?.avatar_url}
                      className="h-4.5 w-4.5 rounded-full border border-white object-cover shadow-sm"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Scrollable Comments Section */}
      <div className="flex-1 overflow-y-auto px-5 py-6 pb-32 space-y-5 bg-[#f0f7ff]">
        <h3 className="text-[13px] font-bold text-slate-900 px-1">
          Diskusi ({comments.length})
        </h3>

        {leadComment ? (
          <div className="space-y-4">
            {/* Lead Comment */}
            <div className="rounded-[22px] border border-[#e4edff] bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <img
                  src={leadComment.users?.avatar_url}
                  className="h-9 w-9 rounded-full object-cover border border-slate-50 shadow-sm"
                  alt={leadComment.users?.name || "Avatar"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[13px] font-bold text-slate-900 truncate">
                          {leadComment.users?.name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {formatTime(leadComment.created_at)}
                        </span>
                      </div>
                      <CommentBody comment={leadComment} />
                    </div>{" "}
                    {currentUser?.id === leadComment.user_id && (
                      <button
                        onClick={() => handleDeleteComment(leadComment.id)}
                        className="rounded-full p-1.5 text-slate-300 transition-colors hover:bg-slate-50 hover:text-rose-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Thread Comments */}
            {threadComments.map((comment) => (
              <div
                key={comment.id}
                className="ml-6 rounded-[22px] border border-slate-100 bg-white/70 p-4 shadow-sm relative"
              >
                <div className="absolute -left-3 top-[-16px] bottom-1/2 w-px bg-slate-200" />
                <div className="absolute -left-3 top-1/2 h-px w-3 bg-slate-200" />

                <div className="flex items-start gap-3">
                  <img
                    src={comment.users?.avatar_url}
                    className="h-9 w-9 rounded-full object-cover border border-slate-50"
                    alt={comment.users?.name || "Avatar"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[13px] font-bold text-slate-900 truncate">
                            {comment.users?.name}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {formatTime(comment.created_at)}
                          </span>
                        </div>
                        <CommentBody comment={comment} />
                      </div>{" "}
                      {currentUser?.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="rounded-full p-1.5 text-slate-300 transition-colors hover:bg-slate-50 hover:text-rose-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center bg-white/40 rounded-[32px] border border-dashed border-slate-200">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
              <MessageSquare size={20} />
            </div>
            <p className="text-[12px] font-medium text-slate-400">
              Belum ada diskusi
            </p>
          </div>
        )}
      </div>

      {/* Floating Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-3xl mx-auto flex flex-col gap-2.5">
          {/* Emoji Picker Simple */}
          {showEmojiPicker && (
            <div className="max-h-40 overflow-y-auto flex flex-wrap gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-xl animate-in fade-in slide-in-from-bottom-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setNewComment((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-2xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <div className="flex-1 relative flex items-center gap-2.5 rounded-[24px] bg-[#f5f7ff] px-4 py-1.5 shadow-inner border border-slate-100/50">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-slate-400 hover:text-[#4e73df] transition-colors"
              >
                <Smile size={20} />
              </button>

              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendComment()}
                placeholder="Tulis komentar..."
                className="w-full bg-transparent text-[13px] py-2.5 text-slate-700 outline-none placeholder:text-slate-400"
              />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-slate-400 hover:text-[#4e73df] transition-colors"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-[#4e73df] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Image size={20} />
                )}
              </button>
            </div>

            <button
              onClick={() => handleSendComment()}
              disabled={!newComment.trim() || sending || uploading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4e73df] text-white shadow-[0_8px_20px_rgba(78,115,223,0.3)] active:scale-95 transition-all disabled:opacity-50"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
