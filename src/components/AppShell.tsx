"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({
  userName,
  userEmail,
  children,
}: {
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Header
        userName={userName}
        userEmail={userEmail}
        onMenuClick={() => setDrawerOpen(true)}
      />
      <div className="flex flex-1">
        <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <main className="flex-1 overflow-x-hidden overflow-y-visible px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
