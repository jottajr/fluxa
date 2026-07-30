"use client";

import { useState } from "react";

const BASE_EMOJIS = [
  "🏠", "🔑", "🏢", "🍽️", "🛒", "🍔", "☕", "🚗",
  "⛽", "💰", "🎮", "📈", "💊", "📚", "✈️", "🎁",
  "📱", "💡", "🐾", "👶", "🏋️", "🎬", "🛠️", "🧾",
];

const EXTRA_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Esportes",
    emojis: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🏸", "🥊", "⛳", "🏆", "🥇", "🚴", "🏊", "🏂", "🎣"],
  },
  {
    label: "Bebidas",
    emojis: ["🍺", "🍻", "🍷", "🍹", "🥂", "🍸", "🥃", "🧃"],
  },
  {
    label: "Viagem",
    emojis: ["🧳", "🗺️", "🏖️", "🌍", "🚢", "🏔️", "🛫", "🏝️"],
  },
];

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState(EXTRA_CATEGORIES[0].label);

  const activeEmojis =
    EXTRA_CATEGORIES.find((c) => c.label === activeCategory)?.emojis ?? [];

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
        {BASE_EMOJIS.map((emoji) => (
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

      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs font-semibold text-[var(--accent)]"
        >
          + Mais opções
        </button>
      ) : (
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
          <div className="flex flex-wrap gap-1.5">
            {EXTRA_CATEGORIES.map((category) => (
              <button
                key={category.label}
                type="button"
                onClick={() => setActiveCategory(category.label)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  activeCategory === category.label
                    ? "bg-[var(--accent)] text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeEmojis.map((emoji) => (
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
      )}
    </div>
  );
}
