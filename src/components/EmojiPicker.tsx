const SUGGESTED_EMOJIS = [
  "🏠", "🔑", "🏢", "🍽️", "🛒", "🍔", "☕", "🚗",
  "⛽", "💰", "🎮", "📈", "💊", "📚", "✈️", "🎁",
  "📱", "💡", "🐾", "👶", "🏋️", "🎬", "🛠️", "🧾",
];

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-300 text-2xl dark:border-slate-700">
          {value || "🏷️"}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          placeholder="Cole ou escolha um emoji abaixo"
          maxLength={4}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTED_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${
              value === emoji ? "bg-slate-100 dark:bg-slate-800" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
