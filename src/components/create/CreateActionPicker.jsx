import { actions } from "./actions";

export default function CreateActionPicker({ onSelect }) {
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
          <div className="font-bold mt-2">{action.title}</div>
          <div className="text-xs opacity-70">{action.desc}</div>
        </button>
      ))}
    </div>
  );
}
