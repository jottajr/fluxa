"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface ProfileContextValue {
  profiles: Profile[];
  activeProfileId: string;
  activeProfile: Profile;
  setActiveProfileId: (id: string) => void;
  addProfile: (profile: Omit<Profile, "id">) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfiles() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, type, document, icon")
        .order("created_at", { ascending: true });

      if (!active) return;

      if (error || !data || data.length === 0) {
        setLoadError(true);
        setLoading(false);
        return;
      }

      setProfiles(data);
      setActiveProfileId(data[0].id);
      setLoading(false);
    }

    loadProfiles();
    return () => {
      active = false;
    };
  }, []);

  async function addProfile(profile: Omit<Profile, "id">) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        account_id: user.id,
        name: profile.name,
        type: profile.type,
        document: profile.document,
        icon: profile.icon,
      })
      .select("id, name, type, document, icon")
      .single();

    if (!error && data) {
      setProfiles((prev) => [...prev, data]);
      setActiveProfileId(data.id);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Carregando...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <p className="max-w-sm text-center text-sm text-red-600 dark:text-red-400">
          Não foi possível carregar seus perfis. Tente recarregar a página ou
          entre em contato caso o problema continue.
        </p>
      </div>
    );
  }

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfileId,
        activeProfile,
        setActiveProfileId,
        addProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile deve ser usado dentro de ProfileProvider");
  }
  return ctx;
}
