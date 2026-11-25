import { useLanguage } from "../../lib/LanguageContext";

const quickReplies = [
  "Bisa nego fee / ongkos jastip?",
  "Boleh COD / ketemuan di lokasi?",
  "Kapan jadwal keberangkatan?",
  "Barangnya ukuran & beratnya berapa?",
  "Apakah aman dibawa di bagasi?",
];

export default function QuickReplies({ onSelect }) {
  const { t } = useLanguage();
  return (
    <div className="px-4 py-2 overflow-x-auto no-scrollbar">
      <div className="flex gap-2">
        {quickReplies.map((text, i) => (
          <button
            key={i}
            onClick={() => onSelect(t(text))}
            className="btn btn-xs rounded-full whitespace-nowrap bg-base-200 hover:bg-base-300"
          >
            {t(text)}
          </button>
        ))}
      </div>
    </div>
  );
}
