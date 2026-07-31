"use client";

import { useEffect, useState } from "react";
import { ACCENT_COLOR_OPTIONS, useAccentColor } from "@/lib/accent-color-context";
import { useFinanceData } from "@/lib/finance-data-context";
import { clearDemoNonCardData, findDemoCards, seedDemoData } from "@/lib/demo-data";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";
const cardClass = "rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface)]";
const rowClass =
  "flex flex-wrap items-center justify-between gap-4 border-b border-[var(--background)] px-6 py-4 last:border-b-0";

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className={rowClass}>
      <div>
        <p className="text-[13.5px] font-semibold text-[var(--foreground)]">{label}</p>
        <p className="mt-0.5 text-[11.5px] font-medium text-[var(--text-tertiary)]">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

function SaveButton({ saved, label }: { saved: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        className="rounded-[11px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold text-white"
      >
        {label}
      </button>
      {saved && (
        <span className="text-sm font-medium" style={{ color: "var(--chart-positive)" }}>
          ✓ Salvo
        </span>
      )}
    </div>
  );
}

function useSavedFlag() {
  const [saved, setSaved] = useState(false);
  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  return [saved, flash] as const;
}

export default function ConfiguracoesPage() {
  const { accentColor, setAccentColor } = useAccentColor();
  const {
    categories,
    transactions,
    cards,
    budgetGoals,
    financialGoals,
    investmentPositions,
    investmentReturns,
    addCard,
    addTransactions,
    addBudgetGoal,
    addFinancialGoal,
    addFinancialGoalContribution,
    addInvestmentPosition,
    addInvestmentReturn,
    deleteTransactions,
    deleteBudgetGoal,
    deleteCard,
    deleteFinancialGoal,
    deleteInvestmentPositions,
    deleteInvestmentReturns,
  } = useFinanceData();
  const [demoLoading, setDemoLoading] = useState<"seed" | "clear" | null>(null);
  const [demoMessage, setDemoMessage] = useState("");
  const [removingDemoCards, setRemovingDemoCards] = useState(false);

  async function handleSeedDemo() {
    setDemoLoading("seed");
    setDemoMessage("");
    try {
      await seedDemoData({
        categories,
        addCard,
        addTransactions,
        addBudgetGoal,
        addFinancialGoal,
        addFinancialGoalContribution,
        addInvestmentPosition,
        addInvestmentReturn,
      });
      setDemoMessage("Dados de exemplo criados em todas as abas.");
    } finally {
      setDemoLoading(null);
    }
  }

  async function handleClearDemo() {
    setDemoLoading("clear");
    setDemoMessage("");
    await clearDemoNonCardData({
      transactions,
      cards,
      budgetGoals,
      financialGoals,
      investmentPositions,
      investmentReturns,
      deleteTransactions,
      deleteBudgetGoal,
      deleteFinancialGoal,
      deleteInvestmentPositions,
      deleteInvestmentReturns,
    });
    // o cartão só pode ser removido numa renderização seguinte, quando
    // `cards`/`deleteCard` já refletem as exclusões acima — ver findDemoCards
    setRemovingDemoCards(true);
  }

  useEffect(() => {
    if (!removingDemoCards) return;
    (async () => {
      for (const card of findDemoCards(cards)) {
        await deleteCard(card.id);
      }
      setRemovingDemoCards(false);
      setDemoLoading(null);
      setDemoMessage("Dados de exemplo removidos.");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removingDemoCards]);

  const [name, setName] = useState("Jotta");
  const [email, setEmail] = useState("jottamoreirajr@uol.com.br");
  const [profileSaved, flashProfile] = useSavedFlag();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, flashPassword] = useSavedFlag();

  const [currency, setCurrency] = useState("BRL");
  const [numberFormat, setNumberFormat] = useState("pt-BR");
  const [monthStartDay, setMonthStartDay] = useState("1");
  const [preferencesSaved, flashPreferences] = useSavedFlag();

  const [notifyDueSoon, setNotifyDueSoon] = useState(true);
  const [dueSoonDays, setDueSoonDays] = useState("5");
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notificationsSaved, flashNotifications] = useSavedFlag();

  function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    flashProfile();
  }

  function handleSavePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Preencha todos os campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("A nova senha e a confirmação não coincidem.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    flashPassword();
  }

  function handleSavePreferences(event: React.FormEvent) {
    event.preventDefault();
    flashPreferences();
  }

  function handleSaveNotifications(event: React.FormEvent) {
    event.preventDefault();
    flashNotifications();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <h1 className="font-display text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
          Configurações
        </h1>
        <p className="mt-0.5 text-sm font-medium text-[var(--text-tertiary)]">
          Preferências da sua conta e workspace
        </p>
      </div>

      <div
        className="rounded-[14px] border px-4 py-3 text-sm"
        style={{
          borderColor: "color-mix(in oklch, var(--accent) 30%, transparent)",
          backgroundColor: "color-mix(in oklch, var(--accent) 8%, transparent)",
          color: "var(--foreground)",
        }}
      >
        Tela de demonstração — as alterações ficam só nesta sessão, ainda não
        são salvas de verdade nem aplicadas ao restante do app.
      </div>

      <form onSubmit={handleSaveProfile}>
        <div className={cardClass}>
          <SettingsRow label="Nome" description="Como você aparece no app">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} max-w-[220px]`}
            />
          </SettingsRow>
          <SettingsRow label="E-mail" description="Usado para acesso e notificações">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} max-w-[260px]`}
            />
          </SettingsRow>
        </div>
        <div className="mt-4">
          <SaveButton saved={profileSaved} label="Salvar perfil" />
        </div>
      </form>

      <div className={cardClass + " p-6"}>
        <p className="font-display mb-3 text-sm font-bold text-[var(--foreground)]">
          Cor de destaque
        </p>
        <div className="flex gap-3">
          {ACCENT_COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAccentColor(option.value)}
              aria-label={option.label}
              aria-pressed={accentColor === option.value}
              className="h-8 w-8 rounded-full border-2 border-[var(--surface)] transition-shadow"
              style={{
                backgroundColor: option.swatch,
                boxShadow:
                  accentColor === option.value
                    ? "0 0 0 2px var(--accent)"
                    : "0 0 0 2px rgba(0,0,0,.08)",
              }}
            />
          ))}
        </div>
        <p className="mt-3 text-xs font-medium text-[var(--text-tertiary)]">
          Aplica nos botões principais, no item ativo do menu e no seu avatar.
        </p>
      </div>

      <form onSubmit={handleSavePreferences}>
        <div className={cardClass}>
          <SettingsRow label="Moeda padrão" description="Moeda usada nos relatórios">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`${inputClass} max-w-[180px]`}
            >
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dólar (US$)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </SettingsRow>
          <SettingsRow label="Formato de número" description="Como os valores são exibidos">
            <select
              value={numberFormat}
              onChange={(e) => setNumberFormat(e.target.value)}
              className={`${inputClass} max-w-[220px]`}
            >
              <option value="pt-BR">1.234,56 (padrão Brasil)</option>
              <option value="en-US">1,234.56 (padrão EUA)</option>
            </select>
          </SettingsRow>
          <SettingsRow
            label="Dia de início do mês financeiro"
            description="Útil se você recebe salário no meio do mês"
          >
            <input
              type="number"
              min={1}
              max={28}
              value={monthStartDay}
              onChange={(e) => setMonthStartDay(e.target.value)}
              className={`${inputClass} max-w-[100px]`}
            />
          </SettingsRow>
        </div>
        <div className="mt-4">
          <SaveButton saved={preferencesSaved} label="Salvar preferências" />
        </div>
      </form>

      <form onSubmit={handleSaveNotifications}>
        <div className={cardClass}>
          <SettingsRow
            label="Fatura próxima do vencimento"
            description="Mostra um alerta na aba Pagamentos antes do vencimento"
          >
            <div className="flex items-center gap-3">
              {notifyDueSoon && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={dueSoonDays}
                    onChange={(e) => setDueSoonDays(e.target.value)}
                    className={`${inputClass} max-w-[70px]`}
                    placeholder="Nº de dias"
                    aria-label="Dias de antecedência para avisar do vencimento"
                  />
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">
                    dias antes
                  </span>
                </div>
              )}
              <input
                type="checkbox"
                checked={notifyDueSoon}
                onChange={(e) => setNotifyDueSoon(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
              />
            </div>
          </SettingsRow>
          <SettingsRow
            label="Fatura em atraso"
            description="Mostra um alerta na aba Pagamentos quando houver fatura atrasada"
          >
            <input
              type="checkbox"
              checked={notifyOverdue}
              onChange={(e) => setNotifyOverdue(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
            />
          </SettingsRow>
          <SettingsRow
            label="Notificações por e-mail"
            description="Envia um resumo por e-mail (indisponível nesta demonstração)"
          >
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
            />
          </SettingsRow>
        </div>
        <div className="mt-4">
          <SaveButton saved={notificationsSaved} label="Salvar notificações" />
        </div>
      </form>

      <div className={cardClass + " p-6"}>
        <h2 className="font-display mb-4 text-sm font-bold text-[var(--foreground)]">
          Segurança
        </h2>
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label className={labelClass}>Senha atual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className={labelClass}>Nova senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className={labelClass}>Confirmar nova senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          {passwordError && (
            <p className="text-sm" style={{ color: "var(--chart-negative)" }}>
              {passwordError}
            </p>
          )}
          <SaveButton saved={passwordSaved} label="Salvar senha" />
        </form>
      </div>

      <div
        className="rounded-[14px] border border-dashed p-6"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <h2 className="font-display mb-1 text-sm font-bold text-[var(--foreground)]">
          Ferramentas de desenvolvimento
        </h2>
        <p className="mb-4 text-[11.5px] font-medium text-[var(--text-tertiary)]">
          Popula sua conta com lançamentos fictícios (cartão, transações, meta e
          investimentos) pra você visualizar as telas funcionando. Diferente das seções
          acima, isso grava dados de verdade — mas todos marcados, então dá pra remover
          com segurança a qualquer momento sem afetar seus dados reais. Antes do Fluxa
          virar produto pra outras pessoas, essa seção deve sair do ar.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedDemo}
            disabled={demoLoading !== null}
            className="rounded-[11px] bg-[var(--accent)] px-[18px] py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
          >
            {demoLoading === "seed" ? "Criando..." : "Popular dados de exemplo"}
          </button>
          <button
            onClick={handleClearDemo}
            disabled={demoLoading !== null}
            className="rounded-[11px] border border-[var(--border-subtle)] px-[18px] py-2.5 text-[13px] font-bold text-[var(--text-secondary)] disabled:opacity-60"
          >
            {demoLoading === "clear" ? "Removendo..." : "Limpar dados de exemplo"}
          </button>
          {demoMessage && (
            <span className="text-xs font-medium" style={{ color: "var(--chart-positive)" }}>
              {demoMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
