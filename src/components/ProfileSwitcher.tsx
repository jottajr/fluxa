"use client";

import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/lib/profile-context";
import type { ProfileType } from "@/types";

const inputClass =
  "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfileId, addProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ProfileType>("empresarial");
  const [newDocument, setNewDocument] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setShowNewForm(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newName) return;
    await addProfile({
      name: newName,
      type: newType,
      document: newDocument || null,
      icon: newType === "pessoal" ? "👤" : "🏢",
    });
    setNewName("");
    setNewDocument("");
    setShowNewForm(false);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <span>{activeProfile.icon}</span>
        <span className="hidden max-w-[120px] truncate font-medium text-slate-900 sm:inline dark:text-slate-100">
          {activeProfile.name}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Trocar perfil
          </p>
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => {
                setActiveProfileId(profile.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                profile.id === activeProfile.id
                  ? "bg-slate-100 dark:bg-slate-800"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <span>{profile.icon}</span>
              <span className="flex-1 text-slate-700 dark:text-slate-300">
                {profile.name} · {profile.type === "pessoal" ? "CPF" : "CNPJ"}
              </span>
              {profile.id === activeProfile.id && (
                <span className="text-slate-500 dark:text-slate-400">✓</span>
              )}
            </button>
          ))}

          <div className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-800">
            {!showNewForm ? (
              <button
                onClick={() => setShowNewForm(true)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60"
              >
                + Novo perfil (CPF ou CNPJ)
              </button>
            ) : (
              <form onSubmit={handleCreate} className="space-y-2 px-3 py-2">
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do perfil"
                  className={inputClass}
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ProfileType)}
                  className={inputClass}
                >
                  <option value="pessoal">Pessoal (CPF)</option>
                  <option value="empresarial">Empresarial (CNPJ)</option>
                </select>
                <input
                  value={newDocument}
                  onChange={(e) => setNewDocument(e.target.value)}
                  placeholder={
                    newType === "pessoal" ? "CPF (opcional)" : "CNPJ (opcional)"
                  }
                  className={inputClass}
                />
                <button
                  type="submit"
                  className="w-full rounded-md bg-slate-900 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                >
                  Criar perfil
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
