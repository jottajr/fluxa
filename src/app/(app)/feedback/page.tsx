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
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Feedback
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manda uma dica, um erro que encontrou ou uma sugestão. Só você vê
          essa caixa.
        </p>
      </div>

      <div className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-6 dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  type === option.value
                    ? "btn-primary"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
              className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
            >
              Enviar feedback
            </button>
            {sent && (
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                ✓ Enviado
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Seu histórico
        </h2>
        {feedback.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Você ainda não enviou nenhum feedback.
          </p>
        )}
        {feedback.map((entry) => (
          <div
            key={entry.id}
            className="tech-card rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {TYPE_OPTIONS.find((o) => o.value === entry.type)?.label} ·{" "}
                {formatDate(entry.createdAt)}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[entry.status]}`}
              >
                {STATUS_LABELS[entry.status]}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {entry.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
