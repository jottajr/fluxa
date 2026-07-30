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
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface)] px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="-ml-1.5 rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--accent)]/10 md:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-1.5 font-display text-lg font-extrabold text-[var(--foreground)]">
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
                : "hover:bg-[var(--accent)]/10"
            }`}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
              style={{
                backgroundColor: "color-mix(in oklch, var(--accent) 18%, white)",
                color: "color-mix(in oklch, var(--accent) 70%, black)",
              }}
            >
              {initial}
            </span>
            <span className="hidden text-sm font-medium text-[var(--foreground)] sm:inline">
              {userName}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] py-1 shadow-lg">
              <div className="border-b border-[var(--border-subtle)] px-3 py-2">
                <p className="truncate text-xs text-[var(--text-tertiary)]">
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
                        ? "bg-[var(--accent)]/12 text-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--accent)]/10"
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
