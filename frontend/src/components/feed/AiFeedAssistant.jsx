import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Send } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";

const suggestions = {
  id: ["Titip paket dari Jakarta ke Bandung besok", "Cari yang bisa bawain makanan ke rumah", "Ada yang berangkat ke Surabaya minggu ini?"],
  en: ["Send a package from Jakarta to Bandung tomorrow", "Find someone who can bring food to my home", "Anyone going to Surabaya this week?"],
};

export function AgentAvatar({ className = "h-10 w-10" }) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-300 via-blue-400 to-violet-500 shadow-sm ring-2 ring-white ${className}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" className="h-full w-full" fill="none">
        <path d="M9 44c1.7-8 7.1-12 15-12s13.3 4 15 12" fill="#FFF" />
        <path d="M14 21c0-8 4.1-13 10-13s10 5 10 13v5c0 6.1-4.3 10-10 10s-10-3.9-10-10v-5Z" fill="#FFD8B5" />
        <path d="M12 21c-.2-9.1 4.8-15 12.1-15 7.1 0 11.6 5.4 11.5 13.4-2.3-.8-4.1-2.4-5.1-4.6-3.3 2.9-8.5 4.4-15.1 4.4l-1.4 3.9-2-.1V21Z" fill="#273B75" />
        <path d="M19 24.2h.1M29 24.2h.1" stroke="#26345D" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M20.5 29c1 .9 2.2 1.4 3.5 1.4s2.5-.5 3.5-1.4" stroke="#D36F68" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M21 7.5c1.4-2.3 4.2-3.5 6.4-2.4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity=".9" />
      </svg>
      <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
    </span>
  );
}

const words = (value) =>
  value
    .toLocaleLowerCase("id-ID")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 2 && !["yang", "dari", "untuk", "bisa", "cari", "aku", "ada", "besok", "minggu", "ini", "the", "from", "and", "for", "with", "someone", "who", "can", "bring", "find", "anyone", "going", "this", "week", "send", "tomorrow", "my"].includes(word));

export default function AiFeedAssistant({ posts = [], onBack }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [input, setInput] = useState("");
  const [request, setRequest] = useState("");

  const recommendations = useMemo(() => {
    if (!request) return [];
    const terms = words(request);
    return [...posts]
      .map((post) => {
        const searchable = [post.from_city, post.to_city, post.item_description, post.description, post.type, post.armada]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("id-ID");
        const score = terms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0);
        return { post, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ post }) => post);
  }, [posts, request]);

  const submit = (value = input) => {
    const text = value.trim();
    if (!text) return;
    setRequest(text);
    setInput("");
  };

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-[#f0f7ff]">
      <header className="flex items-center gap-3 border-b border-blue-100 bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] shadow-sm">
        <button onClick={onBack} aria-label={t("Kembali ke pencarian")} className="rounded-full bg-slate-100 p-2.5 text-slate-600">
          <ArrowLeft size={19} />
        </button>
        <AgentAvatar className="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-slate-800">{t("Teman cari jasa")}</h2>
          <p className="text-xs text-slate-500">{t("Cerita aja, siapa tahu ada yang bisa bantu")}</p>
        </div>
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600">{t("MOCKUP")}</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto max-w-lg space-y-4">
          <div className="flex items-start gap-2">
            <AgentAvatar className="mt-1 h-8 w-8" />
            <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white p-3.5 text-sm leading-relaxed text-slate-700 shadow-sm">
              {t("Hai! Lagi butuh bantuan apa? Cerita aja—misalnya mau titip barang, pergi ke mana, atau butuhnya kapan. Nanti aku bantu carikan orang yang pas 😊")}
            </div>
          </div>

          {!request && (
            <section className="pl-10">
                <p className="mb-2 text-xs font-semibold text-slate-500">{t("Biar mulai ngobrol, pilih salah satu")}</p>
              <div className="flex flex-wrap gap-2">
                {suggestions[language].map((suggestion) => (
                  <button key={suggestion} onClick={() => submit(suggestion)} className="rounded-2xl border border-blue-100 bg-white px-3 py-2 text-left text-xs font-medium text-blue-700 shadow-sm transition hover:border-blue-300">
                    {suggestion}
                  </button>
                ))}
              </div>
            </section>
          )}

          {request && <>
            <div className="flex justify-end"><p className="max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm text-white">{request}</p></div>
            <div className="flex items-start gap-2">
              <AgentAvatar className="mt-1 h-8 w-8" />
              <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white p-3.5 text-sm text-slate-700 shadow-sm">
                {t("Siap, aku coba carikan yang cocok ya. Cek beberapa pilihan ini—ketuk salah satu untuk lihat detail dan ngobrol langsung dengan pemiliknya.")}
              </div>
            </div>
            <section className="space-y-3 pl-10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">{t("Rekomendasi post")}</h3>
                <span className="text-[11px] text-slate-500">{recommendations.length} {t("cocok")}</span>
              </div>
              {recommendations.length ? recommendations.map((post) => (
                <button key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="block w-full rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:border-blue-200">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-blue-600"><MapPin size={13} />{[post.from_city, post.to_city].filter(Boolean).join(" → ") || t("Lokasi belum dicantumkan")}</div>
                  <p className="line-clamp-2 text-sm font-semibold text-slate-800">{post.item_description || post.description || t("Lihat detail")}</p>
                  <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                    <span>{post.travel_date ? new Date(post.travel_date).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short" }) : t("Tanggal fleksibel")}</span>
                    <span>{post.fee != null ? `${t("Fee")} Rp ${Number(post.fee).toLocaleString(language === "en" ? "en-US" : "id-ID")}` : t("Lihat detail")}</span>
                  </div>
                </button>
              )) : <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">{t("Belum ada post yang cocok dengan kata kunci ini. Coba sebutkan kota atau kebutuhan lain.")}</div>}
              <button onClick={() => { setRequest(""); setInput(""); }} className="text-xs font-semibold text-blue-600">{t("Ubah kebutuhan")}</button>
            </section>
          </>}
        </div>
      </main>

      <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="border-t border-blue-100 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
        <div className="mx-auto flex max-w-lg items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }} rows={1} maxLength={500} placeholder={t("Ceritain yang kamu butuhkan...")} className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" />
          <button type="submit" disabled={!input.trim()} aria-label={t("Kirim chat")} className="rounded-xl bg-blue-600 p-3 text-white disabled:opacity-40"><Send size={17} /></button>
        </div>
        <p className="mx-auto mt-2 max-w-lg text-center text-[10px] text-slate-400">{t("Demo frontend · hasil dicocokkan dari post yang sudah dimuat")}</p>
      </form>
    </div>
  );
}
