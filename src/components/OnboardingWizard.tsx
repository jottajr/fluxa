"use client";

import { useState } from "react";
import type {
  OnboardingIncome,
  OnboardingMotivation,
  OnboardingOrganization,
  OnboardingPaymentPattern,
  OnboardingPreferences,
} from "@/types";

interface StepOption {
  value: string;
  label: string;
}

interface StepConfig {
  key: keyof OnboardingPreferences;
  question: string;
  options: StepOption[];
}

const STEPS: StepConfig[] = [
  {
    key: "motivation",
    question: "O que te trouxe até aqui?",
    options: [
      { value: "dividas", label: "Sair das dívidas" },
      { value: "guardar", label: "Guardar dinheiro" },
      { value: "dia_a_dia", label: "Controlar o dia a dia" },
      { value: "visao_geral", label: "Ver tudo num só lugar" },
    ],
  },
  {
    key: "income",
    question: "Como é sua renda?",
    options: [
      { value: "fixa", label: "Fixa" },
      { value: "variavel", label: "Variável" },
      { value: "mista", label: "Mista" },
    ],
  },
  {
    key: "paymentPattern",
    question: "Você paga mais no crédito parcelado ou à vista/Pix?",
    options: [
      { value: "parcelado", label: "Majoritariamente parcelado" },
      { value: "misto", label: "Misto" },
      { value: "vista_pix", label: "Quase tudo à vista ou Pix" },
    ],
  },
  {
    key: "organization",
    question: "Você organiza as finanças sozinho ou com mais alguém?",
    options: [
      { value: "sozinho", label: "Sozinho" },
      { value: "parceiro", label: "Com cônjuge ou parceiro" },
      { value: "familia", label: "Com a família toda" },
    ],
  },
  {
    key: "proactiveAlerts",
    question: "Prefere que o app te avise proativamente ou só consultar quando quiser?",
    options: [
      { value: "true", label: "Me avisa sempre" },
      { value: "false", label: "Só quando eu abrir o app" },
    ],
  },
];

function toAnswers(prefs: OnboardingPreferences | null | undefined): Record<string, string> {
  if (!prefs) return {};
  return {
    motivation: prefs.motivation,
    income: prefs.income,
    paymentPattern: prefs.paymentPattern,
    organization: prefs.organization,
    proactiveAlerts: String(prefs.proactiveAlerts),
  };
}

export function OnboardingWizard({
  initialPreferences = null,
  onComplete,
  saving = false,
}: {
  initialPreferences?: OnboardingPreferences | null;
  onComplete: (prefs: OnboardingPreferences) => void;
  saving?: boolean;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    toAnswers(initialPreferences),
  );

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  function selectOption(value: string) {
    const next = { ...answers, [step.key]: value };
    setAnswers(next);

    if (isLast) {
      onComplete({
        motivation: next.motivation as OnboardingMotivation,
        income: next.income as OnboardingIncome,
        paymentPattern: next.paymentPattern as OnboardingPaymentPattern,
        organization: next.organization as OnboardingOrganization,
        proactiveAlerts: next.proactiveAlerts === "true",
      });
      return;
    }

    setTimeout(() => setStepIndex((i) => i + 1), 250);
  }

  return (
    <div className="w-full max-w-md rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface)] p-8">
      <div className="flex items-center gap-3">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={() => setStepIndex((i) => i - 1)}
            aria-label="Voltar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--background)]"
          >
            ‹
          </button>
        )}
        <div className="flex flex-1 gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className="h-1.5 flex-1 rounded-full"
              style={{
                backgroundColor: i <= stepIndex ? "var(--accent)" : "var(--background)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
        <span className="font-display text-sm font-bold text-[var(--foreground)]">Fluxa</span>
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
        Etapa {stepIndex + 1} de {STEPS.length}
      </p>
      <h1 className="font-display mt-2 text-2xl font-extrabold leading-tight text-[var(--foreground)]">
        {step.question}
      </h1>

      <div className="mt-6 space-y-3">
        {step.options.map((option) => {
          const selected = answers[step.key] === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={saving}
              onClick={() => selectOption(option.value)}
              className={`flex w-full items-center justify-between rounded-[12px] border px-4 py-3.5 text-left text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "border-[var(--accent)] text-[var(--foreground)]"
                  : "border-[var(--border-subtle)] text-[var(--foreground)] hover:border-[var(--accent)]/40"
              }`}
            >
              {option.label}
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: selected ? "var(--accent)" : "var(--border-subtle)",
                  backgroundColor: selected ? "var(--accent)" : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-center text-xs text-[var(--text-tertiary)]">
        Esta pergunta é obrigatória para personalizar seu Fluxa
      </p>
    </div>
  );
}
