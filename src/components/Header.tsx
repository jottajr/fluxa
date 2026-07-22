"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";

export function Header({
  userName,
  userEmail,
  onMenuClick,
}: {
  userName: string;
  userEmail: string;
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const accountLinks = [
    { href: "/importar-exportar", label: "Importar/Exportar" },
    { href: "/feedback", label: "Feedback" },
    { href: "/configuracoes", label: "Configurações" },
  ];
  const isAccountSectionActive = accountLinks.some((link) =>
    pathname.startsWith(link.href),
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = userName.charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="-ml-1.5 rounded-md p-1.5 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-1.5 text-lg font-semibold text-slate-900 dark:text-slate-100">
          <img src="/fluxa-icon.png" alt="" className="h-7 w-7" />
          Fluxa
        </span>
        <ProfileSwitcher />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle compact />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
              isAccountSectionActive
                ? "ring-1 ring-[var(--accent)]"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span className="btn-primary flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold">
              {initial}
            </span>
            <span className="hidden text-sm font-medium text-slate-900 sm:inline dark:text-slate-100">
              {userName}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {userEmail}
                </p>
              </div>
              {accountLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-3 py-2 text-sm ${
                      isActive
                        ? "btn-primary"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <button
                onClick={handleSignOut}
                className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
