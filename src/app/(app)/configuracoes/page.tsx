"use client";

import { useState } from "react";
import { ACCENT_COLOR_OPTIONS, useAccentColor } from "@/lib/accent-color-context";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";
const cardClass =
  "tech-card space-y-4 rounded-lg border border-slate-200 bg-white shadow-md dark:shadow-lg dark:shadow-black/30 p-6 dark:border-slate-800 dark:bg-slate-900";

function SaveButton({ saved, label }: { saved: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        className="btn-primary rounded-md px-4 py-2 text-sm font-medium"
      >
        {label}
      </button>
      {saved && (
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
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
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Configurações
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gerencie seu perfil, preferências e notificações.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300">
        Tela de demonstração — as alterações ficam só nesta sessão, ainda não
        são salvas de verdade nem aplicadas ao restante do app.
      </div>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Perfil
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className={labelClass}>Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <SaveButton saved={profileSaved} label="Salvar perfil" />
        </form>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Aparência
        </h2>
        <div>
          <label className={labelClass}>Cor de destaque</label>
          <div className="flex gap-3">
            {ACCENT_COLOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAccentColor(option.value)}
                aria-label={option.label}
                aria-pressed={accentColor === option.value}
                className={`h-8 w-8 rounded-full transition-shadow ${
                  accentColor === option.value
                    ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900"
                    : ""
                }`}
                style={{ backgroundColor: option.swatch }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Aplica nos botões principais, no item ativo do menu e no seu avatar.
          </p>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
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
            <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
          )}
          <SaveButton saved={passwordSaved} label="Salvar senha" />
        </form>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Preferências financeiras
        </h2>
        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div>
            <label className={labelClass}>Moeda padrão</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass}
            >
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dólar (US$)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Formato de número</label>
            <select
              value={numberFormat}
              onChange={(e) => setNumberFormat(e.target.value)}
              className={inputClass}
            >
              <option value="pt-BR">1.234,56 (padrão Brasil)</option>
              <option value="en-US">1,234.56 (padrão EUA)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Dia de início do mês financeiro</label>
            <input
              type="number"
              min={1}
              max={28}
              value={monthStartDay}
              onChange={(e) => setMonthStartDay(e.target.value)}
              className={`${inputClass} max-w-[140px]`}
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Útil se você recebe salário no meio do mês e quer que os
              relatórios sigam esse ciclo em vez do mês do calendário.
            </p>
          </div>
          <SaveButton saved={preferencesSaved} label="Salvar preferências" />
        </form>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Notificações e alertas
        </h2>
        <form onSubmit={handleSaveNotifications} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Fatura próxima do vencimento
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Mostra um alerta na aba Pagamentos antes do vencimento.
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyDueSoon}
              onChange={(e) => setNotifyDueSoon(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
            />
          </div>
          {notifyDueSoon && (
            <div className="pl-0">
              <label className={labelClass}>Avisar com quantos dias de antecedência</label>
              <input
                type="number"
                min={1}
                max={15}
                value={dueSoonDays}
                onChange={(e) => setDueSoonDays(e.target.value)}
                className={`${inputClass} max-w-[140px]`}
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Fatura em atraso
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Mostra um alerta na aba Pagamentos quando houver fatura atrasada.
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyOverdue}
              onChange={(e) => setNotifyOverdue(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Notificações por e-mail
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Envia um resumo por e-mail (indisponível nesta demonstração).
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
            />
          </div>

          <SaveButton saved={notificationsSaved} label="Salvar notificações" />
        </form>
      </section>
    </div>
  );
}
