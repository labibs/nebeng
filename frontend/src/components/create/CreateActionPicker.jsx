import { actions } from "./actions";
import { useLanguage } from "../../lib/LanguageContext";

export default function CreateActionPicker({ onSelect }) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 gap-4 mb-15">
      {actions.map(action => (
        <button
          key={action.key}
          onClick={() => onSelect(action.key)}
          className="
            p-4 rounded-2xl
            bg-white dark:bg-white/10
            shadow
            hover:scale-105 transition
            text-left
          "
        >
          <div className="text-3xl">{action.icon}</div>
          <div className="font-bold mt-2">{t(action.title)}</div>
          <div className="text-xs opacity-70">{t(action.desc)}</div>
        </button>
      ))}
    </div>
  );
}
