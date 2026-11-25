import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bot, LoaderCircle, Send, Sparkles } from "lucide-react";
import { apiFetch } from "../../lib/apiClient";
import { useLanguage } from "../../lib/LanguageContext";

const typeLabels = {
  nitip_bawakan: "Nitip Bawain",
  nitip_belikan: "Nitip Beliin",
  cari_boncengan: "Nyari Boncengan",
  tukang: "Nyari Tukang",
  perjalanan: "Dalam Perjalanan",
  keliling: "Jualan Keliling",
  content: "Konten",
};

export default function AiPostAssistant({ onBack }) {
  const { t } = useLanguage();
  const initialMessage = useMemo(() => ({
    role: "assistant",
    content: t("Hai! Ceritakan saja postingan yang ingin kamu buat. Aku akan bantu merapikan detailnya sebelum dipublikasikan."),
  }), [t]);
  const [messages, setMessages] = useState([initialMessage]);
  const [draft, setDraft] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, sending]);

  const send = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const conversation = [...messages, { role: "user", content: text }];
    setMessages(conversation);
    setInput("");
    setSending(true);
    setError("");

    try {
      const result = await apiFetch("/ai/post-assistant", {
        method: "POST",
        body: JSON.stringify({
          messages: conversation.filter((message) => message.role !== "assistant" || message !== initialMessage),
          draft,
        }),
      });
      setDraft({ ...result.post, ready: result.ready });
      setMessages([...conversation, { role: "assistant", content: result.reply }]);
    } catch (err) {
      setError(err.message || "Pesan belum terkirim. Coba lagi.");
    } finally {
      setSending(false);
    }
  };

  const createPost = async () => {
    if (!draft || posting) return;
    setPosting(true);
    setError("");
    const location = draft.location || draft.to_city || draft.from_city;

    try {
      await apiFetch("/posts", {
        method: "POST",
        body: JSON.stringify({
          type: draft.type,
          armada: draft.armada || "motor",
          from_city: draft.from_city || null,
          to_city: draft.to_city || null,
          travel_date: draft.travel_date || null,
          item_description: draft.item_description || null,
          price: draft.price ?? null,
          fee: draft.fee ?? null,
          description: draft.description || null,
          location: location ? { address: location } : null,
          status: "open",
        }),
      });
      onBack();
    } catch (err) {
      setError(err.message || "Postingan belum berhasil dibuat. Coba lagi.");
      setPosting(false);
    }
  };

  const summaryItems = draft
    ? [
        [t("Barang / kebutuhan"), draft.item_description],
        [t("Dari"), draft.from_city],
        [t("Ke"), draft.to_city],
        [t("Tanggal"), draft.travel_date],
        [t("Harga"), draft.price != null ? `Rp${Number(draft.price).toLocaleString("id-ID")}` : null],
        [t("Ongkos"), draft.fee != null ? `Rp${Number(draft.fee).toLocaleString("id-ID")}` : null],
        [t("Detail"), draft.description],
        [t("Lokasi"), draft.location],
      ].filter(([, value]) => value)
    : [];

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f0f7ff] px-4 pb-3 pt-6">
      <header className="mb-3 flex shrink-0 items-center gap-3">
        <button onClick={onBack} aria-label="Kembali" className="rounded-full bg-white p-3 text-black shadow">
          <ArrowLeft size={20} />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
          <Bot size={22} />
        </div>
        <div>
          <h2 className="font-bold">{t("Asisten buat postingan")}</h2>
          <p className="text-xs opacity-65">{t("Ceritakan kebutuhanmu lewat chat")}</p>
        </div>
      </header>

      <main className="flex-1 space-y-3 overflow-y-auto rounded-3xl bg-white/65 p-3">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${message.role === "user" ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md bg-white shadow-sm"}`}>
              {message.content}
            </p>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-sm opacity-60">
            <LoaderCircle size={16} className="animate-spin" /> Asisten sedang menyusun balasan...
          </div>
        )}

        {draft?.type && (
          <section className="mx-auto max-w-md rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Sparkles size={17} className="text-blue-600" />
              {t("Pratinjau")} · {t(typeLabels[draft.type] || "Postingan")}
            </div>
            {summaryItems.length > 0 && (
              <dl className="space-y-1 text-sm">
                {summaryItems.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[110px_1fr] gap-2">
                    <dt className="opacity-55">{label}</dt><dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {draft.ready && (
              <button onClick={createPost} disabled={posting || sending} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
                {posting ? t("Membuat postingan...") : t("Buat postingan")}
              </button>
            )}
          </section>
        )}
        <div ref={endRef} />
      </main>

      {error && <p role="alert" className="my-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={send} className="mt-3 flex shrink-0 items-end gap-2 rounded-2xl border border-blue-100 bg-white p-2 shadow-sm">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send(event);
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={t("Contoh: Aku mau nitip bawain paket ke Bandung...")}
          className="max-h-28 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm outline-none"
        />
        <button type="submit" disabled={!input.trim() || sending} aria-label="Kirim pesan" className="rounded-xl bg-blue-600 p-3 text-white disabled:opacity-40">
          <Send size={18} />
        </button>
      </form>
      <p className="mt-2 text-center text-[11px] opacity-55">{t("Periksa pratinjau sebelum postingan dibuat.")}</p>
    </div>
  );
}
