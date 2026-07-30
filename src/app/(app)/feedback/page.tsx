"use client";

import { useState } from "react";
import {
  useFeedback,
  type FeedbackType,
} from "@/lib/feedback-context";
import { formatDate } from "@/lib/format";

const TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: "dica", label: "Dica" },
  { value: "erro", label: "Erro" },
  { value: "sugestao", label: "Sugestão" },
];

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  resolvido: "Resolvido",
};

const STATUS_CLASSES: Record<string, string> = {
  novo: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  em_analise:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  resolvido:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const cardClass = "rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)]";

export default function FeedbackPage() {
  const { feedback, addFeedback } = useFeedback();
  const [type, setType] = useState<FeedbackType>("dica");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    await addFeedback(type, message.trim());
    setMessage("");
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
          Feedback
        </h1>
        <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
          Manda uma dica, um erro que encontrou ou uma sugestão. Só você vê
          essa caixa
        </p>
      </div>

      <div className={`${cardClass} p-6`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`rounded-[11px] px-3.5 py-1.5 text-[13px] font-bold ${
                  type === option.value
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]/40"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Conte o que você percebeu ou gostaria de ver no Fluxa"
            rows={4}
            className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-[11px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold text-white"
            >
              Enviar feedback
            </button>
            {sent && (
              <span className="text-sm font-medium" style={{ color: "var(--chart-positive)" }}>
                ✓ Enviado
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-sm font-bold text-[var(--foreground)]">
          Seu histórico
        </h2>
        {feedback.length === 0 && (
          <p className="text-sm text-[var(--text-tertiary)]">
            Você ainda não enviou nenhum feedback.
          </p>
        )}
        {feedback.map((entry) => (
          <div key={entry.id} className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
                {TYPE_OPTIONS.find((o) => o.value === entry.type)?.label} ·{" "}
                {formatDate(entry.createdAt)}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASSES[entry.status]}`}
              >
                {STATUS_LABELS[entry.status]}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">
              {entry.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
