import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../lib/supabaseClient";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Info,
  MessageSquare,
  Send,
  User,
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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch Post
      const { data: postData } = await supabase
        .from("posts")
        .select("*, users(*)")
        .eq("id", postId)
        .single();

      if (postData) setPost(postData);

      // Fetch Comments (assuming table exists, if not we'll handle gracefully)
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

  const handleSendComment = async () => {
    if (!newComment.trim() || sending) return;
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
          content: newComment.trim(),
        })
        .select("*, users(*)")
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setNewComment("");
    } catch (err) {
      console.error(err);
      alert(
        "Gagal mengirim komentar. Pastikan tabel 'post_comments' sudah dibuat.",
      );
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fbff]">
        <div className="w-10 h-10 border-4 border-[#4e73df] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!post)
    return <div className="p-10 text-center">Postingan tidak ditemukan</div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-slate-800">
          Postingan & Komentar
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Hero Image */}
        <div className="w-full bg-slate-900 flex items-center justify-center overflow-hidden h-64">
          <img
            src={
              post.item_photo ||
              "https://beritabeta.com/storage/img/2020/06/jastip-ota-ok-17668.jpg"
            }
            alt="Post"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Post Content */}
          <div className="flex items-start gap-3">
            <img
              src={post.users?.avatar_url}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#4e73df]/10"
              alt="Avatar"
            />
            <div className="flex-1 bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
              <h2 className="font-bold text-sm text-slate-900">
                {post.users?.name}
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {post.description}
              </p>
              <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <MapPin size={10} /> {post.to_city?.split(",")[0]}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={10} /> Rp{post.fee?.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-1">
              Diskusi ({comments.length})
            </h3>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={comment.users?.avatar_url}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                      alt="avatar"
                    />
                    <div className="flex-1">
                      <div className="bg-slate-100/50 p-3 rounded-2xl rounded-tl-none border border-slate-50">
                        <p className="text-xs font-bold text-slate-800">
                          {comment.users?.name}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1.5 ml-1 font-medium">
                        {format(new Date(comment.created_at), "d MMM, HH:mm", {
                          locale: localeId,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <MessageSquare
                    size={32}
                    className="mx-auto text-slate-200 mb-2"
                  />
                  <p className="text-sm text-slate-400">Belum ada komentar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 z-50">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendComment()}
              placeholder="Tulis komentar..."
              className="w-full bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-[#4e73df]/20 outline-none transition-all"
            />
          </div>
          <button
            onClick={handleSendComment}
            disabled={!newComment.trim() || sending}
            className="w-11 h-11 rounded-full bg-[#4e73df] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50"
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
  );
}
